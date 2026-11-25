import { expect, test } from "vitest";
import { backupParam, backupPresets, backupYear, followedYear } from "./backup-years";

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

test("True-up year and All time, the arrows stepping to the years between", () => {
  expect(backupPresets(TODAY)).toEqual([{ label: "True-up year", range: { start: "2026-10-01", end: "2027-09-30" } }, { label: "All time", range: ALL }]);
});

// backup-history, "The Backup section follows the page's year".
test("the page's All time or a true-up year is the Backup span; any other range is none", () => {
  expect(followedYear({ start: "2021-10-10", end: TODAY }, TODAY)).toEqual(ALL);
  expect(followedYear({ start: "2021-10-01", end: "2027-09-30" }, TODAY)).toEqual(ALL);
  for (const start of [2021, 2023, 2026]) {
    const year = { start: `${start}-10-01`, end: `${start + 1}-09-30` };
    expect(followedYear(year, TODAY)).toEqual(year);
  }
  for (const range of [
    { start: TODAY, end: TODAY }, { start: "2026-11-01", end: "2026-11-30" }, { start: "2026-01-01", end: "2026-12-31" },
    { start: "2027-10-01", end: "2028-09-30" }, { start: "2023-10-02", end: "2024-09-30" }, { start: "2023-10-01", end: "2024-09-29" },
    { start: "2021-10-10", end: "2026-11-08" },
  ]) expect(followedYear(range, TODAY)).toBeNull();
});
