import { describe, expect, test } from "vitest";

import type { TopTen } from "@/lib/top-ten";

import { impactLead, solarLead, topTenLead } from "./lead";

const today = "2026-11-22";

describe("Solar's lead sentence", () => {
  test("the month so far against the same days last year", () => {
    expect(solarLead({ start: "2026-11-01", end: "2026-11-30" }, today, 556.1, { then: 500, now: 530 })).toBe(
      "Solar made {556} kWh in November so far, {6%} more than the same days last year.",
    );
  });

  test("a finished month against the same month", () => {
    expect(solarLead({ start: "2026-10-01", end: "2026-10-31" }, today, 1086.2, { then: 997.9, now: null })).toBe(
      "Solar made {1,086} kWh in October 2026, {9%} more than October 2025.",
    );
  });

  test("less than a year earlier", () => {
    expect(solarLead({ start: "2026-10-01", end: "2026-10-31" }, today, 900, { then: 1000, now: null })).toBe(
      "Solar made {900} kWh in October 2026, {10%} less than October 2025.",
    );
  });

  test("under one percent apart", () => {
    expect(solarLead({ start: "2026-01-01", end: "2026-12-31" }, today, 13554, { then: 13450, now: 13500 })).toBe(
      "Solar made {13,554} kWh in 2026 so far, about the same as the same days last year.",
    );
  });

  test("a range under way compares the days before today", () => {
    expect(solarLead({ start: "2026-12-01", end: "2026-12-31" }, "2026-12-03", 40, { then: 50, now: 30 })).toBe(
      "Solar made {40} kWh in December so far, {40%} less than the same days last year.",
    );
  });

  test("the first month", () => {
    expect(solarLead({ start: "2021-10-01", end: "2021-10-31" }, today, 522.8, null)).toBe("Solar made {523} kWh in October 2021, its first month.");
  });

  test("no year to compare with", () => {
    expect(solarLead({ start: "2022-01-01", end: "2022-06-30" }, today, 7000.4, null)).toBe("Solar made {7,000} kWh from Jan 1 to Jun 30, 2022.");
  });
});

describe("Impact's lead sentence", () => {
  test("up from the same days last year", () => {
    expect(impactLead({ start: "2026-11-01", end: "2026-11-30" }, today, 35, 27)).toBe(
      "{35%} self-powered in November so far, up from {27%} over the same days last year.",
    );
  });

  test("down from a finished month", () => {
    expect(impactLead({ start: "2026-10-01", end: "2026-10-31" }, today, 42, 45)).toBe("{42%} self-powered in October 2026, down from {45%} in October 2025.");
  });

  test("the same share", () => {
    expect(impactLead({ start: "2026-11-22", end: "2026-11-28" }, today, 31, 31)).toBe(
      "{31%} self-powered this week so far, about the same as the same days last year.",
    );
    expect(impactLead({ start: "2025-01-01", end: "2025-12-31" }, today, 50, 50)).toBe("{50%} self-powered in 2025, about the same as 2024.");
  });

  test("a day against the same day", () => {
    expect(impactLead({ start: today, end: today }, today, 21, 29)).toBe("{21%} self-powered today; this day last year was {29%}.");
    expect(impactLead({ start: "2026-11-21", end: "2026-11-21" }, today, 31, 30)).toBe("{31%} self-powered yesterday; this day last year was {30%}.");
    expect(impactLead({ start: "2026-11-03", end: "2026-11-03" }, today, 40, 12)).toBe("{40%} self-powered on Nov 3, 2026; this day last year was {12%}.");
  });

  test("no sentence without a year earlier", () => {
    expect(impactLead({ start: "2022-01-01", end: "2022-12-31" }, today, 40, null)).toBeNull();
  });
});

describe("Top Ten's lead sentence", () => {
  const days = (...dates: string[]) => dates.map((day) => ({ date: "", day }));
  const rankings = (solar: string[], exportDays: string[], months: string[], outages: string[] = []): TopTen => [
    { solar: days(...solar).map((d) => ({ ...d, solar: 80 })) },
    { net_grid: days(...exportDays).map((d) => ({ ...d, net_grid: -40 })) },
    { to_grid_months: months.map((month) => ({ date: "", month, net_grid: -400 })) },
    { outages: days(...outages).map((d) => ({ ...d, hours: 5 })) },
  ];

  test("places but no record", () => {
    const top = rankings(["2022-06-13", "2026-06-28"], ["2025-05-21", "2026-07-16", "2026-06-06", "2026-07-14"], ["2024-04", "2026-06", "2026-07"], ["2024-02-04"]);
    expect(topTenLead(top, today)).toBe("2026 hasn't set a record, but it put six entries in the top tens: a solar day, three export days and two export months.");
  });

  test("one record and more entries", () => {
    const top = rankings(["2022-06-13", "2026-06-28"], ["2025-05-21", "2026-07-16", "2026-06-06", "2026-07-14"], ["2026-06", "2024-04", "2026-07"]);
    expect(topTenLead(top, today)).toBe("2026 set the record for the best export month, and put five more entries in the top tens.");
  });

  test("one entry and no record", () => {
    expect(topTenLead(rankings(["2022-06-13", "2026-06-28"], ["2025-05-21"], ["2024-04"]), today)).toBe(
      "2026 hasn't set a record, but it put one entry in the top tens: a solar day.",
    );
  });

  test("two records and nothing else", () => {
    expect(topTenLead(rankings(["2026-06-13", "2022-06-13"], ["2025-05-21"], ["2024-04"], ["2026-02-04", "2024-12-14"]), today)).toBe(
      "2026 set the records for the best solar day and the longest outage.",
    );
  });

  test("one more entry", () => {
    expect(topTenLead(rankings(["2026-06-13", "2026-06-14"], [], []), today)).toBe("2026 set the record for the best solar day, and put one more entry in the top tens.");
  });

  test("nothing this year names the newest record", () => {
    const top = rankings(["2022-06-13", "2026-06-28"], ["2025-05-21"], ["2024-04"], ["2024-02-04"]);
    expect(topTenLead(top, "2027-01-05")).toBe("No entries from 2027 yet; the newest record is May 21, 2025's export day.");
    expect(topTenLead(rankings(["2022-06-13"], ["2025-05-21"], ["2025-06"]), "2027-01-05")).toBe("No entries from 2027 yet; the newest record is June 2025's export month.");
  });

  test("no sentence for an empty database", () => {
    expect(topTenLead(rankings([], [], []), today)).toBeNull();
  });
});
