// @vitest-environment jsdom
// The Impact page's Backup section, from the backup-history spec.
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

import { BackupSection } from "@/components/impact/backup-section";
import type { BackupHistory } from "@/lib/backup";

const TODAY = "2026-11-09";
const THIS_YEAR = { start: "2026-10-01", end: "2027-09-30" };
const EMPTY: BackupHistory = { summary: { outages: 0, seconds: 0, longest: null, house_kwh: 0, powerwalls_kwh: 0, solar_kwh: 0, closest: null, blips: [] }, events: [] };

afterEach(cleanup);

const picker = () => within(screen.getByRole("group", { name: "Backup years" }));
const pressed = () => picker().getAllByRole("button").filter((b) => b.getAttribute("aria-pressed") === "true").map((b) => b.textContent);

test("the picker reads This year, the two years before, Earlier and All time, in that order, This year chosen", () => {
  render(<BackupSection history={EMPTY} year={THIS_YEAR} today={TODAY} onYear={() => {}} />);
  expect(picker().getAllByRole("button").map((b) => b.textContent)).toEqual(["This year", "'25 - '26", "'24 - '25", "Earlier", "All time"]);
  expect(pressed()).toEqual(["This year"]);
});

test("an earlier year picked from Earlier is chosen and names the button", () => {
  const onYear = vi.fn();
  const { rerender } = render(<BackupSection history={EMPTY} year={THIS_YEAR} today={TODAY} onYear={onYear} />);
  fireEvent.click(picker().getByRole("button", { name: "Earlier" }));
  fireEvent.click(screen.getByRole("menuitemradio", { name: "'23 - '24" }));
  expect(onYear).toHaveBeenCalledWith({ start: "2023-10-01", end: "2024-09-30" });
  rerender(<BackupSection history={EMPTY} year={{ start: "2023-10-01", end: "2024-09-30" }} today={TODAY} onYear={onYear} />);
  expect(pressed()).toEqual(["'23 - '24"]);
});

test("All time is every year", () => {
  const onYear = vi.fn();
  render(<BackupSection history={EMPTY} year={THIS_YEAR} today={TODAY} onYear={onYear} />);
  fireEvent.click(picker().getByRole("button", { name: "All time" }));
  expect(onYear).toHaveBeenCalledWith({ start: "2021-10-01", end: "2027-09-30" });
});

const YEAR_23_24 = { start: "2023-10-01", end: "2024-09-30" };
const eventRows = () => [...document.querySelectorAll<HTMLElement>('[data-part="event"]')];
const HISTORY: BackupHistory = {
  summary: { outages: 2, seconds: 191_772, longest: { start: "2024-02-04T22:51:38.000Z", seconds: 188_172 }, house_kwh: 269.54, powerwalls_kwh: 154.2, solar_kwh: 114.6, closest: null, blips: [] },
  events: [
    { start: "2024-03-01T18:00:00.000Z", end: "2024-03-01T18:01:04.216Z", kind: "test", battery: null, weather: null },
    { start: "2024-02-04T22:51:38.000Z", end: "2024-02-07T03:07:50.000Z", kind: "outage", battery: null, weather: null },
    { start: "2023-12-01T20:00:18.000Z", end: "2023-12-01T20:00:36.000Z", kind: "blip", battery: null, weather: null },
    { start: "2023-12-01T17:00:00.000Z", end: "2023-12-01T18:00:00.000Z", kind: "outage", battery: null, weather: null },
  ],
};

test("the summary gives the outages' number, time, longest with its day, and the house's energy through them", () => {
  render(<BackupSection history={HISTORY} year={YEAR_23_24} today={TODAY} onYear={() => {}} />);
  const summary = within(screen.getByRole("group", { name: "Outages" }));
  expect(summary.getByText("2")).toBeTruthy();
  expect(summary.getByText("2 d 5 h")).toBeTruthy();
  expect(summary.getByText("2 d 4 h")).toBeTruthy();
  expect(summary.getByRole("link", { name: "Feb 4, 2024" }).getAttribute("href")).toBe("/?start=2024-02-01&end=2024-02-29&day=2024-02-04");
  expect(summary.getByText("269.5 kWh")).toBeTruthy();
  expect(summary.getByText("Powerwalls 154.2 · Solar 114.6")).toBeTruthy();
});

test("every event is listed newest first with its start, duration and kind, each linking to its day", () => {
  render(<BackupSection history={HISTORY} year={YEAR_23_24} today={TODAY} onYear={() => {}} />);
  const rows = eventRows();
  expect(rows.map((row) => row.textContent)).toEqual([
    "Mar 1, 2024, 10:00 AM1 m 4 sTest",
    "Feb 4, 2024, 2:51 PM2 d 4 hOutage",
    // A storm day's rows give only their time, under its heading.
    "12:00 PM18 sBlip",
    "9:00 AM1 h 0 mOutage",
  ]);
  expect(within(rows[1]).getByRole("link").getAttribute("href")).toBe("/?start=2024-02-01&end=2024-02-29&day=2024-02-04");
});

test("each event's bar is its length against the year's longest event", () => {
  render(<BackupSection history={HISTORY} year={YEAR_23_24} today={TODAY} onYear={() => {}} />);
  const widths = [...document.querySelectorAll<HTMLElement>('[data-part="duration-bar"]')].map((bar) => bar.style.width);
  expect(widths[1]).toBe("100%");
  expect(parseFloat(widths[3])).toBeCloseTo((3600 / 188_172) * 100, 3);
});

test("a year without outages says so, and still lists its other events", () => {
  render(<BackupSection history={{ ...EMPTY, events: [HISTORY.events[0]] }} year={THIS_YEAR} today={TODAY} onYear={() => {}} />);
  expect(screen.getByText("No outages.")).toBeTruthy();
  expect(eventRows()).toHaveLength(1);
});

test("a year without events says so", () => {
  render(<BackupSection history={EMPTY} year={THIS_YEAR} today={TODAY} onYear={() => {}} />);
  expect(screen.getByText("No backup events.")).toBeTruthy();
});

const FULL = { drop_kwh: 20.6, low_at: "2024-02-06T14:10:00.000Z", complete: true, full: true, low_percent: 42.78, left_kwh: 15.4, hours_left: 14.2, refilled: true };
const OUTAGES: BackupHistory = {
  summary: { ...HISTORY.summary, closest: { percent: 36.2, at: "2024-12-15T12:10:00.000Z" }, blips: [{ label: "'23 - '24", count: 1 }] },
  events: [
    { start: "2024-03-01T18:00:00.000Z", end: "2024-03-01T19:00:00.000Z", kind: "outage", weather: "Calm", battery: { ...FULL, full: false, low_percent: null, left_kwh: null, hours_left: null, refilled: false, drop_kwh: 12 } },
    { start: "2024-02-04T22:51:38.000Z", end: "2024-02-07T03:07:50.000Z", kind: "outage", weather: "Heavy rain, high wind", battery: FULL },
    { start: "2024-01-20T18:00:00.000Z", end: "2024-01-20T19:00:00.000Z", kind: "outage", weather: null, battery: { ...FULL, complete: false, low_percent: null, left_kwh: null, hours_left: null, refilled: false, drop_kwh: 1.2 } },
    { start: "2023-12-01T20:00:18.000Z", end: "2023-12-01T20:00:36.000Z", kind: "blip", battery: null, weather: null },
    { start: "2023-12-01T17:00:00.000Z", end: "2023-12-01T18:00:00.000Z", kind: "outage", weather: null, battery: { ...FULL, drop_kwh: 0, complete: false, low_at: "2023-12-01T17:00:00.000Z", low_percent: null, left_kwh: null, hours_left: null, refilled: false } },
  ],
};

test("the Closest call tile gives the year's lowest rebuilt charge and its day, or a dash", () => {
  render(<BackupSection history={OUTAGES} year={YEAR_23_24} today={TODAY} onYear={() => {}} />);
  const summary = within(screen.getByRole("group", { name: "Outages" }));
  expect(summary.getByText("~36%")).toBeTruthy();
  expect(summary.getByRole("link", { name: "Dec 15, 2024" }).getAttribute("href")).toBe("/?start=2024-12-01&end=2024-12-31&day=2024-12-15");
  cleanup();
  render(<BackupSection history={HISTORY} year={YEAR_23_24} today={TODAY} onYear={() => {}} />);
  expect(within(screen.getByRole("group", { name: "Outages" })).getByText("Closest call").parentElement!.textContent).toBe("Closest call—");
});

test("the blips line gives one year's count, or each year's for All time", () => {
  render(<BackupSection history={OUTAGES} year={YEAR_23_24} today={TODAY} onYear={() => {}} />);
  expect(screen.getByText("1 blip")).toBeTruthy();
  cleanup();
  const all = { ...OUTAGES, summary: { ...OUTAGES.summary, blips: [{ label: "'21 - '22", count: 3 }, { label: "'22 - '23", count: 0 }] } };
  render(<BackupSection history={all} year={{ start: "2021-10-01", end: "2027-09-30" }} today={TODAY} onYear={() => {}} />);
  expect(screen.getByText("Blips: '21 - '22 3 · '22 - '23 0")).toBeTruthy();
});

test("each outage's detail line: weather, lowest charge or how far the Powerwalls fell, and the solar refill", () => {
  render(<BackupSection history={OUTAGES} year={YEAR_23_24} today={TODAY} onYear={() => {}} />);
  expect(eventRows().map((row) => row.querySelector('[data-part="detail"]')?.textContent ?? null)).toEqual([
    "Calm · the Powerwalls fell ~12.0 kWh",
    "Heavy rain, high wind · lowest ~43%, ~15.4 kWh and ~14 h left · solar refilled the Powerwalls",
    "The Powerwalls fell ~1.2 kWh, from incomplete data",
    null,
    "No energy data",
  ]);
  expect(screen.getByText(/worked out from the 5-minute energy data, about 36 kWh from full to empty/)).toBeTruthy();
});

test("a drop that rounds to 0.0 kWh leaves the battery part out", () => {
  const tiny = { ...OUTAGES.events[0], battery: { ...OUTAGES.events[0].battery!, drop_kwh: 0.04 } };
  render(<BackupSection history={{ ...OUTAGES, events: [tiny] }} year={YEAR_23_24} today={TODAY} onYear={() => {}} />);
  expect(eventRows()[0].querySelector('[data-part="detail"]')!.textContent).toBe("Calm");
});

test("a full start that barely drew the batteries down leaves the charge part out too", () => {
  const brief = { ...OUTAGES.events[1], battery: { ...FULL, drop_kwh: 0.02, low_percent: 99.94, left_kwh: 35.98, hours_left: 66, refilled: false } };
  render(<BackupSection history={{ ...OUTAGES, events: [brief] }} year={YEAR_23_24} today={TODAY} onYear={() => {}} />);
  expect(eventRows()[0].querySelector('[data-part="detail"]')!.textContent).toBe("Heavy rain, high wind");
});

test("a storm day is grouped under its first day, count and time off the grid", () => {
  render(<BackupSection history={OUTAGES} year={YEAR_23_24} today={TODAY} onYear={() => {}} />);
  const heading = document.querySelector('[data-part="storm-day"]')!;
  expect(heading.textContent).toBe("Dec 1, 20232 events · 1 h 0 m off the grid");
  expect(heading.closest("li")!.querySelectorAll('[data-part="event"]')).toHaveLength(2);
});
