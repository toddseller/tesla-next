// @vitest-environment jsdom
// The range chart of the solar-range-chart spec, with October 2026 and the 2025 to 2026 true-up year as Flask answers
// for them.
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
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

const section = (container: HTMLElement, series: string, label: string) =>
  container.querySelector(`[data-series="${series}"][data-label="${label}"]`) as HTMLElement;

test("a daily bar stacks solar and house above zero and negative grid below, rounding only its outer ends", () => {
  const { container } = render(<RangeChart items={OCTOBER} onOpenDay={() => {}} />);
  expect(container.querySelectorAll('[data-series="solar"]')).toHaveLength(31);
  expect(section(container, "solar", "Oct 14").dataset.ends).toBe("");
  expect(section(container, "grid", "Oct 14").dataset.ends).toBe("bottom");
  expect(section(container, "house", "Oct 14").dataset.ends).toBe("top");
  expect(section(container, "solar", "Oct 1").dataset.ends).toBe("bottom");
});

test("clicking a daily bar opens its day", () => {
  const onOpenDay = vi.fn();
  const { container } = render(<RangeChart items={OCTOBER} onOpenDay={onOpenDay} />);
  fireEvent.click(section(container, "house", "Oct 14"));
  expect(onOpenDay).toHaveBeenCalledWith("2026-10-14");
});

test("monthly bars are labeled by month and year, and clicking one does nothing", () => {
  const onOpenDay = vi.fn();
  const { container } = render(<RangeChart items={TRUE_UP_YEAR} onOpenDay={onOpenDay} />);
  expect(container.querySelectorAll('[data-series="solar"]')).toHaveLength(12);
  fireEvent.click(section(container, "house", "May 2026"));
  expect(onOpenDay).not.toHaveBeenCalled();
});

test("a legend names the flows, a note explains grid below zero, and the axis is in kWh", () => {
  const { container } = render(<RangeChart items={OCTOBER} onOpenDay={() => {}} />);
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

test("a month's details show its values, without the click", () => {
  render(<BarDetails active label="May 2026" payload={[{ payload: { label: "May 2026", solar: 1683.2, grid: -254.5, house: 1345.5 } }]} />);
  expect(screen.getByText("1,683.2 kWh")).toBeTruthy();
  expect(screen.queryByText(/click/i)).toBeNull();
});

test("the value axis steps by round numbers", () => {
  const { container } = render(<RangeChart items={TRUE_UP_YEAR} onOpenDay={() => {}} />);
  const labels = [...container.querySelectorAll("svg.recharts-surface text")].map((text) => text.textContent).filter((text) => /^-?[\d,]+( kWh)?$/.test(text!));
  expect(labels).toEqual(["-1,000", "0", "1,000", "2,000", "3,000", "4,000 kWh"]);
});
