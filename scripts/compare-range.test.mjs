import { expect, test } from "vitest";
import { difference, sweep } from "./compare-range.mjs";

const ranges = sweep("2026-11-08");
const has = (start, end) => ranges.some(([s, e]) => s === start && e === end);

test("every calendar month from October 2021 to this month", () => {
  expect(has("2021-10-01", "2021-10-31")).toBe(true);
  expect(has("2024-02-01", "2024-02-29")).toBe(true);
  expect(has("2026-11-01", "2026-11-30")).toBe(true);
  expect(has("2026-12-01", "2026-12-31")).toBe(false);
});

test("every true-up year and calendar year", () => {
  expect(has("2021-10-01", "2022-09-30")).toBe(true);
  expect(has("2026-10-01", "2027-09-30")).toBe(true);
  expect(has("2022-01-01", "2022-12-31")).toBe(true);
  expect(has("2026-01-01", "2026-12-31")).toBe(true);
});

test("both sides of the daily limit, 15th-to-14th spans, ends on the 28th to 31st, and days before the first saved one", () => {
  expect(has("2025-03-03", "2025-04-03")).toBe(true);
  expect(has("2025-03-03", "2025-04-04")).toBe(true);
  expect(has("2025-01-15", "2025-06-14")).toBe(true);
  for (const end of ["2024-02-28", "2024-02-29", "2025-03-30", "2025-03-31"]) expect(has("2024-01-15", end) || has("2025-01-15", end)).toBe(true);
  expect(has("2021-10-01", "2021-10-09")).toBe(true);
});

test("only the fields the page reads are compared", () => {
  const flask = { data: [{ date: "Oct 14", day: "2026-10-14", solar: 44.4, grid: -8.3, house: 34.0, battery_status: "Charging", modified: "x" }] };
  const next = { data: [{ date: "Oct 14", day: "2026-10-14", solar: 44.4, grid: -8.3, house: 34.0 }] };
  expect(difference(flask, next)).toBeNull();
  expect(difference(flask, { data: [{ ...next.data[0], grid: -8.4 }] })).toBe("[0].grid: -8.3 vs -8.4");
});
