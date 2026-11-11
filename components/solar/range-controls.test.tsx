// @vitest-environment jsdom
// The presets and picker of the solar-range-chart spec, driven as a visitor would.
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { PresetGroup, RangeControls } from "@/components/solar/range-controls";
import { presets } from "@/lib/solar/ranges";

const october = { start: "2026-10-01", end: "2026-10-31" };

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 10, 7, 12));
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const pressed = (name: string) => screen.getByRole("button", { name }).getAttribute("aria-pressed");
// react-day-picker names each day button by its full date, e.g. "Saturday, October 10th, 2026".
const dayButton = (name: RegExp) => screen.getByRole("button", { name }) as HTMLButtonElement;
const openPicker = () => act(() => fireEvent.click(screen.getByRole("button", { name: /choose dates/i })));

test("each preset sets its range, and the one matching the shown range is marked", () => {
  const onRange = vi.fn();
  render(<RangeControls today="2026-11-07" range={{ start: "2026-11-01", end: "2026-11-30" }} presets={presets("2026-11-07")} onRange={onRange} />);
  expect([pressed("This month"), pressed("This year"), pressed("True-up year")]).toEqual(["true", "false", "false"]);
  fireEvent.click(screen.getByRole("button", { name: "True-up year" }));
  expect(onRange).toHaveBeenCalledWith({ start: "2026-10-01", end: "2027-09-30" });
  fireEvent.click(screen.getByRole("button", { name: "This year" }));
  expect(onRange).toHaveBeenLastCalledWith({ start: "2026-01-01", end: "2026-12-31" });
});

test("a range no preset gives marks none", () => {
  render(<RangeControls today="2026-11-07" range={october} presets={presets("2026-11-07")} onRange={() => {}} />);
  expect([pressed("This month"), pressed("This year"), pressed("True-up year")]).toEqual(["false", "false", "false"]);
});

// dashboard-shell, "The dates button": an icon whose name and tooltip carry the dates, marked like a preset on a custom range.
const datesButton = () => screen.getByRole("button", { name: /choose dates/i });
const marked = (button: HTMLElement) => button.className.includes("shadow-[inset_0_-2px_0_var(--primary)]");

test("the dates button is an icon named and titled with the shown dates", () => {
  render(<RangeControls today="2026-11-07" range={october} presets={presets("2026-11-07")} onRange={() => {}} />);
  expect(datesButton().textContent).toBe("");
  expect(datesButton().getAttribute("aria-label")).toBe("Choose dates, Oct 1 – 31, 2026");
  expect(datesButton().getAttribute("title")).toBe("Choose dates, Oct 1 – 31, 2026");
});

test("the dates button is marked on a range no preset gives, and not on a preset's or an earlier year's", () => {
  render(<RangeControls today="2026-11-07" range={october} presets={presets("2026-11-07")} onRange={() => {}} />);
  expect(marked(datesButton())).toBe(true);
  cleanup();
  render(<RangeControls today="2026-11-07" range={{ start: "2026-11-01", end: "2026-11-30" }} presets={presets("2026-11-07")} onRange={() => {}} />);
  expect(marked(datesButton())).toBe(false);
  cleanup();
  render(<RangeControls today="2026-11-07" range={year(2023).range} presets={yearPresets} earlier={earlier} onRange={() => {}} />);
  expect(marked(datesButton())).toBe(false);
});

test("the picker shows the range and sets the two days picked, in either order", () => {
  const onRange = vi.fn();
  render(<RangeControls today="2026-11-07" range={october} presets={presets("2026-11-07")} onRange={onRange} />);
  openPicker();
  fireEvent.click(dayButton(/October 20th, 2026/));
  expect(onRange).not.toHaveBeenCalled();
  fireEvent.click(dayButton(/October 10th, 2026/));
  expect(onRange).toHaveBeenCalledWith({ start: "2026-10-10", end: "2026-10-20" });
});

// react-day-picker leaves a month arrow with nowhere to go focusable but aria-disabled.
const monthOff = (name: RegExp) => screen.getByRole("button", { name }).getAttribute("aria-disabled") === "true";

test("the picker offers nothing before the first day of service, and its months stop at October 2021", () => {
  render(<RangeControls today="2026-11-07" range={{ start: "2021-10-01", end: "2021-10-31" }} presets={presets("2026-11-07")} onRange={() => {}} />);
  openPicker();
  expect(dayButton(/October 9th, 2021/).disabled).toBe(true);
  expect(dayButton(/October 10th, 2021/).disabled).toBe(false);
  expect(monthOff(/previous month/i)).toBe(true);
});

test("the picker offers nothing after the site's today, and its months stop at today's", () => {
  render(<RangeControls today="2026-11-07" range={{ start: "2026-11-01", end: "2026-11-30" }} presets={presets("2026-11-07")} onRange={() => {}} />);
  openPicker();
  expect(dayButton(/November 7th, 2026/).disabled).toBe(false);
  expect(dayButton(/November 8th, 2026/).disabled).toBe(true);
  expect(monthOff(/next month/i)).toBe(true);
});

test("the site's today bounds the picker even when the viewer's clock is a day ahead", () => {
  vi.setSystemTime(new Date(2026, 11, 1, 1));
  render(<RangeControls today="2026-11-30" range={{ start: "2026-11-01", end: "2026-11-30" }} presets={presets("2026-11-30")} onRange={() => {}} />);
  openPicker();
  expect(dayButton(/November 30th, 2026/).disabled).toBe(false);
  expect(monthOff(/next month/i)).toBe(true);
  expect(screen.getAllByRole("gridcell").filter((cell) => cell.dataset.today).map((cell) => cell.dataset.day)).toEqual(["2026-11-30"]);
});

// solar-range-chart, "The picker's months": two from 640 px, one below, the range's end month last.
const wide = (matches: boolean) => vi.stubGlobal("matchMedia", (media: string) => ({ matches, media, addEventListener() {}, removeEventListener() {} }));
const shownMonths = (range: { start: string; end: string }, today = "2026-11-11") => {
  render(<RangeControls today={today} range={range} presets={presets(today)} onRange={() => {}} />);
  openPicker();
  const months = screen.getAllByRole("grid").map((grid) => grid.getAttribute("aria-label"));
  cleanup();
  return months;
};

test("from 640 px the picker opens on two months, the range's end month last and none past today's", () => {
  wide(true);
  expect(shownMonths(october)).toEqual(["September 2026", "October 2026"]);
  expect(shownMonths({ start: "2021-10-01", end: "2026-11-11" })).toEqual(["October 2026", "November 2026"]);
  expect(shownMonths({ start: "2026-01-01", end: "2026-12-31" })).toEqual(["October 2026", "November 2026"]);
  expect(shownMonths({ start: "2021-10-10", end: "2021-10-20" })).toEqual(["October 2021", "November 2021"]);
});

test("below 640 px, or without matchMedia, the picker opens on the range's end month alone", () => {
  const septemberToOctober = { start: "2026-09-15", end: "2026-10-20" };
  wide(false);
  expect(shownMonths(septemberToOctober)).toEqual(["October 2026"]);
  vi.unstubAllGlobals();
  vi.stubGlobal("matchMedia", undefined);
  expect(shownMonths(septemberToOctober)).toEqual(["October 2026"]);
});

test("the picker says which day to pick, and starts over when opened again", () => {
  render(<RangeControls today="2026-11-07" range={october} presets={presets("2026-11-07")} onRange={() => {}} />);
  openPicker();
  expect(screen.getByText("Pick a start day").getAttribute("aria-live")).toBe("polite");
  fireEvent.click(dayButton(/October 10th, 2026/));
  expect(screen.getByText("Pick an end day")).toBeTruthy();
  const selected = screen.getAllByRole("gridcell").filter((cell) => cell.dataset.selected).map((cell) => cell.dataset.day);
  expect(selected).toEqual(["2026-10-10"]);
  openPicker();
  openPicker();
  expect(screen.getByText("Pick a start day")).toBeTruthy();
});

// Days after today keep a range's fill with muted dates; outside a range they fade as other disabled days do.
const dayCell = (name: RegExp) => dayButton(name).closest("td")!;

test("a day after today inside the range keeps its fill, and one outside it fades", () => {
  wide(true);
  render(<RangeControls today="2026-11-11" range={{ start: "2026-01-01", end: "2026-12-31" }} presets={presets("2026-11-11")} onRange={() => {}} />);
  openPicker();
  const inside = dayCell(/November 12th, 2026/);
  expect(inside.dataset.selected).toBe("true");
  expect(inside.className).toContain("data-[selected=true]:opacity-100");
  // shadcn's Button fades a disabled button on its own, so the button needs lifting too.
  expect(inside.className).toContain("data-[selected=true]:[&>button]:opacity-100!");
  expect(inside.className).toContain("[&>button]:text-muted-foreground/70!");
  cleanup();
  render(<RangeControls today="2026-11-11" range={{ start: "2026-11-01", end: "2026-11-10" }} presets={presets("2026-11-11")} onRange={() => {}} />);
  openPicker();
  const outside = dayCell(/November 12th, 2026/);
  expect(outside.dataset.selected).toBeUndefined();
  expect(outside.className).toContain("opacity-50");
});

// The True-Up Tracker's year picker: older years in an Earlier menu, before the last preset.
const year = (end: number) => ({ label: `'${String(end - 1).slice(2)} - '${String(end).slice(2)}`, range: { start: `${end - 1}-10-01`, end: `${end}-09-30` } });
const yearPresets = [{ label: "This year", range: year(2027).range }, year(2026), year(2025), { label: "All time", range: { start: "2021-10-01", end: "2027-09-30" } }];
const earlier = [year(2024), year(2023), year(2022)];
const earlierButton = () => screen.getByRole("button", { name: /^(earlier|'2\d - '2\d)$/i, expanded: false });

test("the Earlier menu sits before the last preset and lists the older years in order", () => {
  render(<RangeControls today="2026-11-07" range={year(2027).range} presets={yearPresets} earlier={earlier} onRange={() => {}} />);
  const group = screen.getByRole("group", { name: "Preset ranges" });
  expect([...group.querySelectorAll("button")].map((b) => b.textContent)).toEqual(["This year", "'25 - '26", "'24 - '25", "Earlier", "All time"]);
  expect(earlierButton().getAttribute("aria-pressed")).toBe("false");
  act(() => fireEvent.click(earlierButton()));
  expect(screen.getAllByRole("menuitemradio").map((item) => item.textContent)).toEqual(["'23 - '24", "'22 - '23", "'21 - '22"]);
});

test("picking an earlier year sets its range and closes the menu", () => {
  const onRange = vi.fn();
  render(<RangeControls today="2026-11-07" range={year(2027).range} presets={yearPresets} earlier={earlier} onRange={onRange} />);
  act(() => fireEvent.click(earlierButton()));
  act(() => fireEvent.click(screen.getByRole("menuitemradio", { name: "'22 - '23" })));
  expect(onRange).toHaveBeenCalledWith({ start: "2022-10-01", end: "2023-09-30" });
  expect(screen.queryByRole("menu")).toBeNull();
});

test("an earlier year that holds the shown range names the button, which is marked", () => {
  render(<RangeControls today="2026-11-07" range={year(2023).range} presets={yearPresets} earlier={earlier} onRange={() => {}} />);
  expect(earlierButton().textContent).toBe("'22 - '23");
  expect(earlierButton().getAttribute("aria-pressed")).toBe("true");
  act(() => fireEvent.click(earlierButton()));
  expect(screen.getByRole("menuitemradio", { name: "'22 - '23" }).getAttribute("aria-checked")).toBe("true");
  expect(screen.getByRole("menuitemradio", { name: "'21 - '22" }).getAttribute("aria-checked")).toBe("false");
});

test("without earlier years there is no menu", () => {
  render(<RangeControls today="2026-11-07" range={october} presets={presets("2026-11-07")} onRange={() => {}} />);
  expect(screen.queryByRole("button", { name: /earlier/i })).toBeNull();
});

// dashboard-shell, "Range presets on a phone": below 640 px the group is one menu; CSS picks which shows.
const phoneButton = (name: string) => screen.getByRole("button", { name: `Preset ranges: ${name}` });

test("on a phone the presets are one menu naming the preset shown, and on a wide screen a row of buttons", () => {
  render(<RangeControls today="2026-11-07" range={{ start: "2026-11-01", end: "2026-11-30" }} presets={presets("2026-11-07")} onRange={() => {}} />);
  expect(screen.getByRole("group", { name: "Preset ranges" }).className).toContain("max-sm:hidden");
  expect(phoneButton("This month").className).toContain("sm:hidden");
  act(() => fireEvent.click(phoneButton("This month")));
  const items = screen.getAllByRole("menuitemradio");
  expect(items.map((item) => [item.textContent, item.getAttribute("aria-checked")])).toEqual([["This month", "true"], ["This year", "false"], ["True-up year", "false"]]);
});

test("choosing from the phone menu sets the range and closes it", () => {
  const onRange = vi.fn();
  render(<RangeControls today="2026-11-07" range={{ start: "2026-11-01", end: "2026-11-30" }} presets={presets("2026-11-07")} onRange={onRange} />);
  act(() => fireEvent.click(phoneButton("This month")));
  act(() => fireEvent.click(screen.getByRole("menuitemradio", { name: "This year" })));
  expect(onRange).toHaveBeenCalledWith({ start: "2026-01-01", end: "2026-12-31" });
  expect(screen.queryByRole("menu")).toBeNull();
});

test("a range no preset gives names the phone menu Custom, with nothing checked", () => {
  render(<RangeControls today="2026-11-07" range={october} presets={presets("2026-11-07")} onRange={() => {}} />);
  act(() => fireEvent.click(phoneButton("Custom")));
  expect(screen.getAllByRole("menuitemradio").every((item) => item.getAttribute("aria-checked") === "false")).toBe(true);
});

test("on a phone the earlier years join the menu before All time", () => {
  render(<RangeControls today="2026-11-07" range={year(2023).range} presets={yearPresets} earlier={earlier} onRange={() => {}} />);
  act(() => fireEvent.click(phoneButton("'22 - '23")));
  expect(screen.getAllByRole("menuitemradio").map((item) => item.textContent)).toEqual(["This year", "'25 - '26", "'24 - '25", "'23 - '24", "'22 - '23", "'21 - '22", "All time"]);
});

test("the Backup group's phone menu carries its own name", () => {
  render(<PresetGroup label="Backup years" range={year(2027).range} presets={yearPresets} earlier={earlier} onRange={() => {}} />);
  expect(screen.getByRole("button", { name: "Backup years: This year" })).not.toBeNull();
});
