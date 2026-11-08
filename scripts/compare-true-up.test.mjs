import { expect, test, vi } from "vitest";
import { compareYears, difference, ranges } from "./compare-true-up.mjs";

const years = ["2022", "2023", "2024", "2025", "2026", "2027"].map((end) => ({ start_date: `${end - 1}-10-01`, end_date: `${end}-09-30` }));
const swept = ranges(years);
const has = (start, end) => swept.some(([s, e]) => s === start && e === end);

test("every true-up year and All time", () => {
  expect(has("2021-10-01", "2022-09-30")).toBe(true);
  expect(has("2026-10-01", "2027-09-30")).toBe(true);
  expect(has("2021-10-01", "2027-09-30")).toBe(true);
});

test("custom ranges: a month, a 15th-to-14th span and a range across two true-up years, in each year", () => {
  expect(has("2025-11-01", "2025-11-30")).toBe(true);
  expect(has("2026-01-15", "2026-06-14")).toBe(true);
  expect(has("2025-04-01", "2026-03-31")).toBe(true);
  expect(has("2027-04-01", "2028-03-31")).toBe(false);
});

test("every field of every row is compared, Flask's whole numbers equal to the port's", () => {
  const flask = JSON.parse('{"data": [{"net": 364.0, "nem_charges": 113.41, "nem_source": "statement"}]}');
  expect(difference(flask, { data: [{ net: 364, nem_charges: 113.41, nem_source: "statement" }] })).toBeNull();
  expect(difference(flask, { data: [{ net: 364, nem_charges: 113.42, nem_source: "statement" }] })).toBe("data[0].nem_charges: 113.41 vs 113.42");
});

test("the true-up years are compared once, and a mismatch is reported", async () => {
  const answers = { "F/true_up_years": years, "N/true-up-years": [...years.slice(0, -1), { ...years.at(-1), current: true }] };
  vi.stubGlobal("fetch", async (url) => ({ status: 200, json: async () => ({ data: answers[url] }) }));
  const log = vi.fn();
  expect(await compareYears("F", "N", log)).toEqual({ years, mismatched: true });
  expect(log).toHaveBeenCalledWith("true-up years: data[5].current: undefined vs true");
  vi.unstubAllGlobals();
});
