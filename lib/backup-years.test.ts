import { expect, test } from "vitest";
import { backupParam, backupPresets, backupYear } from "./backup-years";

// November 9, 2026 is in '26 - '27.
const TODAY = "2026-11-09";
const ALL = { start: "2021-10-01", end: "2027-09-30" };

test("a backup value names a true-up year, all names every one, and anything else is this year", () => {
  expect(backupYear("24-25", TODAY)).toEqual({ start: "2024-10-01", end: "2025-09-30" });
  expect(backupYear("all", TODAY)).toEqual(ALL);
  for (const value of [undefined, null, "", "2024", "20-21", "27-28", "24-26", "xx-yy", ["24-25"]]) expect(backupYear(value, TODAY)).toEqual({ start: "2026-10-01", end: "2027-09-30" });
});

test("on September 30 this year is the one ending that day", () => {
  expect(backupYear(undefined, "2026-09-30")).toEqual({ start: "2025-10-01", end: "2026-09-30" });
});

test("each year's address value comes back from its range, All time is all, and this year has none", () => {
  expect(backupParam({ start: "2026-10-01", end: "2027-09-30" }, TODAY)).toBeNull();
  expect(backupParam({ start: "2024-10-01", end: "2025-09-30" }, TODAY)).toBe("24-25");
  expect(backupParam(ALL, TODAY)).toBe("all");
  expect(backupParam({ start: "2021-10-01", end: "2022-09-30" }, TODAY)).toBe("21-22");
});

test("This year and the two before as buttons, older years in Earlier newest first, All time last", () => {
  const { presets, earlier } = backupPresets(TODAY);
  expect(presets.map(({ label }) => label)).toEqual(["This year", "'25 - '26", "'24 - '25", "All time"]);
  expect(presets.at(-1)!.range).toEqual(ALL);
  expect(earlier.map(({ label }) => label)).toEqual(["'23 - '24", "'22 - '23", "'21 - '22"]);
});
