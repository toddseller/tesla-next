import { describe, expect, test } from "vitest";

import { periods } from "./range";

const lengths = (list: [string, string][]) =>
  list.map(([first, last]) => (Date.parse(last) - Date.parse(first)) / 86_400_000 + 1);

describe("periods", () => {
  test("calendar months when the range starts on the 1st", () => {
    expect(periods("2026-01-01", "2026-06-30")).toEqual([
      ["2026-01-01", "2026-01-31"],
      ["2026-02-01", "2026-02-28"],
      ["2026-03-01", "2026-03-31"],
      ["2026-04-01", "2026-04-30"],
      ["2026-05-01", "2026-05-31"],
      ["2026-06-01", "2026-06-30"],
    ]);
  });

  test("month-long periods when neither end is a month boundary", () => {
    expect(periods("2026-01-15", "2026-06-14")).toEqual([
      ["2026-01-15", "2026-02-14"],
      ["2026-02-15", "2026-03-14"],
      ["2026-03-15", "2026-04-14"],
      ["2026-04-15", "2026-05-14"],
      ["2026-05-15", "2026-06-14"],
    ]);
  });

  test("a partial first month, then calendar months, when the range ends on the 28th to 31st", () => {
    expect(periods("2026-01-15", "2026-06-30").map(([first]) => first)).toEqual([
      "2026-01-15",
      "2026-02-01",
      "2026-03-01",
      "2026-04-01",
      "2026-05-01",
      "2026-06-01",
    ]);
    expect(periods("2026-01-15", "2026-06-30")[0]).toEqual(["2026-01-15", "2026-01-31"]);
  });

  // anton's test_rolling_months_clamp_to_the_month_length, lengths in days.
  test.each([
    ["2026-01-31", "2026-06-14", [28, 28, 31, 30, 18]],
    ["2028-01-31", "2028-04-14", [29, 29, 17]],
    ["2026-12-15", "2027-03-14", [31, 31, 28]],
  ])("periods from %s to %s clamp to the month's length", (start, end, expected) => {
    expect(lengths(periods(start, end))).toEqual(expected);
  });
});
