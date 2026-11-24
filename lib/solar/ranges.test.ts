import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { siteToday } from "@/lib/scene/replay";

const redirect = vi.hoisted(() => vi.fn(() => { throw new Error("NEXT_REDIRECT"); }));
vi.mock("next/navigation", () => ({ redirect }));

import { address, comparedDays, datesLabel, dropUnshown, holds, impactPresets, isDaily, isTrueUpAllTime, parseDay, parseRange, periods, presets, rangeIncludes, rangeLabel, rangeNames, rangeTitle, step, stripRange, trueUpPresets } from "./ranges";

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

  test("this month, this year, the true-up year containing today and all time, in that order", () => {
    expect(byLabel("2026-11-07")).toEqual({
      "This month": { start: "2026-11-01", end: "2026-11-30" },
      "This year": { start: "2026-01-01", end: "2026-12-31" },
      "True-up year": { start: "2026-10-01", end: "2027-09-30" },
      "All time": { start: "2021-10-10", end: "2026-11-07" },
    });
    expect(presets("2026-11-07").map(({ label }) => label)).toEqual(["This month", "This year", "True-up year", "All time"]);
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

  test("today, the week from Sunday to Saturday, the Solar page's three, then all time, in that order", () => {
    expect(impactPresets("2026-11-08").map(({ label }) => label)).toEqual(["Today", "This week", "This month", "This year", "True-up year", "All time"]);
    expect(byLabel("2026-11-08")).toMatchObject({
      Today: { start: "2026-11-08", end: "2026-11-08" },
      "This week": { start: "2026-11-08", end: "2026-11-14" },
      "True-up year": { start: "2026-10-01", end: "2027-09-30" },
    });
  });

  test("all time runs from the site's first day of service to today", () => {
    expect(byLabel("2026-11-09")["All time"]).toEqual({ start: "2021-10-10", end: "2026-11-09" });
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
  afterEach(() => {
    vi.useRealTimers();
    redirect.mockClear();
  });

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

  test.each([
    [{}],
    [{ start: "2026-10-01", end: "2026-10-31", readings: "reported" }],
    [{ start: "2026-10-01", end: "2026-10-31", day: "2026-10-14" }],
  ])("%j is left as it is", (params) => {
    dropUnshown("/solar", params, true);
    expect(redirect).not.toHaveBeenCalled();
  });

  test.each<[Record<string, string | string[]>, string]>([
    [{ start: "nope", end: "2026-10-31" }, "/solar"],
    [{ start: "2026-10-01" }, "/solar"],
    [{ start: "1900-01-01", end: "2026-10-31", readings: "reported" }, "/solar?readings=reported"],
    [{ start: "2026-10-31", end: "2026-10-01", backup: "25-26" }, "/solar?backup=25-26"],
    [{ day: "2030-01-01" }, "/solar"],
    [{ start: "2026-10-01", end: "2026-10-31", day: "soon" }, "/solar?start=2026-10-01&end=2026-10-31"],
    [{ start: "x", day: "2026-10-14", readings: ["a", "b"] }, "/solar?day=2026-10-14&readings=a&readings=b"],
  ])("%j redirects to %s", (params, to) => {
    expect(() => dropUnshown("/solar", params, true)).toThrow("NEXT_REDIRECT");
    expect(redirect).toHaveBeenCalledWith(to);
  });

  test("a page without a day view leaves day alone", () => {
    dropUnshown("/impact", { day: "soon" }, false);
    expect(redirect).not.toHaveBeenCalled();
  });

  test("a range and an open day make the page's address", () => {
    expect(address(march)).toBe("/solar?start=2026-03-01&end=2026-03-31");
    expect(address(march, "2026-03-14")).toBe("/solar?start=2026-03-01&end=2026-03-31&day=2026-03-14");
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

test("True-Up offers the core's tail: its current year and All time to that year's end", () => {
  expect(trueUpPresets(trueUpYearsTo(2027))).toEqual([
    { label: "True-up year", range: { start: "2026-10-01", end: "2027-09-30" } },
    { label: "All time", range: { start: "2021-10-01", end: "2027-09-30" } },
  ]);
});

// dashboard-shell, "A range over all the data is All time".
describe("holds", () => {
  const trueUpAll = trueUpPresets(trueUpYearsTo(2027))[1];
  const [month, , , solarAll] = presets("2026-11-24");

  test("All time holds a range from the first day of service or earlier to its end or later", () => {
    expect(holds(trueUpAll, { start: "2021-10-10", end: "2027-09-30" })).toBe(true);
    expect(holds(trueUpAll, { start: "2021-10-01", end: "2027-09-30" })).toBe(true);
    expect(holds(solarAll, { start: "2021-10-01", end: "2026-11-30" })).toBe(true);
  });

  test("a range leaving out some of the data stays custom", () => {
    expect(holds(solarAll, { start: "2021-10-10", end: "2026-11-23" })).toBe(false);
    expect(holds(solarAll, { start: "2021-10-11", end: "2026-11-24" })).toBe(false);
  });

  test("other presets hold only their own dates", () => {
    expect(holds(month, { start: "2026-11-01", end: "2026-11-30" })).toBe(true);
    expect(holds(month, { start: "2026-10-31", end: "2026-11-30" })).toBe(false);
  });

  test("True-Up names a range over all its data All time", () => {
    expect(isTrueUpAllTime({ start: "2021-10-10", end: "2027-09-30" }, trueUpYearsTo(2027))).toBe(true);
    expect(isTrueUpAllTime({ start: "2021-10-11", end: "2027-09-30" }, trueUpYearsTo(2027))).toBe(false);
  });
});

test("in 2036 there are still just the two", () => {
  expect(trueUpPresets(trueUpYearsTo(2037)).map((p) => p.label)).toEqual(["True-up year", "All time"]);
});

// dashboard-shell, "Stepping the range": the shape of the range, not the preset last picked, sets the step.
describe("stepping a range", () => {
  test("a day steps a day, across a month end", () => {
    expect(step({ start: "2026-10-31", end: "2026-10-31" }, 1)).toEqual({ name: "day", range: { start: "2026-11-01", end: "2026-11-01" } });
    expect(step({ start: "2026-11-01", end: "2026-11-01" }, -1)).toEqual({ name: "day", range: { start: "2026-10-31", end: "2026-10-31" } });
  });

  test("a Sunday to Saturday week steps a week, and a Monday to Sunday one doesn't", () => {
    expect(step({ start: "2026-11-08", end: "2026-11-14" }, 1)).toEqual({ name: "week", range: { start: "2026-11-15", end: "2026-11-21" } });
    expect(step({ start: "2026-11-09", end: "2026-11-15" }, 1)).toBeNull();
  });

  test("a whole month steps to the whole month beside it, whatever its length", () => {
    expect(step({ start: "2026-10-01", end: "2026-10-31" }, -1)).toEqual({ name: "month", range: { start: "2026-09-01", end: "2026-09-30" } });
    expect(step({ start: "2028-01-01", end: "2028-01-31" }, 1)).toEqual({ name: "month", range: { start: "2028-02-01", end: "2028-02-29" } });
    expect(step({ start: "2026-12-01", end: "2026-12-31" }, 1)).toEqual({ name: "month", range: { start: "2027-01-01", end: "2027-01-31" } });
  });

  test("a calendar year and a true-up year each step a year", () => {
    expect(step({ start: "2026-01-01", end: "2026-12-31" }, -1)).toEqual({ name: "year", range: { start: "2025-01-01", end: "2025-12-31" } });
    expect(step({ start: "2026-10-01", end: "2027-09-30" }, -1)).toEqual({ name: "true-up year", range: { start: "2025-10-01", end: "2026-09-30" } });
  });

  test("any other range has no step", () => {
    expect(step({ start: "2026-10-10", end: "2026-10-20" }, -1)).toBeNull();
    expect(step({ start: "2021-10-10", end: "2026-11-23" }, 1)).toBeNull();
  });
});

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

describe("the days compared with a year earlier", () => {
  test("a past month", () => {
    const october = { start: "2026-10-01", end: "2026-10-31" };
    expect(comparedDays(october, "2026-11-22")).toEqual({ now: october, then: { start: "2025-10-01", end: "2025-10-31" } });
  });

  test("a range under way compares the days before today on both sides", () => {
    expect(comparedDays({ start: "2026-11-01", end: "2026-11-30" }, "2026-11-22")).toEqual({
      now: { start: "2026-11-01", end: "2026-11-21" }, then: { start: "2025-11-01", end: "2025-11-21" },
    });
  });

  // A part-day can't be set against a whole one, so today alone has no comparison until it's over.
  test("today alone has nothing to compare yet", () => {
    expect(comparedDays({ start: "2026-11-22", end: "2026-11-22" }, "2026-11-22")).toBeNull();
  });

  test("a past day alone compares with the whole of that date", () => {
    expect(comparedDays({ start: "2026-11-21", end: "2026-11-21" }, "2026-11-22")).toEqual({
      now: { start: "2026-11-21", end: "2026-11-21" }, then: { start: "2025-11-21", end: "2025-11-21" },
    });
  });

  test("a range starting today has nothing to compare yet", () => {
    expect(comparedDays({ start: "2026-12-01", end: "2026-12-31" }, "2026-12-01")).toBeNull();
  });

  test("February 29 becomes February 28", () => {
    expect(comparedDays({ start: "2028-02-29", end: "2028-02-29" }, "2028-03-05")?.then).toEqual({ start: "2027-02-28", end: "2027-02-28" });
  });

  test("none before the first day", () => {
    expect(comparedDays({ start: "2022-01-01", end: "2022-06-30" }, "2026-11-22")).toBeNull();
    expect(comparedDays({ start: "2022-10-10", end: "2022-10-31" }, "2026-11-22")?.then).toEqual({ start: "2021-10-10", end: "2021-10-31" });
  });
});

describe("naming a range", () => {
  const today = "2026-11-22";
  test.each([
    [{ start: "2026-11-01", end: "2026-11-30" }, "in November so far", null],
    [{ start: "2026-10-01", end: "2026-10-31" }, "in October 2026", "October 2025"],
    [{ start: "2026-01-01", end: "2026-12-31" }, "in 2026 so far", null],
    [{ start: "2025-01-01", end: "2025-12-31" }, "in 2025", "2024"],
    [{ start: "2026-10-01", end: "2027-09-30" }, "in '26\u00a0-\u00a0'27 so far", null],
    [{ start: "2025-10-01", end: "2026-09-30" }, "in '25\u00a0-\u00a0'26", "'24\u00a0-\u00a0'25"],
    [{ start: "2026-11-22", end: "2026-11-28" }, "this week so far", null],
    [{ start: "2026-11-22", end: "2026-11-22" }, "today so far", null],
    [{ start: "2026-11-21", end: "2026-11-21" }, "yesterday", null],
    [{ start: "2026-11-03", end: "2026-11-03" }, "on Nov 3, 2026", null],
    [{ start: "2026-03-03", end: "2026-04-09" }, "from Mar 3 to Apr 9, 2026", null],
    [{ start: "2021-10-10", end: "2026-11-22" }, "since Oct 10, 2021", null],
    [{ start: "2026-11-10", end: "2026-11-22" }, "since Nov 10, 2026", null],
    [{ start: "2026-11-10", end: "2026-12-10" }, "since Nov 10, 2026", null],
  ])("%o", (range, name, earlier) => {
    expect(rangeNames(range, today)).toEqual({ name, earlier });
  });
});

// dashboard-shell, "Each page's title".
test("a page's title names its range in short", () => {
  expect(rangeTitle({ start: "2026-11-01", end: "2026-11-30" })).toBe("November 2026");
  expect(rangeTitle({ start: "2025-01-01", end: "2025-12-31" })).toBe("2025");
  expect(rangeTitle({ start: "2026-10-01", end: "2027-09-30" })).toBe("'26\u00a0-\u00a0'27");
  expect(rangeTitle({ start: "2026-11-14", end: "2026-11-14" })).toBe("Nov 14, 2026");
  expect(rangeTitle({ start: "2026-10-01", end: "2026-10-15" })).toBe("Oct 1 – 15, 2026");
});
