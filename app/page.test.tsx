// The home page's address: old Solar addresses move to /solar (solar-range-chart spec), the rest is the story page,
// served with every chapter's figures from the readers its linked pages use (home-story spec).
import { renderToString } from "react-dom/server";
import { beforeEach, expect, test, vi } from "vitest";

const permanentRedirect = vi.hoisted(() => vi.fn(() => { throw new Error("NEXT_REDIRECT"); }));
vi.mock("next/navigation", () => ({ permanentRedirect, useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/components/scene/cloud-renderer", () => ({ createCloudRenderer: () => null }));

const TODAY = "2026-11-21";
const readers = vi.hoisted(() => ({
  forecast: vi.fn(), dayIntervals: vi.fn(), solarHours: vi.fn(), impactFigures: vi.fn(), impactByMonth: vi.fn(),
  topTen: vi.fn(), recordSeries: vi.fn(), patterns: vi.fn(), trueUpYears: vi.fn(), cycleRows: vi.fn(), payback: vi.fn(),
}));
vi.mock("@/lib/scene/replay", async (original) => ({ ...(await original<typeof import("@/lib/scene/replay")>()), siteToday: () => TODAY }));
vi.mock("@/lib/live", () => ({ latest: () => JSON.stringify({ home_power: 1, grid_power: 1, modified: "2026-11-21T23:39:00Z" }), siteState: () => null }));
vi.mock("@/lib/forecast", async (original) => ({ ...(await original<typeof import("@/lib/forecast")>()), forecast: readers.forecast }));
vi.mock("@/lib/intervals/intervals", () => ({ dayIntervals: readers.dayIntervals }));
vi.mock("@/lib/home/solar-hours", () => ({ solarHours: readers.solarHours }));
vi.mock("@/lib/impact", () => ({ impactFigures: readers.impactFigures, impactByMonth: readers.impactByMonth }));
vi.mock("@/lib/top-ten", () => ({ topTen: readers.topTen, recordSeries: readers.recordSeries }));
vi.mock("@/lib/patterns", async (original) => ({ ...(await original<typeof import("@/lib/patterns")>()), patterns: readers.patterns }));
vi.mock("@/lib/true-up/reads", () => ({ trueUpYears: readers.trueUpYears }));
vi.mock("@/lib/true-up/cost", () => ({ cycleRows: readers.cycleRows }));
vi.mock("@/lib/true-up/payback", () => ({ payback: readers.payback }));

const { default: Page } = await import("./page");

const served = async (searchParams: Record<string, string> = {}) => renderToString(await Page({ searchParams: Promise.resolve(searchParams) }));
const SHARES = { from_solar_percentage: 39, from_powerwall_percentage: 30, from_grid_percentage: 31, self_powered_percentage: 69, total_solar_percentage: 100, total_solar: 75611.4, from_solar: 0, from_powerwall: 0, from_grid: 0, total_house: 0 };

beforeEach(() => {
  vi.clearAllMocks();
  readers.forecast.mockResolvedValue({ scale: { solar_kwh: 900, radiation_mj: 360, days: 30, good_day: 37 }, rows: [], so_far: 21.7, reading: null, hourly: { scale: [], days: 0, hours: [], made_until: null } });
  readers.dayIntervals.mockResolvedValue({ date: TODAY, vehicle_data: false, totals: {}, data: [] });
  readers.solarHours.mockResolvedValue([]);
  readers.impactFigures.mockResolvedValue(SHARES);
  readers.impactByMonth.mockResolvedValue([]);
  readers.topTen.mockResolvedValue([{ solar: [] }, { net_grid: [] }, { to_grid_months: [] }, { outages: [] }]);
  readers.recordSeries.mockResolvedValue({ solar: [], exportDays: [], exportMonths: [], outages: [] });
  readers.patterns.mockResolvedValue({ months: [{ month: "2026-11", watts: 864 }], years: [{ year: 2026, out_wh: 4417000, in_wh: 5000000, first_day: "2026-01-01" }], hours: [] });
  readers.trueUpYears.mockResolvedValue([{ label: "'26 - '27", start_date: "2026-10-01", end_date: "2027-09-30", last_read_date: "2027-10-04", current: true }]);
  readers.cycleRows.mockResolvedValue([{ net: 369.8, imported: 576.6, exported: 206.7, peak_net: 0, off_peak_net: 0 }, { net: 239.5, imported: 449.7, exported: 210.2, peak_net: 0, off_peak_net: 0 }, { net: null }]);
  readers.payback.mockResolvedValue(null);
});

test.each([
  [{ start: "2026-10-01", end: "2026-10-31", day: "2026-10-14" }, "/solar?start=2026-10-01&end=2026-10-31&day=2026-10-14"],
  [{ readings: "tesla" }, "/solar?readings=tesla"],
  [{ day: "2026-10-14" }, "/solar?day=2026-10-14"],
  [{ end: "2026-10-31" }, "/solar?end=2026-10-31"],
])("an old Solar address %o moves permanently to %s", async (params, to) => {
  await expect(served(params)).rejects.toThrow("NEXT_REDIRECT");
  expect(permanentRedirect).toHaveBeenCalledWith(to);
});

test.each<Record<string, string>>([{}, { year: "2023" }])("%o is the home page, with no redirect", async (params) => {
  const html = await served(params);
  expect(permanentRedirect).not.toHaveBeenCalled();
  expect(html.match(/<h1/g)).toHaveLength(1);
  expect(html).toContain("One home&#x27;s 12.24 kW of Tesla solar and three Powerwalls, live and since October 22, 2021.");
});

test("each reader is called as its linked page calls it, corrected readings throughout", async () => {
  await served();
  expect(readers.forecast).toHaveBeenCalledWith(TODAY);
  expect(readers.dayIntervals).toHaveBeenCalledWith(TODAY, "corrected");
  expect(readers.solarHours).toHaveBeenCalledWith(2026, TODAY);
  expect(readers.impactFigures).toHaveBeenCalledWith("2026-01-01", TODAY, "corrected");
  expect(readers.impactFigures).toHaveBeenCalledWith("2021-10-22", TODAY, "corrected");
  expect(readers.impactByMonth).toHaveBeenCalledWith("2021-10-22", TODAY, "corrected");
  expect(readers.topTen).toHaveBeenCalledWith(false, "corrected");
  expect(readers.recordSeries).toHaveBeenCalledWith(false, "corrected");
  expect(readers.patterns).toHaveBeenCalledWith(TODAY, "corrected");
  expect(readers.cycleRows).toHaveBeenCalledWith("2026-10-01", "2027-09-30");
  expect(readers.payback).toHaveBeenCalledWith(TODAY);
});

test("?year= picks the year chapter's year, and one outside 2021 to now falls back to the current one", async () => {
  await served({ year: "2023" });
  expect(readers.solarHours).toHaveBeenCalledWith(2023, TODAY);
  expect(readers.impactFigures).toHaveBeenCalledWith("2023-01-01", "2023-12-31", "corrected");
  vi.clearAllMocks();
  await served({ year: "2019" });
  expect(readers.solarHours).toHaveBeenCalledWith(2026, TODAY);
});

test("the first render holds the six chapter words in order and Pick a day, with the true-up net so far", async () => {
  const html = await served();
  const words = [...html.matchAll(/<h2[^>]*>([^<]+)<\/h2>/g)].map((m) => m[1]);
  expect(words).toEqual(["Now", "Today", "2026", "Records", "Habits", "Since 2021", "Pick a day"]);
  expect(html).toContain(">609.3<");
  expect(html).toContain("more imported than sent this true-up year, since October 1");
});
