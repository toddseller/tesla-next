// @vitest-environment jsdom
// The range chart of the solar-range-chart spec, with October 2026 and the 2025 to 2026 true-up year as /api/range answers
// for them.
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

import { BarDetails, RangeChart } from "@/components/solar/range-chart";
import type { RangeItem } from "@/lib/range";

afterEach(cleanup);

const OCTOBER: RangeItem[] = [
  [37.1, 10.6, 50.8], [28.1, 42.1, 73.8], [48.4, 16.6, 47.5], [32.6, 1.1, 38.9], [36.6, 29.2, 51.2], [39.5, 55.9, 64.9],
  [44.2, 20.0, 39.2], [37.8, 39.7, 81.1], [22.5, 10.0, 44.4], [38.0, 8.4, 33.2], [38.1, 0.8, 45.2], [45.0, 7.9, 37.6],
  [41.0, -1.2, 31.1], [44.4, -8.3, 34.0], [43.5, -4.1, 36.1], [43.3, -10.8, 30.0], [41.9, -6.9, 33.2], [25.0, 2.7, 45.6],
  [36.7, 19.3, 32.5], [33.8, -0.1, 34.7], [8.4, 15.3, 30.7], [8.6, 62.3, 63.8], [32.4, 32.6, 55.3], [41.4, 6.4, 46.5],
  [40.5, 0.0, 45.7], [34.1, 38.5, 54.2], [32.0, 14.7, 51.0], [40.1, 22.7, 55.5], [29.2, 16.0, 40.7], [34.5, 4.0, 45.5],
  [27.8, 11.9, 45.2],
].map(([solar, grid, house], i) => ({ date: `Oct ${i + 1}`, day: `2026-10-${String(i + 1).padStart(2, "0")}`, solar, grid, house }));

const TRUE_UP_YEAR: RangeItem[] = [
  ["Oct-25", 997.6, 299.5, 1261.7], ["Nov-25", 775.8, 573.9, 1312.5], ["Dec-25", 678.1, 1010.6, 1661.8],
  ["Jan-26", 790.7, 682.4, 1445.8], ["Feb-26", 820.0, 411.3, 1204.5], ["Mar-26", 1483.1, -71.5, 1331.9],
  ["Apr-26", 1171.8, 244.0, 1368.2], ["May-26", 1683.2, -254.5, 1345.5], ["Jun-26", 1691.1, -460.8, 1143.2],
  ["Jul-26", 1544.2, -353.2, 1112.3], ["Aug-26", 1440.0, 79.7, 1368.1], ["Sep-26", 1287.4, 350.0, 1495.8],
].map(([date, solar, grid, house]) => ({ date: date as string, solar: solar as number, grid: grid as number, house: house as number }));

const OCTOBER_RANGE = { start: "2026-10-01", end: "2026-10-31" };
const YEAR_RANGE = { start: "2025-10-01", end: "2026-09-30" };
const periodItems = (labels: string[]) => labels.map((date) => ({ date, solar: 900, grid: -100, house: 800 }));

const section = (container: HTMLElement, series: string, label: string) =>
  container.querySelector(`[data-series="${series}"][data-label="${label}"]`) as HTMLElement;

test("a daily bar stacks solar and house above zero and negative grid below, rounding only its outer ends", () => {
  const { container } = render(<RangeChart items={OCTOBER} range={OCTOBER_RANGE} onOpenDay={() => {}} onOpenRange={() => {}} />);
  expect(container.querySelectorAll('[data-series="solar"]')).toHaveLength(31);
  expect(section(container, "solar", "Oct 14").dataset.ends).toBe("");
  expect(section(container, "grid", "Oct 14").dataset.ends).toBe("bottom");
  expect(section(container, "house", "Oct 14").dataset.ends).toBe("top");
  expect(section(container, "solar", "Oct 1").dataset.ends).toBe("bottom");
});

test("clicking a daily bar opens its day", () => {
  const onOpenDay = vi.fn();
  const { container } = render(<RangeChart items={OCTOBER} range={OCTOBER_RANGE} onOpenDay={onOpenDay} onOpenRange={() => {}} />);
  fireEvent.click(section(container, "house", "Oct 14"));
  expect(onOpenDay).toHaveBeenCalledWith("2026-10-14");
});

test("monthly bars are labeled by month and year, and clicking one opens its month", () => {
  const [onOpenDay, onOpenRange] = [vi.fn(), vi.fn()];
  const { container } = render(<RangeChart items={TRUE_UP_YEAR} range={YEAR_RANGE} onOpenDay={onOpenDay} onOpenRange={onOpenRange} />);
  expect(container.querySelectorAll('[data-series="solar"]')).toHaveLength(12);
  fireEvent.click(section(container, "house", "Oct 2025"));
  expect(onOpenRange).toHaveBeenCalledWith({ start: "2025-10-01", end: "2025-10-31" });
  expect(onOpenDay).not.toHaveBeenCalled();
});

test("a month with no figures yet has nothing to open", () => {
  const onOpenRange = vi.fn();
  const items = [{ date: "Oct-26", solar: 997.6, grid: 299.5, house: 1261.7 }, { date: "Nov-26", solar: null, grid: null, house: null }];
  const { container } = render(<RangeChart items={items} range={{ start: "2026-10-01", end: "2027-09-30" }} onOpenDay={() => {}} onOpenRange={onOpenRange} />);
  fireEvent.click(section(container, "solar", "Nov 2026"));
  expect(onOpenRange).not.toHaveBeenCalled();
});

test("a month-long period opens as the range cuts it", () => {
  const onOpenRange = vi.fn();
  const { container } = render(
    <RangeChart items={periodItems(["Jan-26", "Feb-26", "Mar-26", "Apr-26", "May-26"])} range={{ start: "2026-01-15", end: "2026-06-14" }} onOpenDay={() => {}} onOpenRange={onOpenRange} />,
  );
  fireEvent.click(section(container, "solar", "Feb 2026"));
  expect(onOpenRange).toHaveBeenCalledWith({ start: "2026-02-15", end: "2026-03-14" });
});

test("a partial first month opens from the range's first day", () => {
  const onOpenRange = vi.fn();
  const { container } = render(
    <RangeChart items={periodItems(["Jan-26", "Feb-26", "Mar-26", "Apr-26", "May-26", "Jun-26"])} range={{ start: "2026-01-15", end: "2026-06-30" }} onOpenDay={() => {}} onOpenRange={onOpenRange} />,
  );
  fireEvent.click(section(container, "solar", "Jan 2026"));
  expect(onOpenRange).toHaveBeenCalledWith({ start: "2026-01-15", end: "2026-01-31" });
});

test("a legend names the flows, a note explains grid below zero, and the axis is in kWh", () => {
  const { container } = render(<RangeChart items={OCTOBER} range={OCTOBER_RANGE} onOpenDay={() => {}} onOpenRange={() => {}} />);
  for (const name of ["Solar", "Grid", "House"]) expect(screen.getByText(name)).toBeTruthy();
  expect(screen.getByText(/grid below zero/i).textContent).toMatch(/more energy sent to the grid than taken from it/);
  expect(container.querySelector("svg.recharts-surface")?.textContent).toMatch(/\d kWh/);
});

test("a day's details show its values and that clicking opens it", () => {
  render(<BarDetails active label="Oct 14" payload={[{ payload: { label: "Oct 14", day: "2026-10-14", solar: 44.4, grid: -8.3, house: 34.0 } }]} />);
  expect(screen.getByText("Oct 14")).toBeTruthy();
  expect(screen.getByText("44.4 kWh")).toBeTruthy();
  expect(screen.getByText("-8.3 kWh")).toBeTruthy();
  expect(screen.getByText("34.0 kWh")).toBeTruthy();
  expect(screen.getByText(/click to open the day/i)).toBeTruthy();
});

test("a month's details show its values and that clicking shows its days", () => {
  render(<BarDetails active label="May 2026" payload={[{ payload: { label: "May 2026", period: { start: "2026-05-01", end: "2026-05-31" }, solar: 1683.2, grid: -254.5, house: 1345.5 } }]} />);
  expect(screen.getByText("1,683.2 kWh")).toBeTruthy();
  expect(screen.getByText(/click to see its days/i)).toBeTruthy();
});

test("the value axis steps by round numbers", () => {
  const { container } = render(<RangeChart items={TRUE_UP_YEAR} range={YEAR_RANGE} onOpenDay={() => {}} onOpenRange={() => {}} />);
  const labels = [...container.querySelectorAll("svg.recharts-surface text")].map((text) => text.textContent).filter((text) => /^-?[\d,]+( kWh)?$/.test(text!));
  expect(labels).toEqual(["-1,000", "0", "1,000", "2,000", "3,000", "4,000 kWh"]);
});

// site-motion, "Charts draw in when the view changes".
const topOf = (path: Element) => Number(path.getAttribute("d")!.match(/^M[\d.]+,([\d.]+)/)![1]);
const originY = (path: Element) => Number((path as SVGElement).style.transformOrigin.match(/^0px ([\d.]+)px$/)?.[1]);

test("every segment rises from the chart's zero line, staggered by its column", () => {
  const { container } = render(<RangeChart items={OCTOBER} range={OCTOBER_RANGE} onOpenDay={() => {}} onOpenRange={() => {}} />);
  const segments = [...container.querySelectorAll("[data-series]")];
  expect(segments.every((path) => path.classList.contains("motion-rise"))).toBe(true);
  // Oct 14 sent more to the grid than it took, so its grid segment hangs from the zero line with a square top.
  const zero = topOf(section(container, "grid", "Oct 14"));
  expect(segments.every((path) => originY(path) === zero)).toBe(true);
  expect((section(container, "solar", "Oct 1") as unknown as SVGElement).style.getPropertyValue("--i")).toBe("0");
  expect((section(container, "house", "Oct 14") as unknown as SVGElement).style.getPropertyValue("--i")).toBe("13");
});

test("once the chart has entered, a reload's re-render rises nothing again", () => {
  vi.useFakeTimers();
  const { container, rerender } = render(<RangeChart items={OCTOBER} range={OCTOBER_RANGE} onOpenDay={() => {}} onOpenRange={() => {}} />);
  act(() => vi.advanceTimersByTime(650));
  rerender(<RangeChart items={OCTOBER.map((item) => ({ ...item }))} range={OCTOBER_RANGE} onOpenDay={() => {}} onOpenRange={() => {}} />);
  expect(container.querySelectorAll(".motion-rise")).toHaveLength(0);
  vi.useRealTimers();
});

// site-motion, "Reduced motion turns it off": a reload's new total lands at once.
test("under reduced motion, a reload moves today's column straight to its new height", () => {
  vi.stubGlobal("matchMedia", (query: string) => ({ matches: query === "(prefers-reduced-motion: reduce)", addEventListener() {}, removeEventListener() {} }));
  vi.useFakeTimers();
  const grown = OCTOBER.map((item, i) => (i === 30 ? { ...item, solar: 60 } : item));
  const chart = (items: RangeItem[]) => <RangeChart items={items} range={OCTOBER_RANGE} onOpenDay={() => {}} onOpenRange={() => {}} />;
  const settled = render(chart(grown));
  const target = section(settled.container, "solar", "Oct 31").getAttribute("d");
  settled.unmount();
  const { container, rerender } = render(chart(OCTOBER));
  act(() => vi.advanceTimersByTime(650));
  rerender(chart(grown));
  expect(section(container, "solar", "Oct 31").getAttribute("d")).toBe(target);
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
