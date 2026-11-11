// Ported from anton-tesla-api-ws tests/test_live_rest.py's and test_meter_corrections.py's impact tests, with the same
// values, against the tests' throwaway PostgreSQL. range.db.test.ts clears the same tables, so this file has a database
// of its own.
import type { Client } from "pg";
import { afterAll, beforeAll, beforeEach, expect, test, vi } from "vitest";
import { ownDatabase } from "@/test/true-up";

let owner: Client;
let impactFigures: typeof import("./impact").impactFigures;

// anton's energy(): 20.9 kWh of solar, 10.1 in, 0.7 out, and 17.0 kWh of house use, 9.9 from the grid, 4.3 from solar
// and 2.8 from the Powerwall.
const PLAIN = {
  solar_generated: 20.9, from_grid: 10.1, to_grid: 0.7, house_from_grid: 9.9, house_from_solar: 4.3, house_from_powerwall: 2.8,
  total_house_usage: 17.0,
};
// A winter day before the April 27, 2026 fix: 20 kWh in, 4 out, 30 kWh of house use (10 grid, 15 solar, 5 Powerwall).
const TESLA_WINTER = { from_grid: 20.0, to_grid: 4.0, house_from_grid: 10.0, house_from_solar: 15.0, house_from_powerwall: 5.0, total_house_usage: 30.0 };

async function seedDay(date: string, overrides: Partial<typeof PLAIN> = {}) {
  const v = { ...PLAIN, ...overrides };
  await owner.query(
    `INSERT INTO data (date, solar_generated, from_grid, to_grid, house_from_grid, house_from_solar, house_from_powerwall, total_house_usage)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [date, v.solar_generated, v.from_grid, v.to_grid, v.house_from_grid, v.house_from_solar, v.house_from_powerwall, v.total_house_usage],
  );
}

beforeAll(async () => {
  owner = await ownDatabase("tsr_impact");
  ({ impactFigures } = await import("./impact"));
});

beforeEach(async () => {
  await owner.query("DELETE FROM data; DELETE FROM meter_day");
});

afterAll(async () => {
  await owner.end();
  vi.unstubAllEnvs();
});

test("a range of saved days sums each figure and takes each share of the house", async () => {
  await seedDay("2026-03-01");
  await seedDay("2026-03-02");
  expect(await impactFigures("2026-03-01", "2026-03-31", "corrected")).toEqual({
    total_solar: 41.8, total_house: 34.0, from_grid: 19.8, from_solar: 8.6, from_powerwall: 5.6,
    from_grid_percentage: 58, from_solar_percentage: 25, from_powerwall_percentage: 16,
    self_powered_percentage: 41, total_solar_percentage: 123,
  });
});

test("a range without saved days is all zeros", async () => {
  expect(Object.values(await impactFigures("2026-10-17", "2026-10-17", "corrected"))).toEqual(Array(10).fill(0));
});

test("shares come from the meter-corrected house before the fix", async () => {
  await seedDay("2025-12-10", TESLA_WINTER);
  await owner.query("INSERT INTO meter_day VALUES ($1, $2, $3, 0, 0)", ["2025-12-10", 40_000, 8_000]);
  const impact = await impactFigures("2025-12-10", "2025-12-10", "corrected");
  expect([impact.total_house, impact.from_grid, impact.from_solar, impact.from_powerwall]).toEqual([46.0, 30.0, 11.0, 5.0]);
  expect([impact.from_grid_percentage, impact.from_solar_percentage, impact.from_powerwall_percentage]).toEqual([65, 24, 11]);
});

test("Tesla's readings take the shares from the house as stored", async () => {
  await seedDay("2025-12-10", TESLA_WINTER);
  await owner.query("INSERT INTO meter_day VALUES ($1, $2, $3, 0, 0)", ["2025-12-10", 40_000, 8_000]);
  const impact = await impactFigures("2025-12-10", "2025-12-10", "tesla");
  expect([impact.total_house, impact.from_grid, impact.from_solar, impact.from_powerwall]).toEqual([30.0, 10.0, 15.0, 5.0]);
});

test("a share on an exact half rounds to even, as Python's round does", async () => {
  await seedDay("2026-03-03", { house_from_grid: 7, house_from_solar: 1, house_from_powerwall: 0, total_house_usage: 8 });
  const impact = await impactFigures("2026-03-03", "2026-03-03", "corrected");
  expect([impact.from_solar_percentage, impact.from_grid_percentage]).toEqual([12, 88]);
});
