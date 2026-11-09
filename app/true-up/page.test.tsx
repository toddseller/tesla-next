// The True-Up Tracker as the server renders it, from its address.
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { COST_25_26, CURRENT, CURRENT_COST, CURRENT_SAVINGS, SAVINGS_25_26, YEAR_25_26, YEARS } from "@/components/true-up/fixtures";

const mocks = vi.hoisted(() => ({ trueUpYears: vi.fn(), cycleRows: vi.fn(), trueUpCost: vi.fn(), trueUpSavings: vi.fn() }));
vi.mock("@/lib/true-up/reads", () => ({ trueUpYears: mocks.trueUpYears }));
vi.mock("@/lib/true-up/cost", () => ({ cycleRows: mocks.cycleRows, trueUpCost: mocks.trueUpCost }));
vi.mock("@/lib/true-up/savings", () => ({ trueUpSavings: mocks.trueUpSavings }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

const { default: Page } = await import("./page");

const served = async (searchParams: Record<string, string> = {}) => renderToString(await Page({ searchParams: Promise.resolve(searchParams) }));
const at = (instant: string) => vi.setSystemTime(Date.parse(instant));

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  // The current year turns over on the October 5, 2026 read.
  mocks.trueUpYears.mockImplementation(async (today: string) => (today >= "2026-10-05" ? YEARS : YEARS.slice(0, -1).map((y, i, all) => ({ ...y, current: i === all.length - 1 }))));
  mocks.cycleRows.mockImplementation(async (start: string) => (start === "2025-10-01" ? YEAR_25_26 : CURRENT));
  mocks.trueUpCost.mockImplementation(async (start: string) => (start === "2025-10-01" ? COST_25_26 : CURRENT_COST));
  mocks.trueUpSavings.mockImplementation(async (start: string) => (start === "2025-10-01" ? SAVINGS_25_26 : CURRENT_SAVINGS));
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
  expect(html).toContain("&#x27;25\u00a0-\u00a0&#x27;26<!-- --> by billing cycle");
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

test.each([
  [{}],
  [{ start: "nope", end: "2026-10-31" }],
  [{ start: "1900-01-01", end: "2026-10-31" }],
  [{ start: "2026-10-31", end: "2026-10-01" }],
])("%j is served as the current true-up year", async (params) => {
  // 1:00 AM on November 9 in New York, still November 8 at the site.
  at("2026-11-09T06:00:00Z");
  const html = await served(params);
  expect(mocks.cycleRows).toHaveBeenCalledWith("2026-10-01", "2027-09-30");
  expect(html).toContain("Net so far");
});

test("the day before the October read, the current year is still '25 - '26; on the read, the next", async () => {
  at("2026-10-04T20:00:00Z");
  await served();
  expect(mocks.cycleRows).toHaveBeenLastCalledWith("2025-10-01", "2026-09-30");
  at("2026-10-05T20:00:00Z");
  await served();
  expect(mocks.cycleRows).toHaveBeenLastCalledWith("2026-10-01", "2027-09-30");
});
