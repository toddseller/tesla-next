import { expect, test } from "vitest";
import { difference, ranges } from "./compare-impact.mjs";

const swept = ranges("2026-11-08");
const has = (start, end) => swept.some(([s, e]) => s === start && e === end);

test("the range sweep, plus the 15th of every month from October 2021 to this month as a single day", () => {
  expect(has("2021-10-01", "2022-09-30")).toBe(true);
  expect(has("2025-01-15", "2025-06-14")).toBe(true);
  expect(has("2021-10-15", "2021-10-15")).toBe(true);
  expect(has("2026-11-15", "2026-11-15")).toBe(true);
  expect(has("2026-12-15", "2026-12-15")).toBe(false);
});

test("only the ten impact figures are compared", () => {
  const figures = {
    from_solar_percentage: 48, from_powerwall_percentage: 52, from_grid_percentage: 0, self_powered_percentage: 100,
    total_solar_percentage: 77, total_solar: 23.8, from_solar: 14.8, from_powerwall: 16.0, from_grid: 0, total_house: 30.8,
  };
  const flask = { data: { ...figures, battery_percentage: 82, battery_status: "Charging", modified: "x" } };
  expect(difference(flask, { data: figures })).toBeNull();
  expect(difference(flask, { data: { ...figures, total_house: 30.9 } })).toBe("total_house: 30.8 vs 30.9");
});
