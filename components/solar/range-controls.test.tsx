// @vitest-environment jsdom
// The presets and picker of the solar-range-chart spec, driven as a visitor would.
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { RangeControls } from "@/components/solar/range-controls";
import { presets } from "@/lib/solar/ranges";

const october = { start: "2026-10-01", end: "2026-10-31" };

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 10, 7, 12));
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const pressed = (name: string) => screen.getByRole("button", { name }).getAttribute("aria-pressed");
// react-day-picker names each day button by its full date, e.g. "Saturday, October 10th, 2026".
const dayButton = (name: RegExp) => screen.getByRole("button", { name }) as HTMLButtonElement;
const openPicker = () => act(() => fireEvent.click(screen.getByRole("button", { name: /choose dates/i })));

test("each preset sets its range, and the one matching the shown range is marked", () => {
  const onRange = vi.fn();
  render(<RangeControls range={{ start: "2026-11-01", end: "2026-11-30" }} presets={presets("2026-11-07")} onRange={onRange} />);
  expect([pressed("This month"), pressed("This year"), pressed("True-up year")]).toEqual(["true", "false", "false"]);
  fireEvent.click(screen.getByRole("button", { name: "True-up year" }));
  expect(onRange).toHaveBeenCalledWith({ start: "2026-10-01", end: "2027-09-30" });
  fireEvent.click(screen.getByRole("button", { name: "This year" }));
  expect(onRange).toHaveBeenLastCalledWith({ start: "2026-01-01", end: "2026-12-31" });
});

test("a range no preset gives marks none", () => {
  render(<RangeControls range={october} presets={presets("2026-11-07")} onRange={() => {}} />);
  expect([pressed("This month"), pressed("This year"), pressed("True-up year")]).toEqual(["false", "false", "false"]);
});

test("the picker shows the range and sets the two days picked, in either order", () => {
  const onRange = vi.fn();
  render(<RangeControls range={october} presets={presets("2026-11-07")} onRange={onRange} />);
  expect(screen.getByRole("button", { name: /choose dates/i }).textContent).toMatch(/^Oct 1\s–\s31, 2026$/);
  openPicker();
  fireEvent.click(dayButton(/October 20th, 2026/));
  expect(onRange).not.toHaveBeenCalled();
  fireEvent.click(dayButton(/October 10th, 2026/));
  expect(onRange).toHaveBeenCalledWith({ start: "2026-10-10", end: "2026-10-20" });
});

test("the picker offers nothing before the first day of service or after two years from today", () => {
  render(<RangeControls range={{ start: "2021-10-01", end: "2021-10-31" }} presets={presets("2026-11-07")} onRange={() => {}} />);
  openPicker();
  expect(dayButton(/October 9th, 2021/).disabled).toBe(true);
  expect(dayButton(/October 10th, 2021/).disabled).toBe(false);
  cleanup();
  render(<RangeControls range={{ start: "2028-11-01", end: "2028-11-30" }} presets={presets("2026-11-07")} onRange={() => {}} />);
  openPicker();
  expect(dayButton(/November 7th, 2028/).disabled).toBe(false);
  expect(dayButton(/November 8th, 2028/).disabled).toBe(true);
});
