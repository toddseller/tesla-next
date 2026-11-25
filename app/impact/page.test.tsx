// The Impact page as the server renders it, from its address.
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

const impactFigures = vi.hoisted(() => vi.fn());
vi.mock("@/lib/impact", () => ({ impactFigures }));
const backupHistory = vi.hoisted(() => vi.fn(async () => ({ summary: { outages: 0, seconds: 0, longest: null, house_kwh: 0, powerwalls_kwh: 0, solar_kwh: 0, closest: null, blips: [] }, events: [] })));
vi.mock("@/lib/backup", () => ({ backupHistory }));
const carCharging = vi.hoisted(() => vi.fn(async () => ({
  since: null, cars_since: null, total_kwh: 10, solar_kwh: 0, powerwall_kwh: 6, grid_kwh: 4,
  solar_percentage: 0, powerwall_percentage: 60, grid_percentage: 40, off_grid_percentage: 60, cars: [],
})));
vi.mock("@/lib/car-charging", () => ({ carCharging }));
const redirect = vi.hoisted(() => vi.fn((to: string) => { throw new Error(`NEXT_REDIRECT ${to}`); }));
vi.mock("next/navigation", () => ({ redirect, useRouter: () => ({ push: vi.fn() }) }));

const { default: Page, generateMetadata } = await import("./page");

const served = async (searchParams: Record<string, string> = {}) => renderToString(await Page({ searchParams: Promise.resolve(searchParams) }));

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  // 1:00 AM on November 9 in New York, still November 8 at the site.
  vi.setSystemTime(Date.parse("2026-11-09T06:00:00Z"));
  impactFigures.mockResolvedValue({
    from_solar_percentage: 35, from_powerwall_percentage: 60, from_grid_percentage: 5, self_powered_percentage: 95,
    total_solar_percentage: 55, total_solar: 25.0, from_solar: 15.8, from_powerwall: 27.5, from_grid: 2.3, total_house: 45.6,
  });
});

afterEach(() => {
  vi.useRealTimers();
  impactFigures.mockReset();
});

test("the range in the address is served with its figures", async () => {
  const html = await served({ start: "2026-10-18", end: "2026-10-18" });
  expect(impactFigures).toHaveBeenCalledWith("2026-10-18", "2026-10-18", "corrected");
  expect(html).toContain("October 18, 2026");
  expect(html).toContain("<span>95%</span>");
  expect(html).toContain("45.6 kWh");
});

test("no range is served as today in the site's time zone", async () => {
  const html = await served();
  expect(impactFigures).toHaveBeenCalledWith("2026-11-08", "2026-11-08", "corrected");
  expect(html).toContain("November 8, 2026");
});

test.each([
  [{ start: "nope", end: "2026-10-31", backup: "25-26" }],
  [{ start: "1900-01-01", end: "2026-10-31", backup: "25-26" }],
  [{ start: "2026-10-31", end: "2026-10-01", backup: "25-26" }],
])("%j redirects to the address without its range", async (params) => {
  await expect(served(params)).rejects.toThrow(new Error("NEXT_REDIRECT /impact?backup=25-26&unshown=1"));
  expect(impactFigures).not.toHaveBeenCalled();
});

test("the Backup section is served for the year in the address, this true-up year without one", async () => {
  await served({ backup: "23-24" });
  expect(backupHistory).toHaveBeenLastCalledWith({ start: "2023-10-01", end: "2024-09-30" });
  await served();
  expect(backupHistory).toHaveBeenLastCalledWith({ start: "2026-10-01", end: "2027-09-30" });
});

// backup-history, "The Backup section follows the page's year": the page's All time or true-up year wins over the address.
test("the Backup section is served for the page's All time or true-up year, whatever backup says", async () => {
  await served({ start: "2021-10-10", end: "2026-11-08", backup: "23-24" });
  expect(backupHistory).toHaveBeenLastCalledWith({ start: "2021-10-01", end: "2027-09-30" });
  await served({ start: "2023-10-01", end: "2024-09-30", backup: "all" });
  expect(backupHistory).toHaveBeenLastCalledWith({ start: "2023-10-01", end: "2024-09-30" });
  await served({ start: "2026-03-01", end: "2026-03-31", backup: "23-24" });
  expect(backupHistory).toHaveBeenLastCalledWith({ start: "2023-10-01", end: "2024-09-30" });
});

test("the range's car charging is served with the page, counted up to today at the site", async () => {
  const html = await served({ start: "2026-10-18", end: "2026-10-18" });
  expect(carCharging).toHaveBeenCalledWith("2026-10-18", "2026-10-18", "2026-11-08", "corrected");
  expect(html).toContain("Home car charging");
  expect(html).toContain("kWh into the cars");
});

// meter-correction: the address's readings reach the figures.
test("readings=tesla in the address asks for Tesla's figures", async () => {
  await served({ start: "2025-10-01", end: "2025-10-31", readings: "tesla" });
  expect(impactFigures).toHaveBeenCalledWith("2025-10-01", "2025-10-31", "tesla");
});

// impact-report, "Default and invalid ranges": early in the day, a whole day rather than nothing.
test("with no range, before today has made a tenth of a kWh of solar, yesterday is served", async () => {
  impactFigures.mockImplementation(async (start: string) => ({
    from_solar_percentage: 0, from_powerwall_percentage: 0, from_grid_percentage: 100, self_powered_percentage: 0,
    total_solar_percentage: 0, total_solar: start === "2026-11-08" ? 0.04 : 22.1, from_solar: 0, from_powerwall: 0, from_grid: 1, total_house: 1,
  }));
  const html = await served();
  expect(impactFigures).toHaveBeenCalledWith("2026-11-07", "2026-11-07", "corrected");
  expect(html).toContain("November 7, 2026");
});

test("a range in the address is served as asked, even before any solar today", async () => {
  impactFigures.mockImplementation(async () => ({
    from_solar_percentage: 0, from_powerwall_percentage: 0, from_grid_percentage: 100, self_powered_percentage: 0,
    total_solar_percentage: 0, total_solar: 0, from_solar: 0, from_powerwall: 0, from_grid: 1, total_house: 1,
  }));
  await served({ start: "2026-11-08", end: "2026-11-08" });
  // Today is only partly over, so it isn't compared with a year earlier.
  expect(impactFigures.mock.calls).toEqual([["2026-11-08", "2026-11-08", "corrected"]]);
});

test("with no range, once today has solar, today is served from the one read", async () => {
  const html = await served();
  expect(impactFigures.mock.calls).toEqual([["2026-11-08", "2026-11-08", "corrected"]]);
  expect(html).toContain("November 8, 2026");
});

test("the sentence comes with the page, against the year-earlier days in the same readings", async () => {
  impactFigures.mockImplementation(async (start: string) => ({
    from_solar_percentage: 0, from_powerwall_percentage: 0, from_grid_percentage: 0, self_powered_percentage: start.startsWith("2025") ? 27 : 35,
    total_solar_percentage: 0, total_solar: 1, from_solar: 0, from_powerwall: 0, from_grid: 1, total_house: 1,
  }));
  const html = await served({ start: "2026-11-01", end: "2026-11-30", readings: "tesla" });
  expect(impactFigures).toHaveBeenCalledWith("2025-11-01", "2025-11-07", "tesla");
  expect(html.replace(/<[^>]+>/g, "")).toContain("35% self-powered in November so far, up from 27% over the same days last year.");
});

test("year-earlier days without home use, or before the first day, give the share alone", async () => {
  impactFigures.mockImplementation(async (start: string) => ({
    from_solar_percentage: 0, from_powerwall_percentage: 0, from_grid_percentage: 0, self_powered_percentage: 0,
    total_solar_percentage: 0, total_solar: 1, from_solar: 0, from_powerwall: 0, from_grid: 1, total_house: start.startsWith("2025") ? 0 : 1,
  }));
  expect((await served({ start: "2026-11-01", end: "2026-11-30" })).replace(/<[^>]+>/g, "")).toContain("0% self-powered in November so far.");
  impactFigures.mockClear();
  expect((await served({ start: "2022-01-01", end: "2022-12-31" })).replace(/<[^>]+>/g, "")).toContain("0% self-powered in 2022.");
  expect(impactFigures).toHaveBeenCalledTimes(1);
});

// dashboard-shell, "Each page's title": the range the page shows, yesterday before any solar today.
test("the title names the range shown", async () => {
  const title = async (params: Record<string, string>) => (await generateMetadata({ searchParams: Promise.resolve(params) })).title;
  expect(await title({ start: "2026-10-18", end: "2026-10-18" })).toBe("Impact · Oct 18, 2026");
  expect(await title({})).toBe("Impact · Nov 8, 2026");
  impactFigures.mockResolvedValueOnce({
    from_solar_percentage: 0, from_powerwall_percentage: 60, from_grid_percentage: 40, self_powered_percentage: 60,
    total_solar_percentage: 0, total_solar: 0.0, from_solar: 0, from_powerwall: 1.2, from_grid: 0.8, total_house: 2.0,
  });
  expect(await title({})).toBe("Impact · Nov 7, 2026");
});

const NOTICE = "That link asked for dates the site doesn&#x27;t have, so this shows";

test("a marked address says what it shows instead, under the title and before the figures; an unmarked one doesn't", async () => {
  const html = await served({ unshown: "1" });
  expect(html).toContain(`${NOTICE} Nov 8, 2026.`);
  expect(html.indexOf(NOTICE)).toBeGreaterThan(html.indexOf("</h1>"));
  expect(html.indexOf(NOTICE)).toBeLessThan(html.indexOf("impact-title"));
  expect(await served()).not.toContain(NOTICE);
});
