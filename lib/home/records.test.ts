// Records (home-story spec, "How each record was beaten"): the running record, its near misses, and how long ago it was set.
import { expect, test } from "vitest";

import type { TopTen } from "@/lib/top-ten";

import { outageTick } from "@/lib/backup-figures";

import { nearMisses, recordTabs, setAgo, steps, tenthTick, valueTicks, yearTicks } from "./records";

const SERIES = [
  { at: "2021-11-01", value: 30 },
  { at: "2021-11-02", value: 28 },
  { at: "2022-05-29", value: 79.9 },
  { at: "2022-06-13", value: 80.9 },
  { at: "2023-06-20", value: 80.1 },
  { at: "2024-06-17", value: 79.5 },
  { at: "2025-06-21", value: 80.2 },
  { at: "2025-07-01", value: 79.2 },
];

test("the steps are each figure that beat every one before it", () => {
  expect(steps(SERIES)).toEqual([{ at: "2021-11-01", value: 30 }, { at: "2022-05-29", value: 79.9 }, { at: "2022-06-13", value: 80.9 }]);
  expect(steps([])).toEqual([]);
});

test("near misses are the figures since the record within 2% of it", () => {
  expect(nearMisses(SERIES, { at: "2022-06-13", value: 80.9 })).toBe(3);
  expect(nearMisses(SERIES.slice(0, 4), { at: "2022-06-13", value: 80.9 })).toBe(0);
});

test.each([
  ["2026-11-21", "set today"],
  ["2026-11-20", "set 1 day ago"],
  ["2026-11-16", "set 5 days ago"],
  ["2026-08-21", "set 3 months ago"],
  ["2025-01-10", "set 22 months ago"],
  ["2022-06-13", "set 4 years ago"],
  ["2024-04", "set 2 years ago"],
])("a record from %s was %s", (at, text) => {
  expect(setAgo(at, "2026-11-21")).toBe(text);
});

test("the four tabs as the page sends them: the top five, the staircase and the near misses, not the whole series", () => {
  const rankings: TopTen = [
    { solar: [80.9, 80.2, 80.1, 79.9, 79.7, 79.5].map((solar, i) => ({ date: "", solar, day: `2022-06-1${i}` })) },
    { net_grid: [{ date: "", net_grid: -45.9, day: "2025-05-21" }] },
    { to_grid_months: [{ date: "", net_grid: -479.2, month: "2024-04" }] },
    { outages: [{ date: "", hours: 3, day: "2023-01-05" }, { date: "", hours: 1, day: "2023-01-05" }] },
  ];
  const series = {
    solar: [{ at: "2022-06-09", value: 70 }, { at: "2022-06-10", value: 80.9 }, { at: "2022-06-11", value: 80.2 }, { at: "2022-06-12", value: 60 }],
    exportDays: [{ at: "2025-05-21", value: 45.9 }],
    exportMonths: [{ at: "2024-04", value: 479.2 }],
    outages: [{ at: "2023-01-05", value: 3 }, { at: "2023-01-05", value: 1 }],
  };
  const [solar, days, months, outages] = recordTabs(rankings, series);
  expect(solar).toEqual({
    top: [80.9, 80.2, 80.1, 79.9, 79.7].map((value, i) => ({ at: `2022-06-1${i}`, value })),
    steps: [{ at: "2022-06-09", value: 70 }, { at: "2022-06-10", value: 80.9 }],
    record: { at: "2022-06-10", value: 80.9 },
    near: 1,
  });
  expect(days.top).toEqual([{ at: "2025-05-21", value: 45.9 }]);
  expect(months.top).toEqual([{ at: "2024-04", value: 479.2 }]);
  expect(outages.top).toHaveLength(2);
  expect(recordTabs([{ solar: [] }, { net_grid: [] }, { to_grid_months: [] }, { outages: [] }], { solar: [], exportDays: [], exportMonths: [], outages: [] })[3]).toEqual({ top: [], steps: [], record: undefined, near: 0 });
});

test("figures that tie to a tenth: the record is the one that set it, the staircase's last step, not Top Ten's newest-first pick", () => {
  const tie = [{ at: "2022-06-13", value: 80.94 }, { at: "2025-06-21", value: 80.91 }];
  const [solar] = recordTabs([{ solar: [{ date: "", solar: 80.91, day: "2025-06-21" }, { date: "", solar: 80.94, day: "2022-06-13" }] }, { net_grid: [] }, { to_grid_months: [] }, { outages: [] }], { solar: tie, exportDays: [], exportMonths: [], outages: [] });
  expect(solar.record).toEqual({ at: "2022-06-13", value: 80.94 });
  expect(solar.near).toBe(1);
});

test("a time axis is marked at each January 1 it spans, and a span inside one year at none", () => {
  expect(yearTicks(Date.UTC(2021, 9, 1), Date.UTC(2028, 11, 31)).map((t) => new Date(t).toISOString().slice(0, 10)))
    .toEqual(["2022-01-01", "2023-01-01", "2024-01-01", "2025-01-01", "2026-01-01", "2027-01-01", "2028-01-01"]);
  expect(yearTicks(Date.UTC(2026, 2, 1), Date.UTC(2026, 10, 22))).toEqual([]);
});

test("an axis figure reads to a tenth, and a whole one without its .0", () => {
  expect(tenthTick(52.3888)).toBe("52.4");
  expect(tenthTick(25)).toBe("25");
});

test("a record's axis is marked at 0 and at the record, and at its lowest figure when that went below 0", () => {
  expect(valueTicks([0.4, 38.2, 80.94])).toEqual([0, 80.94]);
  expect(valueTicks([-136.3, 251.1, 479.2])).toEqual([-136.3, 0, 479.2]);
  expect(valueTicks([])).toEqual([]);
});

test("the ticks span the whole axis, 0 always on it, each figure once", () => {
  expect(valueTicks([20, 52.3])).toEqual([0, 52.3]);
  expect(valueTicks([52.3])).toEqual([0, 52.3]);
  expect(valueTicks([-5, -1])).toEqual([-5, 0]);
  expect(valueTicks([0])).toEqual([0]);
});

test("an outage axis reads its lengths in days and hours, and 0 as 0", () => {
  expect(outageTick(52.3888)).toBe("2 d 4 h");
  expect(outageTick(0)).toBe("0");
  // An axis mark on a whole hour leaves off its 0 minutes.
  expect(outageTick(20)).toBe("20 h");
  expect(outageTick(40)).toBe("1 d 16 h");
});
