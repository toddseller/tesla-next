// @vitest-environment jsdom
// The home page's year chapter (home-story spec: the year's solar by day and hour, a day from the year, stepping through
// the year's days, the year switcher, a year that is slow or fails, the year's shares).
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { Year } from "./year";

const TODAY = "2026-11-21";
const hours = (kwh: number) => Array.from({ length: 24 }, (_, h) => (h === 12 ? kwh : 0));
const DAYS = [
  { day: "2026-06-13", kwh: hours(45.9) },
  { day: "2026-06-14", kwh: hours(65.6) },
  { day: "2026-06-28", kwh: hours(78.5) },
  { day: TODAY, kwh: hours(21.7) },
];
const SHARES = { from_solar_percentage: 39, from_powerwall_percentage: 30, from_grid_percentage: 31, total_solar: 13535.2 };
const year = () => render(<Year year={2026} today={TODAY} days={DAYS} shares={SHARES} />);
const readout = () => document.querySelector<HTMLElement>('[data-part="day-readout"]')!.textContent;
// The readout joins its figure and unit with a no-break space; the other tests read it as a plain one.
const plain = () => readout()!.replace("\u00a0", " ");
const chart = () => screen.getByRole("slider", { name: /solar by day and hour/ });

beforeEach(() => {
  vi.spyOn(window.history, "replaceState").mockImplementation(() => {});
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

test("the chart's summary, a label for each month, today's row marked, and the year's shares linking to Impact", () => {
  year();
  expect(chart().getAttribute("aria-label")).toBe("2026 solar by day and hour: 211.7 kWh so far, the best day June 28 at 78.5 kWh.");
  expect([...document.querySelectorAll('[data-part="month"]')].map((m) => m.textContent)).toEqual(["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]);
  expect(document.querySelector('[data-part="today-row"]')).not.toBeNull();
  expect(screen.getByText("39%")).toBeTruthy();
  expect(screen.getByRole("link", { name: "The year on Impact" }).getAttribute("href")).toBe("/impact?start=2026-01-01&end=2026-12-31");
});

test("the readout starts on today and steps a day with its buttons and the keyboard, linking to the day", () => {
  year();
  expect(plain()).toBe("November 21, 2026 · 21.7 kWh");
  fireEvent.keyDown(chart(), { key: "Home" });
  expect(plain()).toBe("June 13, 2026 · 45.9 kWh");
  fireEvent.keyDown(chart(), { key: "End" });
  expect(plain()).toBe("November 21, 2026 · 21.7 kWh");
  for (let i = 0; i < 160; i++) fireEvent.click(screen.getByRole("button", { name: "Previous day" }));
  expect(plain()).toBe("June 14, 2026 · 65.6 kWh");
  fireEvent.keyDown(chart(), { key: "ArrowUp" });
  expect(plain()).toBe("June 13, 2026 · 45.9 kWh");
  fireEvent.click(screen.getByRole("button", { name: "Next day" }));
  expect(screen.getByRole("link", { name: "Open the day" }).getAttribute("href")).toBe("/solar?start=2026-06-01&end=2026-06-30&day=2026-06-14");
});

test("pointing or dragging down the chart shows the day under it", () => {
  year();
  vi.spyOn(chart(), "getBoundingClientRect").mockReturnValue({ top: 100, height: 365, left: 0, width: 300, bottom: 465, right: 300, x: 0, y: 100, toJSON: () => ({}) });
  fireEvent.pointerDown(chart(), { clientY: 100 + 164.5 });
  expect(plain()).toBe("June 14, 2026 · 65.6 kWh");
  fireEvent.pointerMove(chart(), { clientY: 100 + 178.5, buttons: 1 });
  expect(plain()).toBe("June 28, 2026 · 78.5 kWh");
  fireEvent.pointerMove(chart(), { clientY: 100 + 164.5 });
  expect(plain()).toBe("June 14, 2026 · 65.6 kWh");
});

test("choosing two years quickly ends on the second, whichever answers last", async () => {
  const answers = new Map<string, (value: unknown) => void>();
  vi.stubGlobal("fetch", vi.fn((url: string) => (url.startsWith("/api/solar-hours")
    ? new Promise((resolve) => answers.set(url, resolve))
    : Promise.resolve({ ok: true, json: async () => ({ data: SHARES }) }))));
  year();
  const pick = (y: string) => fireEvent.click(within(screen.getAllByRole("group", { name: "Year" })[0]).getByRole("button", { name: y }));
  pick("2023");
  pick("2024");
  const answer = (y: number, kwh: number) => answers.get(`/api/solar-hours?year=${y}`)!({ ok: true, json: async () => ({ data: [{ day: `${y}-06-20`, kwh: hours(kwh) }] }) });
  await act(async () => answer(2024, 70));
  await act(async () => answer(2023, 80.1));
  expect(chart().getAttribute("aria-label")).toMatch(/^2024/);
  expect(window.history.replaceState).toHaveBeenLastCalledWith(null, "", "/?year=2024");
  expect(screen.queryByText(/Loading/)).toBeNull();
});

test("choosing a year loads it without a reload, keeping the address and adding no history", async () => {
  let answer!: (value: unknown) => void;
  const fetch = vi.fn((url: string) => (url.startsWith("/api/solar-hours") ? new Promise((resolve) => (answer = resolve)) : Promise.resolve({ ok: true, json: async () => ({ data: { ...SHARES, from_solar_percentage: 41 } }) })));
  vi.stubGlobal("fetch", fetch);
  year();
  fireEvent.click(within(screen.getAllByRole("group", { name: "Year" })[0]).getByRole("button", { name: "2023" }));
  expect(screen.getByText("Loading 2023…")).toBeTruthy();
  expect(chart().getAttribute("aria-label")).toMatch(/^2026/);
  await act(async () => answer({ ok: true, json: async () => ({ data: [{ day: "2023-06-20", kwh: hours(80.1) }] }) }));
  expect(fetch.mock.calls.map(([url]) => url).sort()).toEqual(["/api/impact?start_date=2023-01-01&end_date=2023-12-31", "/api/solar-hours?year=2023"]);
  expect(chart().getAttribute("aria-label")).toBe("2023 solar by day and hour: 80.1 kWh, the best day June 20 at 80.1 kWh.");
  expect(screen.getByText("41%")).toBeTruthy();
  expect(window.history.replaceState).toHaveBeenCalledWith(null, "", "/?year=2023");
  expect(screen.queryByText("Loading 2023…")).toBeNull();
});

test("a year that fails to load says so, offers to try again, and keeps the year shown", async () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  const fetch = vi.fn(async (_url: string) => ({ ok: false, json: async () => ({}) }));
  vi.stubGlobal("fetch", fetch);
  year();
  fireEvent.click(within(screen.getAllByRole("group", { name: "Year" })[0]).getByRole("button", { name: "2023" }));
  await act(async () => {});
  expect(screen.getByText("Couldn't load 2023.")).toBeTruthy();
  expect(chart().getAttribute("aria-label")).toMatch(/^2026/);
  expect(within(screen.getAllByRole("group", { name: "Year" })[0]).getByRole("button", { name: "2026" }).getAttribute("aria-pressed")).toBe("true");
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  await act(async () => {});
  expect(fetch.mock.calls.filter(([url]) => String(url).startsWith("/api/solar-hours"))).toHaveLength(2);
});

test("on a phone the chart is capped at half the screen's height, so a swipe elsewhere scrolls the page", () => {
  year();
  expect(chart().querySelector("canvas")!.className).toContain("max-sm:max-h-[50svh]");
});

test("beside the chart, the readout's column stays in view while the chart scrolls", () => {
  year();
  // The readout sits in its row, in its card, in the column beside the chart.
  const column = document.querySelector('[data-part="day-readout"]')!.parentElement!.parentElement!.parentElement!;
  expect(column.className.split(" ")).toEqual(expect.arrayContaining(["md:sticky", "md:top-6", "md:self-start"]));
});

test("the readout's figure never wraps away from its unit", () => {
  year();
  expect(readout()).toContain("21.7 kWh");
});

test("the shares say the house's energy here includes the car", () => {
  year();
  expect(screen.getByText("Where the house's energy came from in 2026, car included")).toBeTruthy();
});

// DESIGN.md's type scale: the readout is a Lede, 15px, not a one-off 17px.
test("the day readout is set at the 15px Lede", () => {
  year();
  expect(document.querySelector('[data-part="day-readout"]')!.className).toContain("text-[15px]");
});

// Comparing a time of year across years is the point of switching, so the readout keeps its date.
const switchTo = async (y: number, days: string[]) => {
  vi.stubGlobal("fetch", vi.fn(async (url: string) => ({ ok: true, json: async () => ({ data: url.startsWith("/api/solar-hours") ? days.map((day) => ({ day, kwh: hours(30) })) : SHARES }) })));
  fireEvent.click(within(screen.getAllByRole("group", { name: "Year" })[0]).getByRole("button", { name: String(y) }));
  await act(async () => {});
};

test("another year opens on the same date", async () => {
  year();
  expect(plain()).toBe("November 21, 2026 · 21.7 kWh");
  await switchTo(2024, ["2024-06-13", "2024-11-21", "2024-12-31"]);
  expect(plain()).toBe("November 21, 2024 · 30.0 kWh");
});

test("a date before the figures begin opens on the first day with figures", async () => {
  year();
  fireEvent.keyDown(chart(), { key: "Home" });
  expect(plain()).toBe("June 13, 2026 · 45.9 kWh");
  await switchTo(2021, ["2021-10-22", "2021-12-31"]);
  expect(plain()).toBe("October 22, 2021 · 30.0 kWh");
});

test("choosing a year keeps the address's other parameters", async () => {
  window.history.pushState(null, "", "/?record=outage");
  year();
  await switchTo(2023, ["2023-06-20"]);
  expect(window.history.replaceState).toHaveBeenLastCalledWith(null, "", "/?record=outage&year=2023");
  window.history.pushState(null, "", "/");
});

// A reloaded or shared `/?year=2024` opens where switching would have: today's date in that year.
test("a served past year opens on today's date in that year", () => {
  render(<Year year={2024} today={TODAY} days={[{ day: "2024-06-13", kwh: hours(40) }, { day: "2024-11-21", kwh: hours(30) }, { day: "2024-12-31", kwh: hours(20) }]} shares={SHARES} />);
  expect(plain()).toBe("November 21, 2024 · 30.0 kWh");
});

test("a day moved while the new year loads is the one kept", async () => {
  let answer!: (value: unknown) => void;
  vi.stubGlobal("fetch", vi.fn((url: string) => (url.startsWith("/api/solar-hours") ? new Promise((resolve) => (answer = resolve)) : Promise.resolve({ ok: true, json: async () => ({ data: SHARES }) }))));
  year();
  fireEvent.click(within(screen.getAllByRole("group", { name: "Year" })[0]).getByRole("button", { name: "2024" }));
  fireEvent.keyDown(chart(), { key: "Home" });
  await act(async () => answer({ ok: true, json: async () => ({ data: ["2024-06-13", "2024-11-21"].map((day) => ({ day, kwh: hours(30) })) }) }));
  expect(plain()).toBe("June 13, 2024 · 30.0 kWh");
});

test("February 29 opens February 28 in a year without one", async () => {
  render(<Year year={2024} today={TODAY} days={[{ day: "2024-02-29", kwh: hours(20) }]} shares={SHARES} />);
  expect(plain()).toMatch(/^February 29, 2024/);
  await switchTo(2025, ["2025-02-28", "2025-03-01"]);
  expect(plain()).toBe("February 28, 2025 · 30.0 kWh");
});

test("coming back to this year opens today, as the page does, even before today has figures", async () => {
  render(<Year year={2024} today={TODAY} days={[{ day: "2024-12-01", kwh: hours(20) }]} shares={SHARES} />);
  await switchTo(2026, ["2026-11-20"]);
  expect(plain()).toMatch(/^November 21, 2026/);
});
