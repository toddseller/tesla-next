// The weekly checks (system-checks spec), against a database of their own.
import type { Client } from "pg";
import { afterAll, beforeAll, beforeEach, expect, test, vi } from "vitest";

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

beforeEach(() => owner.query("DELETE FROM meter_day; DELETE FROM data"));

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
