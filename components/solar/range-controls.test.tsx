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

// The True-Up Tracker's year picker: older years in an Earlier menu, before the last preset.
const year = (end: number) => ({ label: `'${String(end - 1).slice(2)} - '${String(end).slice(2)}`, range: { start: `${end - 1}-10-01`, end: `${end}-09-30` } });
const yearPresets = [{ label: "This year", range: year(2027).range }, year(2026), year(2025), { label: "All time", range: { start: "2021-10-01", end: "2027-09-30" } }];
const earlier = [year(2024), year(2023), year(2022)];
const earlierButton = () => screen.getByRole("button", { name: /earlier|'2\d - '2\d/i, expanded: false });

test("the Earlier menu sits before the last preset and lists the older years in order", () => {
  render(<RangeControls range={year(2027).range} presets={yearPresets} earlier={earlier} onRange={() => {}} />);
  const group = screen.getByRole("group", { name: "Preset ranges" });
  expect([...group.querySelectorAll("button")].map((b) => b.textContent)).toEqual(["This year", "'25 - '26", "'24 - '25", "Earlier", "All time"]);
  expect(earlierButton().getAttribute("aria-pressed")).toBe("false");
  act(() => fireEvent.click(earlierButton()));
  expect(screen.getAllByRole("menuitemradio").map((item) => item.textContent)).toEqual(["'23 - '24", "'22 - '23", "'21 - '22"]);
});

test("picking an earlier year sets its range and closes the menu", () => {
  const onRange = vi.fn();
  render(<RangeControls range={year(2027).range} presets={yearPresets} earlier={earlier} onRange={onRange} />);
  act(() => fireEvent.click(earlierButton()));
  act(() => fireEvent.click(screen.getByRole("menuitemradio", { name: "'22 - '23" })));
  expect(onRange).toHaveBeenCalledWith({ start: "2022-10-01", end: "2023-09-30" });
  expect(screen.queryByRole("menu")).toBeNull();
});

test("an earlier year that holds the shown range names the button, which is marked", () => {
  render(<RangeControls range={year(2023).range} presets={yearPresets} earlier={earlier} onRange={() => {}} />);
  expect(earlierButton().textContent).toBe("'22 - '23");
  expect(earlierButton().getAttribute("aria-pressed")).toBe("true");
  act(() => fireEvent.click(earlierButton()));
  expect(screen.getByRole("menuitemradio", { name: "'22 - '23" }).getAttribute("aria-checked")).toBe("true");
  expect(screen.getByRole("menuitemradio", { name: "'21 - '22" }).getAttribute("aria-checked")).toBe("false");
});

test("without earlier years there is no menu", () => {
  render(<RangeControls range={october} presets={presets("2026-11-07")} onRange={() => {}} />);
  expect(screen.queryByRole("button", { name: /earlier/i })).toBeNull();
});
