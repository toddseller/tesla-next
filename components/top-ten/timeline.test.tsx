// @vitest-environment jsdom
// The timeline of a ranking's ten, from the top-ten spec.
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";

import { dayEntries, monthEntries, outageEntries, solarEntries } from "@/components/top-ten/entries";
import { EXPORT_DAYS, OUTAGES, SOLAR } from "@/components/top-ten/fixtures";
import { placeRanks, Timeline } from "@/components/top-ten/timeline";

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
  expect(screen.getAllByText(/^\d\d$/).filter((t) => !t.title).map((t) => t.textContent)).toEqual(["78", "79", "80", "81"]);
  const years = screen.getAllByText(/^20\d\d$/);
  expect(years.map((y) => [y.textContent, y.style.left])).toEqual([["2022", "4.8%"], ["2023", "23.84%"], ["2024", "42.88%"], ["2025", "61.97%"], ["2026", "81.01%"]]);
  expect(screen.getByText("this year").parentElement!.style.left).toBe("81.01%");
});

// A plot the timeline has measured, through a stubbed ResizeObserver, as cloud-canvas.test.tsx does.
function measured(width: number, draw = solar) {
  let resized = () => {};
  const original = globalThis.ResizeObserver;
  globalThis.ResizeObserver = class { constructor(callback: () => void) { resized = callback; } observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
  try {
    draw();
  } finally {
    globalThis.ResizeObserver = original;
  }
  Object.defineProperty(dot(1).parentElement!, "clientWidth", { value: width, configurable: true });
  act(() => resized());
}

test("#1 is a ringed 10px dot, the rest 8px, none carrying a number inside", () => {
  solar();
  expect(dot(1).className).toContain("ring-primary");
  expect(dot(1).className).toContain("size-2.5");
  const ranks = Array.from({ length: 10 }, (_, i) => dot(i + 1));
  expect(ranks.every((d) => d.textContent === "")).toBe(true);
  expect(ranks.slice(1).every((d) => / size-2( |$)/.test(d.className) && !d.className.includes("ring-primary"))).toBe(true);
});

test("once the plot is measured, every rank shows beside its dot, drawing in with it", () => {
  measured(265);
  const five = screen.getByText("5");
  expect(five.classList.contains("motion-pop")).toBe(true);
  expect(five.style.getPropertyValue("--i")).toBe("4");
  expect(Array.from({ length: 10 }, (_, i) => screen.getByText(String(i + 1))).length).toBe(10);
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

test("until the plot is measured, the dots show without ranks", () => {
  solar();
  expect(dot(5)).toBeTruthy();
  expect(screen.queryByText("5")).toBeNull();
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
  const band = screen.getByText("this year").parentElement!;
  expect(band.className).toContain("bg-muted-foreground/");
  expect(band.className).not.toContain("bg-primary");
});

test("a ranking in MWh has its axis in MWh", () => {
  render(<Timeline label="Top ten export months" flow="grid" today="2026-11-08"
    entries={monthEntries([{ date: "May 2026", net_grid: -1204.3, month: "2026-05" }, { date: "Apr 2024", net_grid: -987.6, month: "2024-04" }])} />);
  expect(screen.getAllByText(/^\d(\.\d)?$/).map((t) => t.textContent)).toEqual(["0.9", "1", "1.1", "1.2", "1.3"]);
  expect(dot(1).title).toBe("#1: 1.2 MWh, May 2026");
});

test("a best month under 1,000 kWh keeps the axis in kWh, even when its top tick rounds up to 1,000", () => {
  render(<Timeline label="Top ten export months" flow="grid" today="2026-11-08"
    entries={monthEntries([{ date: "May 2026", net_grid: -985, month: "2026-05" }, { date: "Apr 2024", net_grid: -720, month: "2024-04" }])} />);
  expect(screen.getAllByText(/^[\d,]+$/).filter((t) => !/^20\d\d$/.test(t.textContent!) && t.textContent!.length > 1).map((t) => t.textContent)).toEqual(["700", "800", "900", "1,000"]);
});

// Today's live rankings (2026-11-24) in plot pixels, as a 200px-tall timeline to the end of 2026 places them.
const span = [Date.parse("2021-10-01"), Date.parse("2026-12-31")];
const pixels = (width: number, [low, high]: number[], rows: [string, number][]) =>
  rows.map(([day, figure], i) => ({ rank: i + 1, x: (width * (Date.parse(day) - span[0])) / (span[1] - span[0]), y: (200 * (high - figure)) / (high - low) }));
const LIVE_SOLAR: [string, number][] = [["2022-06-13", 80.9], ["2025-06-21", 80.2], ["2023-06-20", 80.1], ["2022-05-29", 79.9], ["2022-05-30", 79.7],
  ["2024-06-17", 79.5], ["2022-06-14", 78.8], ["2024-06-16", 78.6], ["2022-05-20", 78.6], ["2026-06-28", 78.5]];

test("on a phone, every solar rank sits level with its own dot, #4 and #5 a day apart included", () => {
  const dots = pixels(265, [78, 81], LIVE_SOLAR);
  const labels = placeRanks(dots, 265);
  expect(labels.map((l) => l.text)).toEqual(["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]);
  expect(labels.every((l, i) => l.top === dots[i].y && !l.line)).toBe(true);
  const [four, five] = [labels[3], labels[4]];
  expect(Math.abs(four.top - five.top)).toBeGreaterThanOrEqual(12);
});

const LIVE_EXPORT_DAYS: [string, number][] = [["2025-05-21", 45.9], ["2025-05-22", 45.5], ["2026-07-16", 44.7], ["2024-07-04", 44.7], ["2024-05-23", 43.9],
  ["2026-06-06", 43.4], ["2026-07-14", 42.1], ["2024-07-05", 42.1], ["2024-06-05", 41.9], ["2025-06-21", 41.8]];

test("export day #1 at the top of its axis keeps its rank level with its ring, clear of #2 a day later", () => {
  const dots = pixels(265, [40, 46], LIVE_EXPORT_DAYS);
  const [one] = placeRanks(dots, 265);
  expect(one).toMatchObject({ text: "1", top: dots[0].y, line: undefined });
  // 13px from the dot's center, past its red ring.
  expect([one.left - dots[0].x, dots[0].x - (one.left + 6.7)]).toContain(13);
  const two = dots[1];
  expect(one.left > two.x + 8 || one.left + 6.7 < two.x - 8 || Math.abs(one.top - two.y) >= 14).toBe(true);
});

const LIVE_OUTAGES: [string, number][] = [["2024-02-04", 52.27], ["2024-12-14", 35.44], ["2022-08-09", 11.42], ["2024-06-03", 10.53], ["2024-01-20", 7.52],
  ["2025-08-23", 7.19], ["2025-03-13", 5.73], ["2025-02-04", 5.48], ["2024-11-27", 4.29], ["2025-02-04", 4.05]];

test("on a phone, outages #7, #8 and #10 share one label, and a rank that moves is joined to its dot by a line", () => {
  const dots = pixels(237, [0, 60], LIVE_OUTAGES);
  const labels = placeRanks(dots, 237);
  expect(labels.map((l) => l.text)).toEqual(["1", "2", "3", "4", "5", "6", "7, 8, 10", "9"]);
  const moved = labels.filter((l) => l.line);
  expect(moved.length).toBeGreaterThan(0);
  for (const l of moved) {
    const lead = dots[l.first - 1];
    expect(l.line!.slice(0, 2)).toEqual([lead.x, lead.y]);
    expect(l.line![3]).toBe(l.top);
  }
});

test("a rank near the right edge goes to the left of its dot", () => {
  const [ten] = placeRanks([{ rank: 10, x: 258, y: 100 }], 265);
  expect(ten.left + 2 * 6.7).toBe(258 - 8);
});

// At 1440px (a 722px plot) outage #9's rank sat between its dot and #8's, and read as #8's.
test.each([237, 265, 480, 722])("at %ipx no other dot sits level with a rank within 16px of it", (width) => {
  const axes: [[number, number], [string, number][]][] = [[[78, 81], LIVE_SOLAR], [[40, 46], LIVE_EXPORT_DAYS], [[0, 60], LIVE_OUTAGES]];
  for (const [axis, rows] of axes) {
    const dots = pixels(width, axis, rows);
    for (const l of placeRanks(dots, width)) {
      const own = l.text.split(", ").map(Number);
      const right = l.left + l.text.length * 6.7;
      const beside = dots.filter((d) => !own.includes(d.rank) && Math.abs(d.y - l.top) < 6 && d.x > l.left - 16 && d.x < right + 16);
      expect(beside.map((d) => d.rank), `${l.text} at ${width}px`).toEqual([]);
    }
  }
});

test("a moved rank's line is drawn in the full muted foreground, and shared ranks are separated by commas, not a dot", () => {
  measured(237, () => render(<Timeline label="Top ten outages" flow="powerwall" today="2026-11-24"
    entries={outageEntries(LIVE_OUTAGES.map(([day, hours]) => ({ date: day, day, hours })))} />));
  expect(screen.getByText("7, 8, 10")).toBeTruthy();
  const svg = document.querySelector("svg")!;
  expect(svg.querySelectorAll("line").length).toBeGreaterThan(0);
  expect(svg.getAttribute("class")).toContain("stroke-muted-foreground");
  expect(svg.getAttribute("class")).not.toMatch(/stroke-muted-foreground\//);
});

// The lines lie over the whole plot; a dot's title is the only place its figure shows, so hovering must reach it.
test("the lines' layer lets the pointer through to the dots", () => {
  measured(265);
  expect(document.querySelector("svg")!.getAttribute("class")).toContain("pointer-events-none");
});
