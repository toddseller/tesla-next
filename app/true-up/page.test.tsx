// The True-Up Tracker as the server renders it, from its address.
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { COST_25_26, CURRENT, CURRENT_COST, CURRENT_SAVINGS, SAVINGS_25_26, YEAR_25_26, YEARS } from "@/components/true-up/fixtures";

const mocks = vi.hoisted(() => ({ trueUpYears: vi.fn(), cycleRows: vi.fn(), trueUpCost: vi.fn(), trueUpSavings: vi.fn(), payback: vi.fn(), impactFigures: vi.fn() }));
vi.mock("@/lib/true-up/reads", () => ({ trueUpYears: mocks.trueUpYears }));
vi.mock("@/lib/true-up/cost", () => ({ cycleRows: mocks.cycleRows, trueUpCost: mocks.trueUpCost }));
vi.mock("@/lib/true-up/savings", () => ({ trueUpSavings: mocks.trueUpSavings }));
vi.mock("@/lib/true-up/payback", () => ({ payback: mocks.payback }));
vi.mock("@/lib/impact", () => ({ impactFigures: mocks.impactFigures }));
const redirect = vi.hoisted(() => vi.fn((to: string) => { throw new Error(`NEXT_REDIRECT ${to}`); }));
vi.mock("next/navigation", () => ({ redirect, useRouter: () => ({ push: vi.fn() }) }));

const { default: Page, generateMetadata } = await import("./page");

const served = async (searchParams: Record<string, string> = {}) => renderToString(await Page({ searchParams: Promise.resolve(searchParams) }));
const at = (instant: string) => vi.setSystemTime(Date.parse(instant));

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  // The current year turns over on the October 5, 2026 read.
  mocks.trueUpYears.mockImplementation(async (today: string) => (today >= "2026-10-05" ? YEARS : YEARS.slice(0, -1).map((y, i, all) => ({ ...y, current: i === all.length - 1 }))));
  mocks.cycleRows.mockImplementation(async (start: string) => (start === "2025-10-01" ? YEAR_25_26 : CURRENT));
  mocks.trueUpCost.mockImplementation(async (start: string) => (start === "2025-10-01" ? COST_25_26 : CURRENT_COST));
  mocks.trueUpSavings.mockImplementation(async (start: string) => (start === "2025-10-01" ? SAVINGS_25_26 : CURRENT_SAVINGS));
  mocks.impactFigures.mockImplementation(async (start: string) => ({ total_solar_percentage: start === "2025-10-03" ? 89 : 73, total_house: 1 }));
});

afterEach(() => {
  vi.useRealTimers();
  Object.values(mocks).forEach((mock) => mock.mockReset());
});

test("a shared link serves '25 - '26 with its tiles and cycles", async () => {
  at("2026-11-08T20:00:00Z");
  const html = await served({ start: "2025-10-01", end: "2026-09-30" });
  expect(mocks.cycleRows).toHaveBeenCalledWith("2025-10-01", "2026-09-30");
  expect(mocks.trueUpCost).toHaveBeenCalledWith("2025-10-01", "2026-09-30", "2026-11-08");
  expect(html).toContain("Net for the year");
  expect(html).toContain("$767.73");
  expect(mocks.trueUpSavings).toHaveBeenCalledWith("2025-10-01", "2026-09-30");
  expect(html).toContain("What the system saved");
  expect(html).toContain("$5,577");
  expect(html).toContain("Oct 3 to Nov 3");
  expect(html).toContain("2025\u201126<!-- --> by billing cycle");
});

test("a range that isn't a true-up year is served without its cost", async () => {
  at("2026-11-08T20:00:00Z");
  const html = await served({ start: "2021-10-01", end: "2027-09-30" });
  expect(mocks.trueUpCost).not.toHaveBeenCalled();
  expect(mocks.trueUpSavings).not.toHaveBeenCalled();
  expect(html).not.toContain("What the system saved");
  expect(html).toContain(">Net<");
  expect(html).not.toContain("Charges so far");
});

test("no range is served as the current true-up year", async () => {
  // 1:00 AM on November 9 in New York, still November 8 at the site.
  at("2026-11-09T06:00:00Z");
  const html = await served();
  expect(mocks.cycleRows).toHaveBeenCalledWith("2026-10-01", "2027-09-30");
  expect(html).toContain("Net so far");
});

test.each([
  [{ start: "nope", end: "2026-10-31" }],
  [{ start: "1900-01-01", end: "2026-10-31" }],
  [{ start: "2026-10-31", end: "2026-10-01" }],
  [{ start: "2030-10-01", end: "2031-09-30" }],
])("%j redirects to the address without its range", async (params) => {
  await expect(served(params)).rejects.toThrow(new Error("NEXT_REDIRECT /true-up?unshown=1"));
  expect(mocks.cycleRows).not.toHaveBeenCalled();
});

test("the day before the October read, the current year is still '25 - '26; on the read, the next", async () => {
  at("2026-10-04T20:00:00Z");
  await served();
  expect(mocks.cycleRows).toHaveBeenLastCalledWith("2025-10-01", "2026-09-30");
  at("2026-10-05T20:00:00Z");
  await served();
  expect(mocks.cycleRows).toHaveBeenLastCalledWith("2026-10-01", "2027-09-30");
});

test("the Payback card is served with the page when there are payback years, for any range", async () => {
  at("2026-11-08T20:00:00Z");
  mocks.payback.mockResolvedValue({
    solar: { year: 2025, projected: false, estimated: true }, system: { year: 2030, projected: true, estimated: true },
    powerwalls: { year: null, wont: true }, outages: { count: 35, seconds: 564_840, longest_seconds: 188_172 },
  });
  expect(await served({ start: "2022-10-01", end: "2023-09-30" })).toContain("Solar paid for itself in 2025");
  mocks.payback.mockResolvedValue(null);
  expect(await served()).not.toContain("Payback");
});

test("a finished year is served with its headline against the year before; the current year asks for no other", async () => {
  at("2026-11-08T20:00:00Z");
  mocks.trueUpCost.mockImplementation(async (start: string) => (start === "2025-10-01" ? COST_25_26 : start === "2024-10-01" ? { ...COST_25_26, amount_due: 554.83 } : CURRENT_COST));
  const html = await served({ start: "2025-10-01", end: "2026-09-30" });
  expect(mocks.trueUpCost).toHaveBeenCalledWith("2024-10-01", "2025-09-30", "2026-11-08");
  expect(html.replace(/<[^>]+>/g, "").replace(/&#x27;/g, "'").replace(/ /g, " ")).toContain("2025\u201126 ended owing $768 at the true\u2011up, $213 more than 2024\u201125.");
  mocks.trueUpCost.mockClear();
  await served();
  expect(mocks.trueUpCost).toHaveBeenCalledTimes(1);
});

// dashboard-shell, "Each page's title".
test("the title names the true-up year shown", async () => {
  at("2026-11-23T12:00:00-08:00");
  const title = async (params: Record<string, string>) => (await generateMetadata({ searchParams: Promise.resolve(params) })).title;
  expect(await title({})).toBe("True-Up · 2026\u201127");
  expect(await title({ start: "2025-10-01", end: "2026-09-30" })).toBe("True-Up · 2025\u201126");
  // dashboard-shell, "True-Up's All time title": its range runs between true-up year boundaries, so it's named, not dated.
  expect(await title({ start: "2021-10-01", end: "2027-09-30" })).toBe("True-Up · All time");
  // dashboard-shell, "A range over all the data is All time": typed from the first day of service, it's still All time.
  expect(await title({ start: "2021-10-10", end: "2027-09-30" })).toBe("True-Up · All time");
});

// true-up-tracker, "The year explained": the year's share as Impact gives it, over the billing cycles' own days, as the
// net beside it counts them.
test("a true-up year is served with its explanation", async () => {
  at("2026-11-08T20:00:00Z");
  const past = await served({ start: "2025-10-01", end: "2026-09-30" });
  expect(mocks.impactFigures).toHaveBeenCalledWith("2025-10-03", "2026-10-04", "corrected");
  expect(past).toContain("solar covered 89% of the house&#x27;s use, so the house drew");
  const current = await served();
  expect(mocks.impactFigures).toHaveBeenLastCalledWith("2026-10-05", "2026-11-08", "corrected");
  expect(current).toContain("This true-up year solar has covered 73% of the house&#x27;s use so far");
});

// true-up-tracker, "The range explained": a range that isn't a true-up year is named by its cycles' days.
test("All time is served with its explanation, named by the cycles' days", async () => {
  at("2026-11-08T20:00:00Z");
  const html = await served({ start: "2021-10-01", end: "2027-09-30" });
  expect(mocks.impactFigures).toHaveBeenCalledWith("2026-10-05", "2026-11-08", "corrected");
  expect(html).toContain("Since October 5, 2026 solar has covered 73% of the house&#x27;s use, so the house has drawn");
});

// A new year with no house use saved yet has no share to give, rather than reading 0%.
test("a year without house use yet has no explanation", async () => {
  at("2026-11-08T20:00:00Z");
  mocks.impactFigures.mockResolvedValue({ total_solar_percentage: 0, total_house: 0 });
  expect(await served()).not.toContain("solar has covered");
});

const NOTICE = "That link asked for dates the site doesn&#x27;t have, so this shows";

test("a marked address says what it shows instead, under the title and before the chart; an unmarked one doesn't", async () => {
  at("2026-11-08T20:00:00Z");
  const html = await served({ unshown: "1" });
  expect(html).toContain(`${NOTICE} 2026\u201127.`);
  expect(html.indexOf(NOTICE)).toBeGreaterThan(html.indexOf("</h1>"));
  expect(html.indexOf(NOTICE)).toBeLessThan(html.indexOf("cycle-chart"));
  expect(await served()).not.toContain(NOTICE);
});
