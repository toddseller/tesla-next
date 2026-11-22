// @vitest-environment jsdom
// What each home chart shows on hover (home-story spec, "Every chart point gives its values"): the point's own figures,
// so the marker that follows the pointer is never empty.
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { HabitsDetails } from "./habits";
import { RecordDetails } from "./records";
import { SinceDetails } from "./since";
import { TodayDetails } from "./today";

afterEach(cleanup);
const rows = () => [...document.querySelectorAll('[data-part="detail"]')].map((row) => row.textContent);

test("Habits: the month, then each year's overnight draw, newest first", () => {
  render(<HabitsDetails active payload={[{ payload: { name: "Nov", 2024: 380, 2025: 643, 2026: 864 } }]} />);
  expect(screen.getByText("November")).toBeTruthy();
  expect(rows()).toEqual(["2026864 W", "2025643 W", "2024380 W"]);
});

test("Since 2021: the month and both running totals", () => {
  render(<SinceDetails active payload={[{ payload: { t: Date.UTC(2025, 2, 1), solar: 50000.4, house: 49012.6 } }]} />);
  expect(screen.getByText("March 2025")).toBeTruthy();
  expect(rows()).toEqual(["Solar made50,000 kWh", "House used49,013 kWh"]);
});

test("Records: when, and the record as it stood then, a month tab by its month", () => {
  render(<RecordDetails active show={(v) => `${v.toFixed(1)} kWh`} per="day" payload={[{ payload: { t: Date.parse("2022-06-13"), value: 80.9 } }]} />);
  expect(screen.getByText("June 13, 2022")).toBeTruthy();
  expect(rows()).toEqual(["Record80.9 kWh"]);
  cleanup();
  render(<RecordDetails active show={(v) => `${v.toFixed(1)} kWh`} per="month" payload={[{ payload: { t: Date.parse("2024-04-01"), value: 479.2 } }]} />);
  expect(screen.getByText("April 2024")).toBeTruthy();
});

test("Today: the time, then solar and where the energy went below the line", () => {
  render(<TodayDetails active payload={[{ payload: { minute: 600, solar: 6, charging: -2.5, exporting: -3 } }]} />);
  expect(screen.getByText("10:00 AM")).toBeTruthy();
  expect(rows()).toEqual(["Solar6.0 kW", "Into the Powerwalls2.5 kW", "Sent to PG&E3.0 kW"]);
});

test("Today: later in the day, the forecast's expected kW alone; earlier, with the flows", () => {
  render(<TodayDetails active payload={[{ payload: { minute: 990, kw: 1.24 } }]} />);
  expect(screen.getByText("4:30 PM")).toBeTruthy();
  expect(rows()).toEqual(["Expected1.2 kW"]);
  cleanup();
  render(<TodayDetails active payload={[{ payload: { minute: 600, solar: 6, charging: 0, exporting: -3 } }, { payload: { minute: 570, kw: 2.4 } }]} />);
  expect(rows()).toEqual(["Solar6.0 kW", "Into the Powerwalls0.0 kW", "Sent to PG&E3.0 kW", "Expected2.4 kW"]);
});

test("nothing while the pointer is off the chart", () => {
  const { container } = render(<HabitsDetails active={false} payload={[]} />);
  expect(container.textContent).toBe("");
});
