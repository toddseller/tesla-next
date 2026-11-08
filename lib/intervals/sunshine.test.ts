// Ported from anton-tesla-api-ws tests/test_sunshine.py (the parts the intervals read uses), with the same values.
import { Client } from "pg";
import { afterAll, beforeAll, expect, inject, test, vi } from "vitest";

const pg = inject("pg");
let sunshine: typeof import("./sunshine");
let owner: Client;

const COLUMNS = [
  "grid_imported_wh", "grid_exported_from_solar_wh", "grid_exported_from_battery_wh", "battery_exported_wh",
  "battery_imported_from_grid_wh", "battery_imported_from_solar_wh", "house_from_grid_wh", "house_from_solar_wh",
  "house_from_battery_wh",
];

// The three 5-minute intervals of one quarter-hour, each `wh` of solar.
async function quarter(day: string, utcStart: number, wh: number) {
  for (const minutes of [0, 5, 10]) {
    await owner.query(
      `INSERT INTO energy_interval (start_at, day, solar_generated_wh, ${COLUMNS.join(", ")}) VALUES ($1, $2, $3${", 0".repeat(COLUMNS.length)})`,
      [new Date(utcStart + minutes * 60_000), day, wh],
    );
  }
}

beforeAll(async () => {
  vi.stubEnv("DATABASE_URL", `postgresql://${pg.user}:${pg.password}@/${pg.database}?host=${pg.host}`);
  sunshine = await import("./sunshine");
  owner = new Client({ ...pg });
  await owner.connect();
  // This file's days only: the intervals endpoint's tests share energy_interval on other days.
  await owner.query("DELETE FROM energy_interval WHERE day IN ('2026-10-19', '2026-10-31', '2026-11-02', '2026-11-03')");
});

afterAll(async () => {
  await owner.end();
  vi.unstubAllEnvs();
});

// 19:00 UTC is noon by the clock on 10/31 (PDT) and 11 AM on 11/2 (PST): the same sun.
const NOON_SLOT = 19 * 4;

test("the reference is the best quarter at the same sun over the 14 days before", async () => {
  await quarter("2026-10-31", Date.UTC(2026, 9, 31, 19), 500);
  await quarter("2026-11-02", Date.UTC(2026, 10, 2, 19), 400);
  // The day itself and the 15th day before don't count.
  await quarter("2026-11-03", Date.UTC(2026, 10, 3, 19), 600);
  await quarter("2026-10-19", Date.UTC(2026, 9, 19, 19), 700);

  const reference = await sunshine.reference("2026-11-03");

  expect([...reference.keys()]).toEqual([NOON_SLOT]);
  expect(reference.get(NOON_SLOT)).toBeCloseTo(6.0, 12);
});

test.each([
  [6.4, 6.5, 0.985],
  [0.5, 3.6, 0.139],
  [7.0, 6.5, 1],
  [0.5, 0.8, null],
  [null, 6.5, null],
  [3.0, null, null],
  [0, 6.5, 0],
])("share of %s kW against a best of %s kW is %s", (output, best, sun) => {
  const share = sunshine.share(output, best);
  if (sun === null) expect(share).toBeNull();
  else expect(share).toBeCloseTo(sun, 3);
});

test("the slot follows UTC, so the same sun keeps its slot across daylight saving", () => {
  expect(sunshine.slot(Date.UTC(2026, 9, 31, 19, 10))).toBe(NOON_SLOT);
  expect(sunshine.slot(Date.UTC(2026, 10, 2, 19, 14))).toBe(NOON_SLOT);
});

test("a quarter's output needs all three of its intervals", () => {
  const start = Date.UTC(2026, 10, 3, 19);
  const solar = new Map([[start, 500], [start + 300_000, 520], [start + 600_000, 540]]);
  expect(sunshine.quarterKw(solar, start)).toBeCloseTo(6.24, 12);
  solar.delete(start + 600_000);
  expect(sunshine.quarterKw(solar, start)).toBeNull();
});
