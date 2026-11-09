// The Impact page as the server renders it, from its address.
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

const impactFigures = vi.hoisted(() => vi.fn());
vi.mock("@/lib/impact", () => ({ impactFigures }));
const backupHistory = vi.hoisted(() => vi.fn(async () => ({ summary: { outages: 0, seconds: 0, longest: null, house_kwh: 0, powerwalls_kwh: 0, solar_kwh: 0, closest: null, blips: [] }, events: [] })));
vi.mock("@/lib/backup", () => ({ backupHistory }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

const { default: Page } = await import("./page");

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
  expect(impactFigures).toHaveBeenCalledWith("2026-10-18", "2026-10-18");
  expect(html).toContain("October 18, 2026");
  expect(html).toMatch(/95<!-- -->%/);
  expect(html).toContain("45.6 kWh");
});

test.each([
  [{}],
  [{ start: "nope", end: "2026-10-31" }],
  [{ start: "1900-01-01", end: "2026-10-31" }],
  [{ start: "2026-10-31", end: "2026-10-01" }],
])("%j is served as today in the site's time zone", async (params) => {
  const html = await served(params);
  expect(impactFigures).toHaveBeenCalledWith("2026-11-08", "2026-11-08");
  expect(html).toContain("November 8, 2026");
});

test("the Backup section is served for the year in the address, this true-up year without one", async () => {
  await served({ backup: "23-24" });
  expect(backupHistory).toHaveBeenLastCalledWith({ start: "2023-10-01", end: "2024-09-30" });
  await served();
  expect(backupHistory).toHaveBeenLastCalledWith({ start: "2026-10-01", end: "2027-09-30" });
});
