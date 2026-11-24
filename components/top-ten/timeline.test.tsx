// @vitest-environment jsdom
// The timeline of a ranking's ten, from the top-ten spec.
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";

import { dayEntries, monthEntries, outageEntries, solarEntries } from "@/components/top-ten/entries";
import { EXPORT_DAYS, OUTAGES, SOLAR } from "@/components/top-ten/fixtures";
import { Timeline } from "@/components/top-ten/timeline";

afterEach(cleanup);

const solar = () => render(<Timeline label="Top ten solar days" entries={solarEntries(SOLAR)} flow="solar" today="2026-11-08" />);
const dot = (rank: number) => screen.getByTitle(new RegExp(`^#${rank}: `));

test("each dot is placed by its date from October 2021 to the end of this year, and by its figure", () => {
  solar();
  expect(dot(1).style.left).toBe("13.3%");
  expect(dot(10).style.left).toBe("90.3%");
  // 80.9 kWh on an axis from 78 to 81.
  expect(dot(1).style.top).toBe("3.33%");
  expect(dot(1).title).toBe("#1: 80.9 kWh, Jun 13, 2022");
});

test("the figure axis spans the ten, not zero, and the years are marked with this one shaded", () => {
  solar();
  expect(screen.getAllByText(/^\d\d$/).map((t) => t.textContent)).toEqual(["78", "79", "80", "81"]);
  const years = screen.getAllByText(/^20\d\d$/);
  expect(years.map((y) => [y.textContent, y.style.left])).toEqual([["2022", "4.8%"], ["2023", "23.84%"], ["2024", "42.88%"], ["2025", "61.97%"], ["2026", "81.01%"]]);
  expect(screen.getByTitle("This year").style.left).toBe("81.01%");
});

test("#1 is ringed, #2 and #3 carry their rank, and the rest are plain dots", () => {
  solar();
  expect(dot(1).className).toContain("ring-primary");
  expect([dot(1), dot(2), dot(3), dot(4)].map((d) => d.textContent)).toEqual(["", "2", "3", ""]);
  expect(dot(4).className).not.toContain("ring-primary");
});

test("solar days are drawn in the solar color, exports in the grid color", () => {
  solar();
  expect(dot(5).className).toContain("bg-solar");
  cleanup();
  render(<Timeline label="Top ten export days" entries={dayEntries(EXPORT_DAYS)} flow="grid" today="2026-11-08" />);
  expect(dot(5).className).toContain("bg-grid");
  cleanup();
  render(<Timeline label="Top ten outages" entries={outageEntries(OUTAGES)} flow="powerwall" today="2026-11-09" />);
  expect(dot(2).className).toContain("bg-powerwall");
  expect(dot(2).getAttribute("title")).toBe("#2: 1 d 11 h, Dec 14, 2024");
});

test("the timeline is described in words", () => {
  solar();
  const label = screen.getByRole("img").getAttribute("aria-label")!;
  expect(label).toMatch(/^Top ten solar days: #1 80\.9 kWh Jun 13, 2022; #2 80\.2 kWh Jun 21, 2025;/);
  expect(label.split("; ")).toHaveLength(10);
});

// site-motion, "Charts draw in when the view changes": the dots fade and grow in, the record first.
test("each dot fades and grows in, in rank order", () => {
  solar();
  expect(dot(1).classList.contains("motion-pop")).toBe(true);
  expect(dot(1).style.getPropertyValue("--i")).toBe("0");
  expect(dot(10).style.getPropertyValue("--i")).toBe("9");
});

test("the outage timeline's axis reads in days and hours, as its dots do", () => {
  render(<Timeline label="Top ten outages" entries={outageEntries(OUTAGES)} flow="powerwall" today="2026-11-09" />);
  expect(document.body.textContent).toContain("1 d 16 h");
  expect(document.body.textContent).not.toContain("0 m");
  // Wide enough for "2 d 12 h" on one line.
  expect(screen.getByRole("img").className).toContain("grid-cols-[72px_minmax(0,1fr)]");
  expect(document.body.textContent).not.toMatch(/(^|\D)40(\D|$)/);
});

// DESIGN.md: Tesla red is a marker, never a surface, so this year's band is a neutral shade.
test("this year's band is shaded in the muted foreground, not red", () => {
  solar();
  const band = screen.getByTitle("This year");
  expect(band.className).toContain("bg-muted-foreground/");
  expect(band.className).not.toContain("bg-primary");
});

test("a ranking in MWh has its axis in MWh", () => {
  render(<Timeline label="Top ten export months" flow="grid" today="2026-11-08"
    entries={monthEntries([{ date: "May 2026", net_grid: -1204.3, month: "2026-05" }, { date: "Apr 2024", net_grid: -987.6, month: "2024-04" }])} />);
  expect(screen.getAllByText(/^\d(\.\d)?$/).map((t) => t.textContent)).toEqual(["0.9", "1", "1.1", "1.2", "1.3", "2"]);
  // The last "2" is #2's rank in its dot.
  expect(dot(1).title).toBe("#1: 1.2 MWh, May 2026");
});

test("a best month under 1,000 kWh keeps the axis in kWh, even when its top tick rounds up to 1,000", () => {
  render(<Timeline label="Top ten export months" flow="grid" today="2026-11-08"
    entries={monthEntries([{ date: "May 2026", net_grid: -985, month: "2026-05" }, { date: "Apr 2024", net_grid: -720, month: "2024-04" }])} />);
  expect(screen.getAllByText(/^[\d,]+$/).filter((t) => !/^20\d\d$/.test(t.textContent!) && t.textContent!.length > 1).map((t) => t.textContent)).toEqual(["700", "800", "900", "1,000"]);
});
