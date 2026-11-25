// @vitest-environment jsdom
// The true-up-tracker spec's cycle chart.
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

import { chartRows, CycleChart } from "@/components/true-up/cycle-chart";
import { COST_25_26, CURRENT, CURRENT_COST, NO_COST, YEAR_25_26 } from "@/components/true-up/fixtures";

afterEach(cleanup);

const bars = (container: HTMLElement, series: string) => [...container.querySelectorAll(`[data-series="${series}"]`)] as HTMLElement[];
const legend = () => screen.getAllByRole("listitem").map((item) => item.textContent!.replace(/ /g, " "));

test("the current year in November: bars for October and November, slots for all twelve cycles", () => {
  const rows = chartRows(CURRENT, CURRENT_COST, true);
  expect(rows.map((row) => row.label)).toEqual(["Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"]);
  expect(rows.map((row) => row.imported).slice(0, 3)).toEqual([576.6, 83.5, null]);
  expect(rows.map((row) => row.exported).slice(0, 3)).toEqual([-206.7, -44.7, null]);

  const { container } = render(<CycleChart cycles={CURRENT} cost={CURRENT_COST} oneYear />);
  expect(bars(container, "imported")).toHaveLength(2);
  expect(bars(container, "exported")).toHaveLength(2);
});

// Energy sent to PG&E is the grid's color on every page, a lighter tint of it as on Home's Today chart.
test("imports are grid colored and round only at the top, exports a lighter grid tint and round only at the bottom", () => {
  const { container } = render(<CycleChart cycles={YEAR_25_26} cost={COST_25_26} oneYear />);
  expect(bars(container, "imported").map((bar) => [bar.getAttribute("fill"), bar.getAttribute("fill-opacity"), bar.dataset.ends])).toEqual(Array(12).fill(["var(--color-grid)", null, "top"]));
  expect(bars(container, "exported").map((bar) => [bar.getAttribute("fill"), bar.getAttribute("fill-opacity"), bar.dataset.ends])).toEqual(Array(12).fill(["var(--color-grid)", "0.55", "bottom"]));
  const swatch = screen.getByText("Exported").querySelector("span")!;
  expect([swatch.style.background, swatch.style.opacity]).toEqual(["var(--color-grid)", "0.55"]);
  expect(container.innerHTML).not.toContain("color-solar");
});

test("the running net starts again at each true-up year's first cycle", () => {
  const rows = chartRows([YEAR_25_26[10], YEAR_25_26[11], CURRENT[0], CURRENT[1]], NO_COST, false);
  expect(rows.map((row) => row.running)).toEqual([98.6, 450.2, 369.8, 408.6]);
  expect(rows.map((row) => row.label)).toEqual(["Aug '26", "Sep '26", "Oct '26", "Nov '26"]);
});

const runningLines = (container: HTMLElement) =>
  [...container.querySelectorAll('.recharts-line-curve[stroke="var(--foreground)"]')].map((curve) => curve.getAttribute("d")!.match(/[ML]/g)!.length);

test("the running net is drawn apart at each true-up start, nothing joining one year to the next", () => {
  const { container } = render(<CycleChart cycles={[YEAR_25_26[10], YEAR_25_26[11], CURRENT[0], CURRENT[1]]} cost={NO_COST} oneYear={false} />);
  expect(runningLines(container)).toEqual([2, 2]);
  cleanup();
  const { container: one } = render(<CycleChart cycles={YEAR_25_26} cost={COST_25_26} oneYear />);
  expect(runningLines(one)).toEqual([12]);
});

test("a cycle without data in the middle keeps its slot, and the running net after it stays in place", () => {
  const gap = YEAR_25_26.map((c, i) => (i === 5 ? { ...c, imported: null, exported: null, net: null, peak_net: null, off_peak_net: null } : c));
  const rows = chartRows(gap, COST_25_26, true);
  expect(rows.map((row) => row.running).slice(4, 8)).toEqual([2932.6, null, 3180.5, 2781.4]);
  expect(rows.at(-1)!.running).toBe(2424.8);
});

test("one true-up year: last year's running net across its cycles, and the projection band from the open cycle", () => {
  const rows = chartRows(CURRENT, CURRENT_COST, true);
  expect(rows.map((row) => row.lastYear)).toEqual(CURRENT_COST.last_year!.running_net);
  expect(rows[0].band).toBeNull();
  expect(rows[1].band).toEqual([520.4, 560.2]);
  expect(rows[11].band).toEqual([2031.9, 2361.5]);

  render(<CycleChart cycles={CURRENT} cost={CURRENT_COST} oneYear />);
  expect(legend()).toEqual(["Imported", "Exported", "Running net", "2025\u201126", "Projected"]);
});

test("a finished year shows last year without a band", () => {
  render(<CycleChart cycles={YEAR_25_26} cost={COST_25_26} oneYear />);
  expect(legend()).toEqual(["Imported", "Exported", "Running net", "2024\u201125"]);
});

test("other ranges have neither, and only the started cycles", () => {
  const rows = chartRows(CURRENT, CURRENT_COST, false);
  expect(rows).toHaveLength(2);
  expect(rows.every((row) => row.lastYear === null && row.band === null)).toBe(true);

  render(<CycleChart cycles={CURRENT} cost={CURRENT_COST} oneYear={false} />);
  expect(legend()).toEqual(["Imported", "Exported", "Running net"]);
});

// site-motion, "Charts draw in when the view changes".
test("on first view each cycle's column rises from zero and the lines draw in; after that nothing moves on a re-render", () => {
  vi.useFakeTimers();
  const { container, rerender } = render(<CycleChart cycles={YEAR_25_26} cost={COST_25_26} oneYear />);
  const segments = [...bars(container, "imported"), ...bars(container, "exported")] as unknown as SVGElement[];
  expect(segments.every((bar) => bar.classList.contains("motion-rise"))).toBe(true);
  expect(new Set(segments.map((bar) => bar.style.transformOrigin)).size).toBe(1);
  expect(container.querySelector("clipPath#motion-flows rect")!.getAttribute("class")).toBe("motion-draw-only");
  expect(container.querySelectorAll(".motion-clip-flows").length).toBeGreaterThan(0);
  act(() => vi.advanceTimersByTime(650));
  rerender(<CycleChart cycles={YEAR_25_26} cost={COST_25_26} oneYear />);
  expect(container.querySelectorAll(".motion-rise, .motion-clip-flows, clipPath#motion-flows")).toHaveLength(0);
  vi.useRealTimers();
});

// DESIGN.md: Tesla red is a marker, never a surface or a series.
test("the projected band, the running net and their keys are neutral shades", () => {
  const { container } = render(<CycleChart cycles={CURRENT} cost={CURRENT_COST} oneYear />);
  const band = container.querySelector(".recharts-area-area");
  expect(band?.getAttribute("fill")).toBe("var(--muted-foreground)");
  const swatch = screen.getByText("Projected").querySelector("span")!;
  expect(swatch.className).toContain("bg-muted-foreground/");
  expect(swatch.className).not.toContain("bg-primary");
  const net = screen.getByText("Running net").querySelector("span")!;
  expect(net.className).toContain("bg-foreground");
  expect(net.className).not.toContain("bg-primary");
});

// A mid-gray line along the seam between the light and darker gray bars makes dense ranges look wavy (café wall).
test("no line is drawn across the bars at zero", () => {
  const { container } = render(<CycleChart cycles={YEAR_25_26} cost={COST_25_26} oneYear />);
  expect(container.querySelector(".recharts-reference-line")).toBeNull();
});

const red = (container: HTMLElement) => [...container.querySelectorAll('[stroke="var(--primary)"], [fill="var(--primary)"]')] as SVGElement[];
const lastPoint = (container: HTMLElement) =>
  [...container.querySelectorAll('.recharts-line-curve[stroke="var(--foreground)"]')].at(-1)!.getAttribute("d")!.match(/(-?[\d.]+),(-?[\d.]+)$/)!.slice(1).map(Number);

test("the only red on the chart is one dot at the running net's last point, on the latest year's line", () => {
  const { container } = render(<CycleChart cycles={[YEAR_25_26[10], YEAR_25_26[11], CURRENT[0], CURRENT[1]]} cost={NO_COST} oneYear={false} />);
  const marks = red(container);
  expect(marks).toHaveLength(1);
  expect(marks[0].tagName).toBe("circle");
  expect([marks[0].getAttribute("cx"), marks[0].getAttribute("cy")].map(Number)).toEqual(lastPoint(container));
});

test("pointing at the latest cycle leaves its red dot in view, with no hover dot over it", async () => {
  const { container } = render(<CycleChart cycles={CURRENT} cost={CURRENT_COST} oneYear />);
  const [x, y] = lastPoint(container);
  await act(async () => {
    fireEvent.mouseMove(container.querySelector(".recharts-wrapper")!, { clientX: x, clientY: y });
    await new Promise((resolve) => setTimeout(resolve, 50));
  });
  expect(container.querySelector(".recharts-tooltip-wrapper")!.textContent).toMatch(/^Nov/);
  expect(container.querySelectorAll('.recharts-active-dot [fill="var(--foreground)"]')).toHaveLength(0);
  expect(red(container)).toHaveLength(1);
});

test("on the current year the red dot sits at November, the last cycle with a running net", () => {
  const { container } = render(<CycleChart cycles={CURRENT} cost={CURRENT_COST} oneYear />);
  const marks = red(container);
  expect(marks).toHaveLength(1);
  expect([marks[0].getAttribute("cx"), marks[0].getAttribute("cy")].map(Number)).toEqual(lastPoint(container));
});

test("a year's running net past 1,000 kWh puts the axis in MWh, which names its own unit", () => {
  const { container } = render(<CycleChart cycles={YEAR_25_26} cost={COST_25_26} oneYear />);
  const labels = [...container.querySelectorAll("svg.recharts-surface text")].map((text) => text.textContent!).filter((text) => /^-?[\d,.]+( [kM]Wh)?$/.test(text));
  expect(labels.at(-1)).toMatch(/^[\d.]+ MWh$/);
  expect(container.textContent).toContain("Bars are each cycle's imports above zero and exports below");
  expect(container.textContent).not.toContain("kWh.");
});
