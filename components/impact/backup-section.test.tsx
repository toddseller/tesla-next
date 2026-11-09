// @vitest-environment jsdom
// The Impact page's Backup section, from the backup-history spec.
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

import { BackupSection } from "@/components/impact/backup-section";
import type { BackupHistory } from "@/lib/backup";

const TODAY = "2026-11-09";
const THIS_YEAR = { start: "2026-10-01", end: "2027-09-30" };
const EMPTY: BackupHistory = { summary: { outages: 0, seconds: 0, longest: null, house_kwh: 0, powerwalls_kwh: 0, solar_kwh: 0 }, events: [] };

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
const HISTORY: BackupHistory = {
  summary: { outages: 2, seconds: 191_772, longest: { start: "2024-02-04T22:51:38.000Z", seconds: 188_172 }, house_kwh: 269.54, powerwalls_kwh: 154.2, solar_kwh: 114.6 },
  events: [
    { start: "2024-03-01T18:00:00.000Z", end: "2024-03-01T18:01:04.216Z", kind: "test" },
    { start: "2024-02-04T22:51:38.000Z", end: "2024-02-07T03:07:50.000Z", kind: "outage" },
    { start: "2023-12-01T20:00:18.000Z", end: "2023-12-01T20:00:36.000Z", kind: "blip" },
    { start: "2023-12-01T17:00:00.000Z", end: "2023-12-01T18:00:00.000Z", kind: "outage" },
  ],
};

test("the summary gives the outages' number, time, longest with its day, and the house's energy through them", () => {
  render(<BackupSection history={HISTORY} year={YEAR_23_24} today={TODAY} onYear={() => {}} />);
  const summary = within(screen.getByRole("group", { name: "Outages" }));
  expect(summary.getByText("2")).toBeTruthy();
  expect(summary.getByText("53.3 h")).toBeTruthy();
  expect(summary.getByText("52 h 16 m")).toBeTruthy();
  expect(summary.getByRole("link", { name: "Feb 4, 2024" }).getAttribute("href")).toBe("/?start=2024-02-01&end=2024-02-29&day=2024-02-04");
  expect(summary.getByText("269.5 kWh")).toBeTruthy();
  expect(summary.getByText("Powerwalls 154.2 · Solar 114.6")).toBeTruthy();
});

test("every event is listed newest first with its start, duration and kind, each linking to its day", () => {
  render(<BackupSection history={HISTORY} year={YEAR_23_24} today={TODAY} onYear={() => {}} />);
  const rows = within(screen.getByRole("list", { name: "Backup events" })).getAllByRole("listitem");
  expect(rows.map((row) => row.textContent)).toEqual([
    "Mar 1, 2024, 10:00 AM1 m 4 sTest",
    "Feb 4, 2024, 2:51 PM52 h 16 mOutage",
    "Dec 1, 2023, 12:00 PM18 sBlip",
    "Dec 1, 2023, 9:00 AM1 h 0 mOutage",
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
  expect(within(screen.getByRole("list", { name: "Backup events" })).getAllByRole("listitem")).toHaveLength(1);
});

test("a year without events says so", () => {
  render(<BackupSection history={EMPTY} year={THIS_YEAR} today={TODAY} onYear={() => {}} />);
  expect(screen.getByText("No backup events.")).toBeTruthy();
});
