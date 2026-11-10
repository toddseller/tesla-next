// The weekly checks (system-checks spec), against a database of their own.
import type { Client } from "pg";
import { afterAll, beforeAll, beforeEach, expect, test, vi } from "vitest";

import { shiftDay } from "@/lib/scene/replay";
import { ownDatabase } from "@/test/true-up";

let owner: Client;
let checks: typeof import("./checks");

const days = (first: string, count: number) =>
  Array.from({ length: count }, (_, i) => new Date(Date.parse(`${first}T00:00:00Z`) + i * 86_400_000).toISOString().slice(0, 10));

// A week of PG&E's meter and Tesla's figures, kWh spread evenly over its days.
async function week(first: string, pge: { in: number; out: number }, tesla: { in: number; solarOut: number; powerwallOut: number }) {
  for (const date of days(first, 7)) {
    await owner.query("INSERT INTO meter_day VALUES ($1, $2, $3, 0, 0)", [date, Math.round((pge.in * 1000) / 7), Math.round((pge.out * 1000) / 7)]);
    await owner.query("INSERT INTO data (date, from_grid, to_grid, powerwall_to_grid) VALUES ($1, $2, $3, $4)", [date, tesla.in / 7, tesla.solarOut / 7, tesla.powerwallOut / 7]);
  }
}

beforeAll(async () => {
  owner = await ownDatabase("tsr_checks");
  checks = await import("./checks");
});

beforeEach(() => owner.query("DELETE FROM meter_day; DELETE FROM data; DELETE FROM solar_forecast; DELETE FROM energy_interval"));

afterAll(async () => {
  await owner.end();
  vi.unstubAllEnvs();
});

test("a healthy week passes, the Powerwalls' exports counted with solar's", async () => {
  await week("2026-11-01", { in: 120, out: 60 }, { in: 119, solarOut: 45, powerwallOut: 14 });
  expect(await checks.meterCheck()).toMatch(/^ok meter: /);
});

test("the metering fault fails at 48% of PG&E's meter", async () => {
  await week("2026-11-01", { in: 120, out: 60 }, { in: 58, solarOut: 59, powerwallOut: 0 });
  const line = await checks.meterCheck();
  expect(line).toMatch(/^FAIL meter: /);
  expect(line).toContain("imports are 48% of PG&E's meter");
});

test("a direction under 10 kWh on PG&E's meter isn't judged, and the other still is", async () => {
  await week("2026-11-01", { in: 4, out: 60 }, { in: 1, solarOut: 30, powerwallOut: 0 });
  const line = await checks.meterCheck();
  expect(line).toMatch(/^FAIL meter: /);
  expect(line).toContain("exports are 50%");
  expect(line).not.toContain("imports are");
});

test("only the newest 7 meter days count", async () => {
  await week("2026-10-01", { in: 120, out: 60 }, { in: 10, solarOut: 5, powerwallOut: 0 });
  await week("2026-11-01", { in: 120, out: 60 }, { in: 120, solarOut: 60, powerwallOut: 0 });
  expect(await checks.meterCheck()).toMatch(/^ok meter: .*Nov 1 – 7, 2026/);
});

test("PG&E's readings more than 5 days old fail, naming the last day", async () => {
  await week("2026-11-06", { in: 70, out: 7 }, { in: 70, solarOut: 7, powerwallOut: 0 });
  expect(await checks.staleCheck("2026-11-14")).toMatch(/^ok meter readings: /);
  expect(await checks.staleCheck("2026-11-20")).toBe("FAIL meter readings: PG&E's readings stop at November 12, 2026");
});

// Solar generated for each day of a 30-day window, the best three days given.
async function solarWindow(first: string, best: number[], rest = 30, count = 30) {
  for (const [i, date] of days(first, count).entries()) {
    await owner.query("INSERT INTO data (date, solar_generated) VALUES ($1, $2)", [date, best[i] ?? rest]);
  }
}

test("the April microinverter fault fails at 92% of the lowest past April", async () => {
  // Windows of the 30 days to April 30, 2025, and the same days in 2022 to 2024.
  for (const [year, third] of [[2022, 69.5], [2023, 69.4], [2024, 69.2]] as const) await solarWindow(`${year}-04-01`, [80, 75, third]);
  await solarWindow("2025-04-01", [70, 66, 64.0]);
  expect(await checks.outputCheck("2025-05-01")).toBe("FAIL solar output: the third-best day of Apr 1 – 30, 2025 is 64.0 kWh, 92% of the lowest past year's (69.2 kWh)");
});

test("a foggy month inside the history's spread passes", async () => {
  for (const [year, third] of [[2022, 64.2], [2023, 72.4], [2024, 76.4]] as const) await solarWindow(`${year}-07-01`, [80, 79, third]);
  await solarWindow("2025-07-01", [70, 66, 63.0]);
  expect(await checks.outputCheck("2025-07-31")).toMatch(/^ok solar output: /);
});

test("a past year with under 25 days of the window is left out", async () => {
  // Counted, 2022's 40 kWh would let this April pass.
  await solarWindow("2022-04-01", [50, 45, 40], 30, 20);
  for (const [year, third] of [[2023, 69.4], [2024, 69.2]] as const) await solarWindow(`${year}-04-01`, [80, 75, third]);
  await solarWindow("2025-04-01", [70, 66, 64.0]);
  expect(await checks.outputCheck("2025-05-01")).toMatch(/^FAIL solar output: /);
});

test("a day Tesla's figures are missing, or a day without exports, is left out of both sides rather than read as Tesla short", async () => {
  await week("2026-11-01", { in: 120, out: 60 }, { in: 120, solarOut: 60, powerwallOut: 0 });
  await owner.query("DELETE FROM data WHERE date = '2026-11-07'");
  await owner.query("UPDATE data SET to_grid = NULL WHERE date = '2026-11-03'");
  expect(await checks.meterCheck()).toMatch(/^ok meter: Nov 1 – 6, 2026, 5 days both have/);
});

// A day's forecast and one interval holding its peak, in watts: a multiple of 12, as an interval holds whole Wh.
async function sunDay(day: string, mj: number, peakW: number | null) {
  await owner.query("INSERT INTO solar_forecast (day, radiation_mj, weather_code, fetched_at) VALUES ($1, $2, 0, now())", [day, mj]);
  if (peakW !== null) {
    await owner.query("INSERT INTO energy_interval VALUES ($1::date + time '12:00' AT TIME ZONE 'America/Los_Angeles', $1, $2, 0, 0, 0, 0, 0, 0, 0, 0, 0)", [day, peakW / 12]);
  }
}

// The 30 days before a judged day: bright days at the given peaks, the rest dull.
async function peakWindow(judged: string, peaks: number[], brightMj = 20, dullMj = 8) {
  for (const [i, day] of days(shiftDay(judged, -30), 30).entries()) await sunDay(day, i < peaks.length ? brightMj : dullMj, peaks[i] ?? 3000);
}

// Another year's forecasts, without intervals, to set a season's clear-day forecast.
async function clearDays(first: string, count: number, mj: number) {
  for (const day of days(first, count)) await sunDay(day, mj, null);
}

test("the microinverter fault's first bright day fails at 52% of the usual bright-day peak", async () => {
  await clearDays("2025-02-01", 120, 25);
  await peakWindow("2026-04-13", Array(25).fill(8448));
  await sunDay("2026-04-13", 24.4, 4416);
  expect(await checks.peakCheck("2026-04-14")).toBe("FAIL solar peak: April 13, 2026's peak was 52% of the usual bright-day peak (4.4 of 8.4 kW) https://teslasolar.report/?day=2026-04-13");
});

test("a foggy summer morning that still peaks as usual passes", async () => {
  await clearDays("2021-06-01", 120, 25);
  await peakWindow("2022-08-02", Array(10).fill(10080));
  await sunDay("2022-08-02", 22.6, 10440);
  expect(await checks.peakCheck("2022-08-03")).toMatch(/^ok solar peak: August 2, 2022's peak was 104% /);
  expect(await checks.peakCheck("2022-08-03")).not.toContain("https://");
});

test("a dull day passes unjudged, saying why", async () => {
  await clearDays("2025-02-01", 120, 25);
  await peakWindow("2026-04-12", Array(25).fill(8448));
  await sunDay("2026-04-12", 10.3, 4320);
  expect(await checks.peakCheck("2026-04-13")).toBe("ok solar peak: April 12, 2026 was too dull to judge (10.3 MJ/m² forecast, 41% of a clear day's 25.0)");
});

test("a day without a forecast passes unjudged, saying why", async () => {
  await peakWindow("2026-04-12", Array(25).fill(8448));
  await owner.query("INSERT INTO energy_interval VALUES ('2026-04-12 19:00Z', '2026-04-12', 300, 0, 0, 0, 0, 0, 0, 0, 0, 0)");
  expect(await checks.peakCheck("2026-04-13")).toBe("ok solar peak: April 12, 2026 has no forecast to judge it by");
});

test("fewer than 5 bright days in the 30 before pass unjudged, saying why", async () => {
  await clearDays("2024-11-01", 120, 25);
  await peakWindow("2026-01-10", Array(4).fill(6000));
  await sunDay("2026-01-10", 16, 2004);
  expect(await checks.peakCheck("2026-01-11")).toBe("ok solar peak: too few bright days before January 10, 2026 to judge it (4)");
});

test("a day with no interval stored fails", async () => {
  await peakWindow("2026-04-12", Array(25).fill(8448));
  await owner.query("INSERT INTO solar_forecast (day, radiation_mj, weather_code, fetched_at) VALUES ('2026-04-12', 8, 0, now())");
  expect(await checks.peakCheck("2026-04-13")).toBe("FAIL solar peak: no solar was stored for April 12, 2026 https://teslasolar.report/?day=2026-04-12");
});

test("an even number of bright days takes the lower middle peak", async () => {
  // The upper middle (9 kW) or the average of the two (7 kW) would fail 4 kW.
  await clearDays("2025-02-01", 120, 25);
  await peakWindow("2026-04-12", [5004, 5004, 5004, 9000, 9000, 9000]);
  await sunDay("2026-04-12", 20, 4008);
  expect(await checks.peakCheck("2026-04-13")).toMatch(/^ok solar peak: .* 80% .*\(4\.0 of 5\.0 kW\)$/);
});

test("a failing microinverter in December fails, though no December day reaches a summer day's sunlight", async () => {
  await clearDays("2025-10-15", 90, 10.6);
  await peakWindow("2026-12-15", Array(15).fill(6000), 9, 3);
  await sunDay("2026-12-15", 9.8, 3000);
  expect(await checks.peakCheck("2026-12-16")).toBe("FAIL solar peak: December 15, 2026's peak was 50% of the usual bright-day peak (3.0 of 6.0 kW) https://teslasolar.report/?day=2026-12-15");
});

test("a date's clear-day forecast counts the days across the new year", async () => {
  // Without January 1 to 12, December 28's clear day would be the window's 20 MJ/m², and 16 MJ/m² bright.
  await clearDays("2026-01-01", 12, 40);
  await peakWindow("2026-12-28", Array(15).fill(6000));
  await sunDay("2026-12-28", 16, 3000);
  expect(await checks.peakCheck("2026-12-29")).toBe("ok solar peak: December 28, 2026 was too dull to judge (16.0 MJ/m² forecast, 40% of a clear day's 40.0)");
});

test("a window whose bright days made nothing fails rather than reading 0 of 0 kW", async () => {
  await clearDays("2025-02-01", 120, 25);
  await peakWindow("2026-04-12", Array(20).fill(0));
  await sunDay("2026-04-12", 20, 0);
  expect(await checks.peakCheck("2026-04-13")).toBe("FAIL solar peak: no bright day in the 30 before April 12, 2026 made any solar https://teslasolar.report/?day=2026-04-12");
});
