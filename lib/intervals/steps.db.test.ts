// meter-correction, "Corrected 5-minute import" and "Corrected 5-minute export", against a database of its own.
import type { Client } from "pg";
import { afterAll, beforeAll, beforeEach, expect, test, vi } from "vitest";

import { ownDatabase, putInterval } from "@/test/true-up";

let owner: Client;
let db: typeof import("@/lib/db").db;
let energySteps: typeof import("./steps").energySteps;

type Step = { at: string; grid_imported_wh: number; grid_exported_from_solar_wh: number; house_from_grid_wh: number; house_from_solar_wh: number; house_from_battery_wh: number };

const steps = async (readings: "corrected" | "tesla", day: string) =>
  (
    await db.query<Step>(
      `SELECT to_char(start_at AT TIME ZONE 'America/Los_Angeles', 'HH24:MI') AS at, grid_imported_wh, grid_exported_from_solar_wh,
         house_from_grid_wh, house_from_solar_wh, house_from_battery_wh
       FROM ${energySteps(readings, "day = $1")} AS s ORDER BY start_at`,
      [day],
    )
  ).rows.map((row) => Object.fromEntries(Object.entries(row).map(([key, value]) => [key, typeof value === "string" ? value : Math.round(Number(value))])));

const meter = (day: string, importedWh: number, exportedWh: number) =>
  owner.query("INSERT INTO meter_day VALUES ($1, $2, $3, 0, 0)", [day, importedWh, exportedWh]);

// A night step on the grid, a night step on the Powerwall and a sunny step exporting, as Tesla stored them.
async function threeSteps(day: string) {
  await putInterval(owner, `${day} 01:00`, { grid_imported_wh: 300, house_from_grid_wh: 300 });
  await putInterval(owner, `${day} 02:00`, { battery_exported_wh: 100, house_from_battery_wh: 100 });
  await putInterval(owner, `${day} 12:00`, { solar_generated_wh: 500, grid_exported_from_solar_wh: 300, house_from_solar_wh: 200 });
}

beforeAll(async () => {
  owner = await ownDatabase("tsr_steps");
  ({ db } = await import("@/lib/db"));
  ({ energySteps } = await import("./steps"));
});

beforeEach(() => owner.query("DELETE FROM energy_interval; DELETE FROM meter_day"));

afterAll(async () => {
  await owner.end();
  vi.unstubAllEnvs();
});

// The Powerwall's own meter read right, so a step it fed keeps its figures while the grid-fed steps take the difference.
test("a corrected day's import difference lands on its grid-fed steps by their home use from the grid", async () => {
  await threeSteps("2025-12-10");
  await meter("2025-12-10", 700, 300);
  expect(await steps("corrected", "2025-12-10")).toEqual([
    { at: "01:00", grid_imported_wh: 700, grid_exported_from_solar_wh: 0, house_from_grid_wh: 700, house_from_solar_wh: 0, house_from_battery_wh: 0 },
    { at: "02:00", grid_imported_wh: 0, grid_exported_from_solar_wh: 0, house_from_grid_wh: 0, house_from_solar_wh: 0, house_from_battery_wh: 100 },
    { at: "12:00", grid_imported_wh: 0, grid_exported_from_solar_wh: 300, house_from_grid_wh: 0, house_from_solar_wh: 200, house_from_battery_wh: 0 },
  ]);
});

test("a corrected day's export difference comes out of the sunny steps' home use of solar, never below zero", async () => {
  await threeSteps("2025-12-10");
  await meter("2025-12-10", 300, 800);
  const noon = (await steps("corrected", "2025-12-10"))[2];
  expect([noon.grid_exported_from_solar_wh, noon.house_from_solar_wh]).toEqual([800, 0]);
});

test("a day with no home use from the grid gets PG&E's import by the steps' home use from the Powerwall", async () => {
  await putInterval(owner, "2025-07-10 01:00", { battery_exported_wh: 200, house_from_battery_wh: 200 });
  await putInterval(owner, "2025-07-10 02:00", { battery_exported_wh: 400, house_from_battery_wh: 400 });
  await meter("2025-07-10", 600, 0);
  const found = await steps("corrected", "2025-07-10");
  expect(found.map((step) => step.grid_imported_wh)).toEqual([200, 400]);
  expect(found.map((step) => step.house_from_grid_wh)).toEqual([200, 400]);
});

test("a day with no home use from the grid or the Powerwall gets the difference evenly", async () => {
  await putInterval(owner, "2025-07-10 12:00", { solar_generated_wh: 500, house_from_solar_wh: 500 });
  await putInterval(owner, "2025-07-10 12:05", { solar_generated_wh: 500, house_from_solar_wh: 500 });
  await meter("2025-07-10", 200, 0);
  expect((await steps("corrected", "2025-07-10")).map((step) => step.grid_imported_wh)).toEqual([100, 100]);
});

test("Tesla's readings, a day without PG&E's reading and a day from the fix are as stored", async () => {
  await threeSteps("2025-12-10");
  await meter("2025-12-10", 700, 300);
  await threeSteps("2025-12-11");
  await threeSteps("2026-05-10");
  await meter("2026-05-10", 700, 300);
  for (const [readings, day] of [["tesla", "2025-12-10"], ["corrected", "2025-12-11"], ["corrected", "2026-05-10"]] as const)
    expect((await steps(readings, day)).map((step) => step.grid_imported_wh)).toEqual([300, 0, 0]);
});
