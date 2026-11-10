// The Health page's figures from health()'s rows (health-page spec).
import { expect, test } from "vitest";

import { lastTwelve, latestFigures, powerwallYears, sameMonth } from "./health";

const NOVEMBERS = [
  { month: "2021-11", watts: 132 }, { month: "2022-11", watts: 384 }, { month: "2024-11", watts: 300 },
  { month: "2025-09", watts: 264 }, { month: "2025-11", watts: 276 },
  { month: "2026-09", watts: 840 }, { month: "2026-11", watts: 864 },
];

test("the latest month against the same month a year earlier, in kWh a day", () => {
  expect(latestFigures(NOVEMBERS, "2026-11-10")).toEqual({
    label: "November so far", watts: 864, before: { label: "November 2025", watts: 276 }, kwhPerDay: 14,
  });
  expect(latestFigures([{ month: "2025-03", watts: 720 }, { month: "2026-03", watts: 300 }], "2026-03-20")?.kwhPerDay).toBe(-10);
});

test("before a December night counts, the figures are November's, named with its year", () => {
  expect(latestFigures(NOVEMBERS, "2026-12-01")?.label).toBe("November 2026");
});

test("without a year-earlier month there is only the latest figure", () => {
  expect(latestFigures([{ month: "2026-10", watts: 852 }], "2026-10-20")).toEqual({ label: "October so far", watts: 852, before: null, kwhPerDay: null });
  expect(latestFigures([], "2026-10-20")).toBeNull();
});

test("the latest month's calendar month in each year that has it, oldest first", () => {
  expect(sameMonth(NOVEMBERS)).toEqual({
    name: "November",
    rows: [
      { year: 2021, watts: 132 }, { year: 2022, watts: 384 }, { year: 2024, watts: 300 }, { year: 2025, watts: 276 }, { year: 2026, watts: 864 },
    ],
  });
});

test("the last 12 months, oldest first, each with the same month a year earlier", () => {
  const months = lastTwelve(NOVEMBERS);
  expect(months.map((m) => m.month)).toEqual([
    "2025-12", "2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06", "2026-07", "2026-08", "2026-09", "2026-10", "2026-11",
  ]);
  expect(months[9]).toEqual({ month: "2026-09", watts: 840, before: 264 });
  expect(months[10]).toEqual({ month: "2026-10", watts: null, before: null });
  expect(months[11]).toEqual({ month: "2026-11", watts: 864, before: 276 });
});

const YEARS = [
  { year: 2021, out_wh: 659_000, in_wh: 819_000, first_day: "2021-10-10" },
  { year: 2022, out_wh: 5_466_000, in_wh: 6_335_000, first_day: "2022-01-01" },
  { year: 2023, out_wh: 3_317_000, in_wh: 3_979_000, first_day: "2023-01-01" },
  { year: 2024, out_wh: 3_827_000, in_wh: 4_529_000, first_day: "2024-01-01" },
  { year: 2025, out_wh: 3_030_000, in_wh: 3_662_000, first_day: "2025-01-01" },
  { year: 2026, out_wh: 4_416_000, in_wh: 5_127_000, first_day: "2026-01-01" },
];

test("each year's kWh out, cycles against 40.5 kWh and round trip, with totals since the first year", () => {
  const { rows, total } = powerwallYears(YEARS, "2026-11-10");
  expect(rows[4]).toEqual({ year: 2025, note: null, kwh: 3030, cycles: 75, roundTrip: 83 });
  expect(rows[0].note).toBe("from Oct 10");
  expect(rows[5].note).toBe("so far");
  expect(total).toEqual({ kwh: 20715, cycles: 511 });
});

test("a year with nothing into the Powerwalls has no round trip", () => {
  expect(powerwallYears([{ year: 2026, out_wh: 0, in_wh: 0, first_day: "2026-01-01" }], "2027-01-02").rows[0].roundTrip).toBeNull();
});
