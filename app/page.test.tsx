// The Solar page as the server renders it, from its address.
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

const rangeTotals = vi.hoisted(() => vi.fn());
vi.mock("@/lib/range", () => ({ rangeTotals }));
const dayIntervals = vi.hoisted(() => vi.fn());
vi.mock("@/lib/intervals/intervals", () => ({ dayIntervals }));
vi.mock("@/lib/live", () => ({ latest: () => JSON.stringify({ modified: "2026-11-07T19:47:00Z" }) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }));

const { default: Page } = await import("./page");

const served = async (searchParams: Record<string, string> = {}) => renderToString(await Page({ searchParams: Promise.resolve(searchParams) }));

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(Date.parse("2026-11-07T20:00:00Z"));
  rangeTotals.mockResolvedValue([
    { date: "Oct 13", day: "2026-10-13", solar: 41.0, grid: -1.2, house: 31.1 },
    { date: "Oct 14", day: "2026-10-14", solar: 44.4, grid: -8.3, house: 34.0 },
  ]);
});

afterEach(() => {
  vi.useRealTimers();
  rangeTotals.mockReset();
  dayIntervals.mockReset();
});

// Recharts draws once the page mounts; the bars' data comes with the page, so drawing them needs no further request.
test("the range in the address is served with its data", async () => {
  const page = await Page({ searchParams: Promise.resolve({ start: "2026-10-01", end: "2026-10-31" }) });
  expect(rangeTotals).toHaveBeenCalledWith("2026-10-01", "2026-10-31");
  expect(page.props.items).toEqual(await rangeTotals.mock.results[0].value);
  expect(renderToString(page)).toMatch(/October 1\s–\s31, 2026/);
});

test("without a range, the current month is served", async () => {
  const html = await served();
  expect(rangeTotals).toHaveBeenCalledWith("2026-11-01", "2026-11-30");
  expect(html).toMatch(/November 1\s–\s30, 2026/);
});

test("a malformed range is served as the current month, with no error", async () => {
  await served({ start: "nope", end: "2026-10-31" });
  expect(rangeTotals).toHaveBeenCalledWith("2026-11-01", "2026-11-30");
});

test("an open day is served with its data, its strip's bars and the latest live update", async () => {
  dayIntervals.mockResolvedValue({ date: "2026-10-14", vehicle_data: false, totals: { solar_to_home: 12.27 }, data: [], off_grid: [], storm_watch: [] });
  const page = await Page({ searchParams: Promise.resolve({ start: "2026-10-01", end: "2026-10-31", day: "2026-10-14" }) });
  expect(dayIntervals).toHaveBeenCalledWith("2026-10-14");
  expect(page.props.day.data.date).toBe("2026-10-14");
  expect(page.props.day.strip.range).toEqual({ start: "2026-10-01", end: "2026-10-31" });
  expect(page.props.initialStatus).toContain("2026-11-07T19:47:00Z");
  expect(renderToString(page)).toContain("Wed, Oct 14, 2026");
});

test("a day after today is ignored, and the range is served", async () => {
  const html = await served({ start: "2026-10-01", end: "2026-10-31", day: "2030-01-01" });
  expect(dayIntervals).not.toHaveBeenCalled();
  expect(html).toContain("Solar by date range");
});

test("a day outside the range has its own month in the strip", async () => {
  dayIntervals.mockResolvedValue({ date: "2026-11-01", totals: {}, data: [], off_grid: [], storm_watch: [] });
  await Page({ searchParams: Promise.resolve({ start: "2026-10-01", end: "2026-10-31", day: "2026-11-01" }) });
  expect(rangeTotals).toHaveBeenCalledWith("2026-11-01", "2026-11-07");
});
