// Ported from anton-tesla-api-ws tests/test_reports_sheet.py, against the tests' throwaway PostgreSQL.
import type { Client } from "pg";
import { afterAll, beforeAll, beforeEach, expect, test, vi } from "vitest";
import { ownDatabase, publishedReads, putInterval, seedIntervals, storeMeterDays, storeReads } from "@/test/true-up";

let owner: Client;
let grid: typeof import("./grid");

beforeAll(async () => {
  owner = await ownDatabase("tsr_grid");
  grid = await import("./grid");
});

beforeEach(async () => {
  await owner.query("DELETE FROM meter_read; DELETE FROM energy_interval; DELETE FROM meter_day");
});

afterAll(async () => {
  await owner.end();
  vi.unstubAllEnvs();
});

const published = async (...years: number[]) => { for (const year of years) await storeReads(owner, year); };

test("a cycle's grid energy is split at peak", async () => {
  await storeReads(owner, 2026, [...publishedReads(2026).slice(0, 10), "2026-11-04", "2026-12-05"]);
  await seedIntervals(owner, "2026-11-04", "2026-12-04", { grid_imported_wh: 10, grid_exported_from_solar_wh: 4 });

  const [cycle] = await grid.cycles("2026-11-04", "2026-11-04");

  expect(cycle).toMatchObject({ first_day: "2026-11-04", last_day: "2026-12-04", imported: 89.3, exported: 35.7, net: 53.6, peak_net: 11.2, off_peak_net: 42.4 });
});

test("peak is 4 to 9 p.m. site time", async () => {
  await published(2026);
  for (const time of ["15:55", "16:00", "20:55", "21:00"]) await putInterval(owner, `2026-06-10 ${time}`, { grid_imported_wh: 1000 });

  const [cycle] = await grid.cycles("2026-06-05", "2026-06-05");

  expect([cycle.peak_net, cycle.off_peak_net]).toEqual([2, 2]);
});

test("peak follows site time across the fall back", async () => {
  for (const time of ["16:00", "20:55", "21:00"]) await putInterval(owner, `2026-11-01 ${time}`, { grid_imported_wh: 1000 });
  // 1 a.m. on November 1, 2026 happens twice: 08:00 UTC (PDT) and 09:00 UTC (PST).
  for (const utc of ["08:00", "09:00"])
    await owner.query("INSERT INTO energy_interval VALUES ($1, '2026-11-01', 0, 100, 0, 0, 0, 0, 0, 0, 0, 0)", [`2026-11-01T${utc}:00Z`]);

  const { days } = await grid.dailyGrid("2026-11-01", "2026-11-01");

  expect(days["2026-11-01"]).toEqual({ imported: 3200, exported: 0, peak_net: 2000 });
});

test("the Powerwall's exports count", async () => {
  await published(2026);
  await putInterval(owner, "2026-08-20 18:00", { grid_exported_from_solar_wh: 20000 });
  await putInterval(owner, "2026-08-20 18:05", { grid_exported_from_battery_wh: 10000 });

  const [cycle] = await grid.cycles("2026-08-04", "2026-08-04");

  expect([cycle.exported, cycle.net]).toEqual([30, -30]);
});

test("the open cycle runs through its last day with data, and later cycles have null totals", async () => {
  await published(2026);
  await seedIntervals(owner, "2026-10-05", "2026-10-21", { grid_imported_wh: 1 });

  const [open, ...later] = await grid.cycles("2026-10-01", "2027-09-30");

  expect([open.first_day, open.through, open.uncorrected_days]).toEqual(["2026-10-05", "2026-10-21", 0]);
  expect(later.every((c) => c.imported === null && c.net === null && c.through === null)).toBe(true);
});

test("cycles carry their true-up year", async () => {
  await published(2024, 2025, 2026);

  const cycles = await grid.cycles("2024-10-01", "2026-09-30");

  // '24 - '25 ends the day before the October 3, 2025 read.
  expect([cycles[11].last_day, cycles[11].true_up]).toEqual(["2025-10-02", "'24 - '25"]);
  expect(cycles[12].true_up).toBe("'25 - '26");
  expect(new Set(cycles.map((c) => c.true_up))).toEqual(new Set(["'24 - '25", "'25 - '26"]));
});

test("unpublished years use the estimate", async () => {
  const cycles = await grid.cycles("2022-03-01", "2022-03-31");

  // Monday, March 7, 2022 (the 6th is a Sunday), then Wednesday, April 6.
  expect(cycles.map((c) => [c.first_day, c.last_day])).toEqual([["2022-03-07", "2022-04-05"]]);
});

const DECEMBER = ["2025-12-05", "2025-12-05"] as const;

test("a corrected cycle takes PG&E's readings", async () => {
  await published(2025, 2026);
  await seedIntervals(owner, "2025-12-05", "2026-01-05", { grid_imported_wh: 10 });
  await storeMeterDays(owner, "2025-12-05", "2026-01-05");

  const [cycle] = await grid.cycles(...DECEMBER);

  // 32 days of 40 in and 8 out, 10 and 2 of them at peak.
  expect(cycle).toMatchObject({ first_day: "2025-12-05", last_day: "2026-01-05", imported: 1280, exported: 256, net: 1024, peak_net: 256, off_peak_net: 768, uncorrected_days: 0 });
});

test("a partly corrected cycle counts the rest", async () => {
  await published(2025, 2026);
  await seedIntervals(owner, "2025-12-05", "2026-01-05", { grid_imported_wh: 10 });
  await storeMeterDays(owner, "2025-12-05", "2025-12-19");

  const [cycle] = await grid.cycles(...DECEMBER);

  // 15 PG&E days of 40 kWh, then 17 Tesla days of 288 intervals at 10 Wh.
  expect([cycle.imported, cycle.uncorrected_days]).toEqual([649, 17]);
});

test("a range without data has null totals", async () => {
  expect((await grid.cycles("2022-10-23", "2023-10-22")).every((c) => c.net === null)).toBe(true);
});
