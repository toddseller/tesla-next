// solarHours() (home-story spec, "The year's solar by day and hour"): a year's solar by site day and hour, against a database of its own.
import type { Client } from "pg";
import { afterAll, beforeAll, beforeEach, expect, test, vi } from "vitest";

import { ownDatabase, putInterval } from "@/test/true-up";

let owner: Client;
let solar: typeof import("./solar-hours");
const TODAY = "2026-11-21";

beforeAll(async () => {
  owner = await ownDatabase("tsr_solar_hours");
  solar = await import("./solar-hours");
});

beforeEach(async () => {
  globalThis.solarHoursKept?.clear();
  await owner.query("DELETE FROM energy_interval");
});

afterAll(async () => {
  await owner.end();
  vi.unstubAllEnvs();
});

const hoursOf = (days: Awaited<ReturnType<typeof solar.solarHours>>, day: string) => days.find((d) => d.day === day)?.kwh;

test("a day's 5 minute solar adds up in its site hours, in kWh", async () => {
  await putInterval(owner, "2026-06-13 12:00", { solar_generated_wh: 700 });
  await putInterval(owner, "2026-06-13 12:55", { solar_generated_wh: 800 });
  await putInterval(owner, "2026-06-13 13:00", { solar_generated_wh: 600 });
  const kwh = hoursOf(await solar.solarHours(2026, TODAY), "2026-06-13")!;
  expect(kwh).toHaveLength(24);
  expect(kwh[12]).toBeCloseTo(1.5);
  expect(kwh[13]).toBeCloseTo(0.6);
  expect(kwh[11]).toBe(0);
});

test("across the autumn clock change, the hour that happens twice holds both", async () => {
  await putInterval(owner, "2026-11-01 00:30", { solar_generated_wh: 0 });
  await owner.query(`INSERT INTO energy_interval (start_at, day, solar_generated_wh, grid_imported_wh, grid_exported_from_solar_wh, grid_exported_from_battery_wh,
    battery_exported_wh, battery_imported_from_grid_wh, battery_imported_from_solar_wh, house_from_grid_wh, house_from_solar_wh, house_from_battery_wh)
    VALUES ('2026-11-01T08:30:00Z', '2026-11-01', 10, 0, 0, 0, 0, 0, 0, 0, 0, 0), ('2026-11-01T09:30:00Z', '2026-11-01', 20, 0, 0, 0, 0, 0, 0, 0, 0, 0)`);
  expect(hoursOf(await solar.solarHours(2026, TODAY), "2026-11-01")![1]).toBeCloseTo(0.03);
});

test("no day after today, and the year's days only", async () => {
  await putInterval(owner, "2025-12-31 12:00", { solar_generated_wh: 100 });
  await putInterval(owner, "2026-01-01 12:00", { solar_generated_wh: 100 });
  await putInterval(owner, "2026-11-22 12:00", { solar_generated_wh: 100 });
  expect((await solar.solarHours(2026, TODAY)).map((d) => d.day)).toEqual(["2026-01-01"]);
});

test("2021 starts on October 22, the system's first day in service", async () => {
  await putInterval(owner, "2021-10-21 12:00", { solar_generated_wh: 100 });
  await putInterval(owner, "2021-10-22 12:00", { solar_generated_wh: 100 });
  expect((await solar.solarHours(2021, TODAY)).map((d) => d.day)).toEqual(["2021-10-22"]);
});

test("a totals notice for today works the current year out again and keeps a past one", async () => {
  await putInterval(owner, "2025-06-13 12:00", { solar_generated_wh: 1000 });
  await putInterval(owner, "2026-11-21 12:00", { solar_generated_wh: 1000 });
  await solar.solarHours(2025, TODAY);
  await solar.solarHours(2026, TODAY);
  await owner.query("UPDATE energy_interval SET solar_generated_wh = 2000");
  await solar.refreshSolarHours(TODAY);
  expect(hoursOf(await solar.solarHours(2026, TODAY), TODAY)![12]).toBeCloseTo(2);
  expect(hoursOf(await solar.solarHours(2025, TODAY), "2025-06-13")![12]).toBeCloseTo(1);
});
