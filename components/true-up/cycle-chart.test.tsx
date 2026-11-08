// @vitest-environment jsdom
// The true-up-tracker spec's cycle chart.
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";

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

test("imports are grid colored and round only at the top, exports solar colored and round only at the bottom", () => {
  const { container } = render(<CycleChart cycles={YEAR_25_26} cost={COST_25_26} oneYear />);
  expect(bars(container, "imported").map((bar) => [bar.getAttribute("fill"), bar.dataset.ends])).toEqual(Array(12).fill(["var(--color-grid)", "top"]));
  expect(bars(container, "exported").map((bar) => [bar.getAttribute("fill"), bar.dataset.ends])).toEqual(Array(12).fill(["var(--color-solar)", "bottom"]));
});

test("the running net starts again at each true-up year's first cycle", () => {
  const rows = chartRows([YEAR_25_26[10], YEAR_25_26[11], CURRENT[0], CURRENT[1]], NO_COST, false);
  expect(rows.map((row) => row.running)).toEqual([98.6, 450.2, 369.8, 408.6]);
  expect(rows.map((row) => row.label)).toEqual(["Aug '26", "Sep '26", "Oct '26", "Nov '26"]);
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
  expect(legend()).toEqual(["Imported", "Exported", "Running net", "'25 - '26", "Projected"]);
});

test("a finished year shows last year without a band", () => {
  render(<CycleChart cycles={YEAR_25_26} cost={COST_25_26} oneYear />);
  expect(legend()).toEqual(["Imported", "Exported", "Running net", "'24 - '25"]);
});

test("other ranges have neither, and only the started cycles", () => {
  const rows = chartRows(CURRENT, CURRENT_COST, false);
  expect(rows).toHaveLength(2);
  expect(rows.every((row) => row.lastYear === null && row.band === null)).toBe(true);

  render(<CycleChart cycles={CURRENT} cost={CURRENT_COST} oneYear={false} />);
  expect(legend()).toEqual(["Imported", "Exported", "Running net"]);
});
