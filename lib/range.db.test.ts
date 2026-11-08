// Ported from anton-tesla-api-ws tests/test_reports_formatted.py, test_meter_corrections.py and
// test_intervals_api.py's formatted test, with the same values, against the tests' throwaway PostgreSQL.
import { Client } from "pg";
import { afterAll, beforeAll, beforeEach, describe, expect, inject, test, vi } from "vitest";

const pg = inject("pg");
let owner: Client;
let rangeTotals: typeof import("./range").rangeTotals;

type Day = Partial<{
  solar_generated: number; from_grid: number; to_grid: number; powerwall_to_grid: number; is_vpp: boolean; total_house_usage: number;
}>;

// anton's energy(): 20.9 kWh of solar, 10.1 in, 0.7 out, 17.0 kWh of house usage.
const PLAIN = { solar_generated: 20.9, from_grid: 10.1, to_grid: 0.7, powerwall_to_grid: 0, is_vpp: false, total_house_usage: 17.0 };
// A winter day before the April 27, 2026 fix: 20 kWh in, 4 out and 30 kWh of house usage.
const TESLA_WINTER = { from_grid: 20.0, to_grid: 4.0, powerwall_to_grid: 0, total_house_usage: 30.0 };

async function seedDays(first: string, last: string, overrides: Day = {}) {
  const values = { ...PLAIN, ...overrides };
  await owner.query(
    `INSERT INTO data (date, solar_generated, from_grid, to_grid, powerwall_to_grid, is_vpp, total_house_usage)
     SELECT to_char(d, 'YYYY-MM-DD'), $3, $4, $5, $6, $7, $8 FROM generate_series($1::date, $2::date, '1 day') d`,
    [first, last, values.solar_generated, values.from_grid, values.to_grid, values.powerwall_to_grid, values.is_vpp, values.total_house_usage],
  );
}

const storeMeter = (day: string, importedKwh: number, exportedKwh: number) =>
  owner.query("INSERT INTO meter_day VALUES ($1, $2, $3, 0, 0)", [day, importedKwh * 1000, exportedKwh * 1000]);

beforeAll(async () => {
  vi.stubEnv("DATABASE_URL", `postgresql://${pg.user}:${pg.password}@/${pg.database}?host=${pg.host}`);
  vi.resetModules();
  ({ rangeTotals } = await import("./range"));
  owner = new Client({ ...pg });
  await owner.connect();
});

beforeEach(async () => {
  await owner.query("DELETE FROM data; DELETE FROM meter_day");
});

afterAll(async () => {
  await owner.end();
  vi.unstubAllEnvs();
});

describe("daily items", () => {
  test("up to 31 days after the start, one item per saved day with its date, day and figures", async () => {
    await seedDays("2026-01-01", "2026-02-01");
    const items = await rangeTotals("2026-01-01", "2026-02-01");
    expect(items).toHaveLength(32);
    expect(items[0]).toEqual({ date: "Jan 1", day: "2026-01-01", solar: 20.9, grid: 9.4, house: 17.0 });
  });

  test("a range across a new year labels its days", async () => {
    await seedDays("2025-12-31", "2026-01-01");
    const items = await rangeTotals("2025-12-20", "2026-01-10");
    expect(items.map((i) => [i.date, i.day])).toEqual([["Dec 31", "2025-12-31"], ["Jan 1", "2026-01-01"]]);
  });

  test("days without totals are left out", async () => {
    await seedDays("2021-10-10", "2021-10-31");
    const items = await rangeTotals("2021-10-01", "2021-10-31");
    expect(items[0].day).toBe("2021-10-10");
    expect(items).toHaveLength(22);
  });

  test("grid rounds an exact tie to even, as Python's round does", async () => {
    await seedDays("2026-03-03", "2026-03-03", { from_grid: 10.75, to_grid: 0.5 });
    expect((await rangeTotals("2026-03-03", "2026-03-03"))[0].grid).toBe(10.2);
  });

  test("solar is the stored value, unrounded", async () => {
    await seedDays("2026-03-03", "2026-03-03", { solar_generated: 20.25 });
    expect((await rangeTotals("2026-03-03", "2026-03-03"))[0].solar).toBe(20.25);
  });

  test("a VPP day's grid leaves out the Powerwall's exports; other days count them", async () => {
    await seedDays("2026-07-01", "2026-07-01", { from_grid: 10, to_grid: 3, powerwall_to_grid: 2, is_vpp: true });
    await seedDays("2026-07-02", "2026-07-02", { from_grid: 10, to_grid: 3, powerwall_to_grid: 2 });
    expect((await rangeTotals("2026-07-01", "2026-07-02")).map((i) => i.grid)).toEqual([7, 5]);
  });

  test("an empty range has no items", async () => {
    expect(await rangeTotals("2022-01-01", "2022-01-31")).toEqual([]);
  });
});

describe("meter corrections", () => {
  test("a corrected winter day uses PG&E's grid and derives the house", async () => {
    await seedDays("2025-12-10", "2025-12-10", TESLA_WINTER);
    await storeMeter("2025-12-10", 40, 8);
    const [day] = await rangeTotals("2025-12-10", "2025-12-10");
    expect([day.grid, day.house]).toEqual([32.0, 46.0]);
  });

  test("months add up corrected days", async () => {
    await seedDays("2025-12-10", "2025-12-10", TESLA_WINTER);
    await storeMeter("2025-12-10", 40, 8);
    const [month] = await rangeTotals("2025-12-01", "2026-01-31");
    expect([month.date, month.grid, month.house]).toEqual(["Dec-25", 32.0, 46.0]);
  });

  test("days from the fix keep Tesla's figures", async () => {
    await seedDays("2026-05-10", "2026-05-10");
    await storeMeter("2026-05-10", 99, 1);
    const [day] = await rangeTotals("2026-05-10", "2026-05-10");
    expect([day.grid, day.house]).toEqual([9.4, 17.0]);
  });

  test("days without meter data keep Tesla's figures", async () => {
    await seedDays("2023-03-03", "2023-03-03");
    const [day] = await rangeTotals("2023-03-03", "2023-03-03");
    expect([day.grid, day.house]).toEqual([9.4, 17.0]);
  });
});

describe("periods", () => {
  test("calendar months", async () => {
    await seedDays("2026-01-01", "2026-06-30");
    const items = await rangeTotals("2026-01-01", "2026-06-30");
    expect(items.map((i) => i.date)).toEqual(["Jan-26", "Feb-26", "Mar-26", "Apr-26", "May-26", "Jun-26"]);
    expect(items[0].solar).toBe(647.9);
    expect(items[0]).not.toHaveProperty("day");
  });

  test("a partial first month", async () => {
    await seedDays("2026-01-01", "2026-06-30");
    expect((await rangeTotals("2026-01-15", "2026-06-30"))[0].solar).toBe(355.3);
  });

  test("a range 32 days long is cut into periods", async () => {
    await seedDays("2026-01-01", "2026-02-02");
    expect((await rangeTotals("2026-01-01", "2026-02-02")).map((i) => i.date)).toEqual(["Jan-26", "Feb-26"]);
  });

  test("months without data are null", async () => {
    const items = await rangeTotals("2022-01-01", "2022-06-30");
    expect(items).toHaveLength(6);
    expect(items.every((i) => i.solar === null && i.grid === null && i.house === null)).toBe(true);
  });
});
