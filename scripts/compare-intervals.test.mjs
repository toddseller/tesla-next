import { expect, test } from "vitest";
import { firstDifference } from "./compare-intervals.mjs";

const day = (overrides = {}) => ({
  date: "2026-10-16",
  totals: { solar_to_home: 12.27 },
  data: [{ start: "2026-10-16T12:00:00-07:00", minute: 720, solar_to_home_kw: 1.08, vehicle: null }],
  ...overrides,
});

test("equal responses have no difference, whatever their key order", () => {
  expect(firstDifference(day(), { data: day().data, totals: day().totals, date: "2026-10-16" })).toBeNull();
});

test("a different number names its path", () => {
  const changed = day({ data: [{ ...day().data[0], solar_to_home_kw: 1.09 }] });
  expect(firstDifference(day(), changed)).toBe("data[0].solar_to_home_kw: 1.08 vs 1.09");
});

test("a key on one side only is a difference", () => {
  expect(firstDifference(day(), day({ extra: 1 }))).toBe("extra: undefined vs 1");
});

test("arrays of different lengths are a difference", () => {
  expect(firstDifference(day(), day({ data: [] }))).toBe("data: 1 items vs 0");
});

test("null and 0 differ", () => {
  expect(firstDifference({ a: null }, { a: 0 })).toBe("a: null vs 0");
});

test("Python's -0.0 equals JavaScript's 0", () => {
  expect(firstDifference({ wind: -0 }, { wind: 0 })).toBeNull();
});
