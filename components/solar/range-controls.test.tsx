// @vitest-environment jsdom
// The presets and picker of the solar-range-chart spec, driven as a visitor would.
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { PresetGroup, RangeControls } from "@/components/solar/range-controls";
import { presets } from "@/lib/solar/ranges";
import { MARKER_SELECTED } from "@/components/ui/calendar";

const october = { start: "2026-10-01", end: "2026-10-31" };
// No preset has this range's shape, so it is the custom range.
const tenDays = { start: "2026-10-10", end: "2026-10-20" };

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
  render(<RangeControls today="2026-11-07" range={tenDays} presets={presets("2026-11-07")} onRange={() => {}} />);
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

test("the dates button is marked on a range no preset gives, and not on a preset's", () => {
  render(<RangeControls today="2026-11-07" range={tenDays} presets={presets("2026-11-07")} onRange={() => {}} />);
  expect(marked(datesButton())).toBe(true);
  cleanup();
  render(<RangeControls today="2026-11-07" range={{ start: "2026-11-01", end: "2026-11-30" }} presets={presets("2026-11-07")} onRange={() => {}} />);
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
  expect(monthOff(/go to the previous month/i)).toBe(true);
});

test("the picker offers nothing after the site's today, and its months stop at today's", () => {
  render(<RangeControls today="2026-11-07" range={{ start: "2026-11-01", end: "2026-11-30" }} presets={presets("2026-11-07")} onRange={() => {}} />);
  openPicker();
  expect(dayButton(/November 7th, 2026/).disabled).toBe(false);
  expect(dayButton(/November 8th, 2026/).disabled).toBe(true);
  expect(monthOff(/go to the next month/i)).toBe(true);
});

test("the site's today bounds the picker even when the viewer's clock is a day ahead", () => {
  vi.setSystemTime(new Date(2026, 11, 1, 1));
  render(<RangeControls today="2026-11-30" range={{ start: "2026-11-01", end: "2026-11-30" }} presets={presets("2026-11-30")} onRange={() => {}} />);
  openPicker();
  expect(dayButton(/November 30th, 2026/).disabled).toBe(false);
  expect(monthOff(/go to the next month/i)).toBe(true);
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
  // DESIGN.md: red marks a selection, it never fills one; the shared calendar's red fill is overridden here.
  expect(document.querySelector('[data-slot="calendar"]')!.className).toContain(MARKER_SELECTED);
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

// dashboard-shell, "Range presets on a phone": below 640 px the group is one menu; CSS picks which shows.
const phoneButton = (name: string) => screen.getByRole("button", { name: `Preset ranges: ${name}` });

// dashboard-shell, "A range over all the data is All time": a shared or typed address can give All time other dates.
test("a range over all the data marks All time, on the row and in the phone menu, and not the dates button", () => {
  render(<RangeControls today="2026-11-07" range={{ start: "2021-10-01", end: "2026-11-30" }} presets={presets("2026-11-07")} onRange={() => {}} />);
  expect(rowButton("All time").getAttribute("aria-pressed")).toBe("true");
  expect(marked(datesButton())).toBe(false);
  act(() => fireEvent.click(phoneButton("All time")));
  expect(screen.getByRole("menuitemradio", { name: "All time" }).getAttribute("aria-checked")).toBe("true");
});

test("a range a day short of today is still custom", () => {
  render(<RangeControls today="2026-11-07" range={{ start: "2021-10-10", end: "2026-11-06" }} presets={presets("2026-11-07")} onRange={() => {}} />);
  expect(rowButton("All time").getAttribute("aria-pressed")).toBe("false");
  expect(marked(datesButton())).toBe(true);
});

test("on a phone the presets are one menu naming the preset shown, and on a wide screen a row of buttons", () => {
  render(<RangeControls today="2026-11-07" range={{ start: "2026-11-01", end: "2026-11-30" }} presets={presets("2026-11-07")} onRange={() => {}} />);
  expect(screen.getByRole("group", { name: "Preset ranges" }).className).toContain("max-sm:hidden");
  expect(phoneButton("This month").className).toContain("sm:hidden");
  act(() => fireEvent.click(phoneButton("This month")));
  const items = screen.getAllByRole("menuitemradio");
  expect(items.map((item) => [item.textContent, item.getAttribute("aria-checked")])).toEqual([["This month", "true"], ["This year", "false"], ["True-up year", "false"], ["All time", "false"]]);
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
  render(<RangeControls today="2026-11-07" range={tenDays} presets={presets("2026-11-07")} onRange={() => {}} />);
  act(() => fireEvent.click(phoneButton("Custom")));
  expect(screen.getAllByRole("menuitemradio").every((item) => item.getAttribute("aria-checked") === "false")).toBe(true);
});

test("a group's phone menu carries its own name", () => {
  render(<PresetGroup label="Backup years" range={{ start: "2026-10-01", end: "2027-09-30" }} presets={[{ label: "True-up year", range: { start: "2026-10-01", end: "2027-09-30" } }]} onRange={() => {}} />);
  expect(screen.getByRole("button", { name: "Backup years: True-up year" })).not.toBeNull();
});

// dashboard-shell, "Stepping the range", "A stepped preset names its range" and "Steps stay within the data".
const row = () => within(screen.getByRole("group", { name: "Preset ranges" }));
const rowButton = (name: string) => row().getByRole("button", { name }) as HTMLButtonElement;

test("the selected preset holds the step buttons, named for its shape, and stays selected for the range stepped to", () => {
  const onRange = vi.fn();
  render(<RangeControls today="2026-11-23" range={october} presets={presets("2026-11-23")} onRange={onRange} />);
  const lit = rowButton("October 2026");
  expect(lit.getAttribute("aria-pressed")).toBe("true");
  expect([lit.previousElementSibling, lit.nextElementSibling]).toEqual([rowButton("Previous month"), rowButton("Next month")]);
  fireEvent.click(rowButton("Previous month"));
  expect(onRange).toHaveBeenCalledWith({ start: "2026-09-01", end: "2026-09-30" });
  fireEvent.click(rowButton("Next month"));
  expect(onRange).toHaveBeenLastCalledWith({ start: "2026-11-01", end: "2026-11-30" });
  expect(row().queryByRole("button", { name: "Previous year" })).toBeNull();
});

test("a stepped preset reads the range's name, and choosing it brings back its own range", () => {
  const onRange = vi.fn();
  render(<RangeControls today="2026-11-23" range={{ start: "2025-10-01", end: "2026-09-30" }} presets={presets("2026-11-23")} onRange={onRange} />);
  expect(rowButton("2025\u201126").getAttribute("title")).toBe("Back to true-up year");
  fireEvent.click(rowButton("2025\u201126"));
  expect(onRange).toHaveBeenCalledWith({ start: "2026-10-01", end: "2027-09-30" });
  expect(marked(datesButton())).toBe(false);
});

test("a preset on its own range keeps its label", () => {
  render(<RangeControls today="2026-11-23" range={{ start: "2026-11-01", end: "2026-11-30" }} presets={presets("2026-11-23")} onRange={() => {}} />);
  expect(rowButton("This month").getAttribute("aria-pressed")).toBe("true");
  expect(rowButton("This month").getAttribute("title")).toBeNull();
});

test("a range no preset's shape fits selects none, lights the dates button and has no step buttons", () => {
  render(<RangeControls today="2026-11-23" range={{ start: "2026-10-10", end: "2026-10-20" }} presets={presets("2026-11-23")} onRange={() => {}} />);
  expect(marked(datesButton())).toBe(true);
  expect(screen.queryByRole("button", { name: /^(previous|next)/i })).toBeNull();
  cleanup();
  render(<RangeControls today="2026-11-23" range={{ start: "2026-11-22", end: "2026-11-22" }} presets={presets("2026-11-23")} onRange={() => {}} />);
  expect(screen.queryByRole("button", { name: /^previous day/i })).toBeNull();
});

test("next stops at the span holding today, and previous at the first day of service", () => {
  render(<RangeControls today="2026-11-07" range={{ start: "2026-11-01", end: "2026-11-30" }} presets={presets("2026-11-07")} onRange={() => {}} />);
  expect([rowButton("Previous month").disabled, rowButton("Next month").disabled]).toEqual([false, true]);
  cleanup();
  render(<RangeControls today="2026-11-07" range={{ start: "2021-10-01", end: "2021-10-31" }} presets={presets("2026-11-07")} onRange={() => {}} />);
  expect(rowButton("Previous month").disabled).toBe(true);
  cleanup();
  render(<RangeControls today="2026-11-07" range={{ start: "2021-10-01", end: "2022-09-30" }} presets={presets("2026-11-07")} onRange={() => {}} />);
  expect([rowButton("Previous true-up year").disabled, rowButton("Next true-up year").disabled]).toEqual([true, false]);
});

test("on a phone the menu button names the stepped range, with the step buttons either side of it", () => {
  const onRange = vi.fn();
  render(<RangeControls today="2026-11-23" range={october} presets={presets("2026-11-23")} onRange={onRange} />);
  const menu = phoneButton("October 2026");
  const [before, after] = [menu.previousElementSibling as HTMLButtonElement, menu.nextElementSibling as HTMLButtonElement];
  expect([before.getAttribute("aria-label"), after.getAttribute("aria-label")]).toEqual(["Previous month", "Next month"]);
  expect(before.className).toContain("sm:hidden");
  fireEvent.click(before);
  expect(onRange).toHaveBeenCalledWith({ start: "2026-09-01", end: "2026-09-30" });
});

test("a preset group without today selects only an exact range and has no step buttons", () => {
  render(<PresetGroup label="Year" range={{ start: "2025-01-01", end: "2025-12-31" }} presets={[{ label: "2026", range: { start: "2026-01-01", end: "2026-12-31" } }]} onRange={() => {}} />);
  expect(pressed("2026")).toBe("false");
  expect(screen.queryByRole("button", { name: /previous/i })).toBeNull();
});

// dashboard-shell, "Month and year lists in the picker".
test("each month's caption is a month list and a year list, so a year is one choice away", () => {
  wide(false);
  render(<RangeControls today="2026-11-07" range={{ start: "2026-11-01", end: "2026-11-30" }} presets={presets("2026-11-07")} onRange={() => {}} />);
  openPicker();
  const years = screen.getByRole("combobox", { name: /year/i }) as HTMLSelectElement;
  expect([...years.options].map((o) => o.textContent)).toEqual(["2021", "2022", "2023", "2024", "2025", "2026"]);
  act(() => fireEvent.change(years, { target: { value: "2022" } }));
  expect(screen.getByRole("grid").getAttribute("aria-label")).toBe("November 2022");
});

test("the first year's month list offers October to December only", () => {
  wide(false);
  render(<RangeControls today="2026-11-07" range={{ start: "2021-11-01", end: "2021-11-30" }} presets={presets("2026-11-07")} onRange={() => {}} />);
  openPicker();
  const months = screen.getByRole("combobox", { name: /month/i }) as HTMLSelectElement;
  expect([...months.options].filter((o) => !o.disabled).map((o) => o.textContent)).toEqual(["Oct", "Nov", "Dec"]);
});

// impact-report, "Range controls beside the heading": the range presets alone narrow below 1280 px, so a stepped name and
// the readings switch still fit one row at 1024; the readings switch and Top Ten keep the shared padding.
test("the range presets narrow below 1280 px, and other preset groups don't", () => {
  render(<RangeControls today="2026-11-23" range={tenDays} presets={presets("2026-11-23")} onRange={() => {}} />);
  expect(rowButton("This year").className).toContain("max-xl:px-1.5");
  cleanup();
  render(<PresetGroup label="Year" range={{ start: "2025-01-01", end: "2025-12-31" }} presets={[{ label: "2026", range: { start: "2026-01-01", end: "2026-12-31" } }]} onRange={() => {}} />);
  expect(screen.getByRole("button", { name: "2026" }).className).not.toContain("max-xl:px-1.5");
});
