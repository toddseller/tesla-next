import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { siteToday } from "@/lib/scene/replay";
import { address, datesLabel, impactPresets, isDaily, parseDay, parseRange, presets, rangeIncludes, rangeLabel, stripRange, trueUpPresets } from "./ranges";

const march = { start: "2026-03-01", end: "2026-03-31" };

// anton-tesla-api-ws utils/ranges.test.js
describe("rangeIncludes", () => {
  test("includes both edges", () => {
    expect(rangeIncludes(march, "2026-03-01")).toBe(true);
    expect(rangeIncludes(march, "2026-03-31")).toBe(true);
  });

  test("excludes days just outside", () => {
    expect(rangeIncludes(march, "2026-02-28")).toBe(false);
    expect(rangeIncludes(march, "2026-04-01")).toBe(false);
  });
});

describe("presets", () => {
  const byLabel = (today: string) => Object.fromEntries(presets(today).map(({ label, range }) => [label, range]));

  test("this month, this year and the true-up year containing today", () => {
    expect(byLabel("2026-11-07")).toEqual({
      "This month": { start: "2026-11-01", end: "2026-11-30" },
      "This year": { start: "2026-01-01", end: "2026-12-31" },
      "True-up year": { start: "2026-10-01", end: "2027-09-30" },
    });
  });

  test("the true-up year's last day still belongs to it", () => {
    expect(byLabel("2026-09-30")["True-up year"]).toEqual({ start: "2025-10-01", end: "2026-09-30" });
  });

  test("February in a leap year", () => {
    expect(byLabel("2028-02-10")["This month"]).toEqual({ start: "2028-02-01", end: "2028-02-29" });
  });

  test("1 AM on December 1 in New York is still November 30 at the site", () => {
    expect(byLabel(siteToday(Date.parse("2026-12-01T06:00:00Z")))["This month"]).toEqual({ start: "2026-11-01", end: "2026-11-30" });
  });
});

describe("impactPresets", () => {
  const byLabel = (today: string) => Object.fromEntries(impactPresets(today).map(({ label, range }) => [label, range]));

  test("today, the week from Sunday to Saturday, then the Solar page's three, in that order", () => {
    expect(impactPresets("2026-11-08").map(({ label }) => label)).toEqual(["Today", "This week", "This month", "This year", "True-up year"]);
    expect(byLabel("2026-11-08")).toMatchObject({
      Today: { start: "2026-11-08", end: "2026-11-08" },
      "This week": { start: "2026-11-08", end: "2026-11-14" },
      "True-up year": { start: "2026-10-01", end: "2027-09-30" },
    });
  });

  test("a Wednesday's week starts the Sunday before", () => {
    expect(byLabel("2026-11-11")["This week"]).toEqual({ start: "2026-11-08", end: "2026-11-14" });
  });

  test("a week across a month end and a year end", () => {
    expect(byLabel("2026-12-01")["This week"]).toEqual({ start: "2026-11-29", end: "2026-12-05" });
    expect(byLabel("2026-12-31")["This week"]).toEqual({ start: "2026-12-27", end: "2027-01-02" });
  });
});

describe("the address", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(Date.parse("2026-11-07T20:00:00Z"));
  });
  afterEach(() => vi.useRealTimers());

  const today = { start: "2026-11-07", end: "2026-11-07" };

  test("a valid range is taken as it is", () => {
    expect(parseRange({ start: "2026-03-01", end: "2026-03-31" }, today)).toEqual(march);
  });

  test.each([
    [{}],
    [{ start: "nope", end: "2026-10-31" }],
    [{ start: "2026-10-01" }],
    [{ start: "1900-01-01", end: "2026-10-31" }],
    [{ start: "2026-10-01", end: "2030-01-01" }],
    [{ start: "2026-10-31", end: "2026-10-01" }],
    [{ start: ["2026-10-01", "2026-10-02"], end: "2026-10-31" }],
  ])("%j falls back to the page's default", (params) => {
    expect(parseRange(params, today)).toEqual(today);
  });

  test("a day from the first day of service to today is taken; any other is ignored", () => {
    expect(parseDay("2021-10-10")).toBe("2021-10-10");
    expect(parseDay("2026-11-07")).toBe("2026-11-07");
    expect(parseDay("2021-10-09")).toBeNull();
    expect(parseDay("2026-11-08")).toBeNull();
    expect(parseDay("2026-02-30")).toBeNull();
    expect(parseDay(undefined)).toBeNull();
  });

  test("a range and an open day make the page's address", () => {
    expect(address(march)).toBe("/?start=2026-03-01&end=2026-03-31");
    expect(address(march, "2026-03-14")).toBe("/?start=2026-03-01&end=2026-03-31&day=2026-03-14");
  });
});

test("daily bars up to 31 days after the start", () => {
  expect(isDaily({ start: "2026-01-01", end: "2026-02-01" })).toBe(true);
  expect(isDaily({ start: "2026-01-01", end: "2026-02-02" })).toBe(false);
});

test("a whole calendar month is named by its month; other ranges by their dates", () => {
  expect(rangeLabel({ start: "2026-10-01", end: "2026-10-31" })).toBe("October 2026");
  expect(rangeLabel({ start: "2026-10-10", end: "2026-10-20" })).toBe("Oct 10 – 20, 2026");
  expect(rangeLabel({ start: "2025-10-01", end: "2026-09-30" })).toBe("Oct 1, 2025 – Sep 30, 2026");
});

// The same text on the server and in the browser: Node's Intl.formatRange puts thin spaces around the dash, Chrome's doesn't.
test("a range's dates, short or long, with plain spaces", () => {
  expect(datesLabel({ start: "2026-10-01", end: "2026-10-31" }, "long")).toBe("October 1 – 31, 2026");
  expect(datesLabel({ start: "2026-10-01", end: "2026-10-31" }, "short")).toBe("Oct 1 – 31, 2026");
  expect(datesLabel({ start: "2026-01-15", end: "2026-06-14" }, "short")).toBe("Jan 15 – Jun 14, 2026");
  expect(datesLabel({ start: "2026-03-03", end: "2026-03-03" }, "long")).toBe("March 3, 2026");
});

describe("the days strip", () => {
  const october = { start: "2026-10-01", end: "2026-10-31" };

  test("holds the range's days when the range is daily and contains the day", () => {
    expect(stripRange(october, "2026-10-14", "2026-11-07")).toEqual(october);
  });

  test("holds the day's month, up to today, once the day leaves the range", () => {
    expect(stripRange(october, "2026-11-01", "2026-11-07")).toEqual({ start: "2026-11-01", end: "2026-11-07" });
  });

  test("holds the day's month when the range has monthly bars", () => {
    expect(stripRange({ start: "2025-10-01", end: "2026-09-30" }, "2026-05-10", "2026-11-07")).toEqual({ start: "2026-05-01", end: "2026-05-31" });
  });
});

// As /api/true-up-years lists them: '21 - '22 through the current year.
const trueUpYearsTo = (current: number) =>
  Array.from({ length: current - 2021 }, (_, i) => {
    const end = 2022 + i;
    return { label: `'${String(end - 1).slice(2)} - '${String(end).slice(2)}`, start_date: `${end - 1}-10-01`, end_date: `${end}-09-30`, last_read_date: `${end}-10-05`, current: end === current };
  });

test("in 2026: This year and the two before it, Earlier newest first, and All time to the current year's end", () => {
  const { presets, earlier } = trueUpPresets(trueUpYearsTo(2027));
  expect(presets).toEqual([
    { label: "This year", range: { start: "2026-10-01", end: "2027-09-30" } },
    { label: "'25 - '26", range: { start: "2025-10-01", end: "2026-09-30" } },
    { label: "'24 - '25", range: { start: "2024-10-01", end: "2025-09-30" } },
    { label: "All time", range: { start: "2021-10-01", end: "2027-09-30" } },
  ]);
  expect(earlier.map((year) => year.label)).toEqual(["'23 - '24", "'22 - '23", "'21 - '22"]);
  expect(earlier[1].range).toEqual({ start: "2022-10-01", end: "2023-09-30" });
});

test("in 2036 there are still three year buttons, and Earlier holds the thirteen older years", () => {
  const { presets, earlier } = trueUpPresets(trueUpYearsTo(2037));
  expect(presets.map((p) => p.label)).toEqual(["This year", "'35 - '36", "'34 - '35", "All time"]);
  expect(earlier).toHaveLength(13);
  expect([earlier[0].label, earlier.at(-1)!.label]).toEqual(["'33 - '34", "'21 - '22"]);
});
