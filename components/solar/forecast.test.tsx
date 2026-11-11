// @vitest-environment jsdom
// The Solar forecast card (solar-forecast spec, mockup A).
import { act, cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

import { ForecastCard, HourDetails } from "@/components/solar/forecast";
import type { ForecastCard as Card } from "@/lib/forecast";

afterEach(cleanup);

const CARD: Card = {
  today: { day: "2026-11-10", soFar: 9.6, expected: 31, code: 0, sky: "forecast" },
  days: [
    { day: "2026-11-11", expected: 33, code: 0 },
    { day: "2026-11-12", expected: 14, code: 45 },
    { day: "2026-11-13", expected: 27, code: 2 },
  ],
  goodDay: 37,
  staleSince: null,
  byHour: null,
};
const card = () => within(screen.getByRole("region", { name: "Solar forecast" }));
const today = () => within(card().getByRole("group", { name: "Today" }));
// How much of its track a bar's fill shows: what its clip leaves uncovered.
const fill = (bar: HTMLElement) => {
  const hidden = Number((bar.firstElementChild as HTMLElement).style.clipPath.match(/^inset\(0(?:px)? ([\d.]+)% 0(?:px)? 0(?:px)? round 4px\)$/)?.[1]);
  return `${Math.round((100 - hidden) * 10) / 10}%`;
};

test("today's expected kWh, its kWh so far as a bar against it, and its sky", () => {
  render(<ForecastCard card={CARD} />);
  expect(today().getByText("31")).toBeTruthy();
  expect(today().getByText("kWh expected")).toBeTruthy();
  expect(fill(today().getByRole("img", { name: "9.6 of about 31 kWh so far" }))).toBe("31%");
  expect(card().getByRole("group", { name: "Today" }).textContent).toContain("9.6 kWh so far");
  expect(today().getAllByText("Sunny").length).toBeGreaterThan(0);
});

test("past the expected kWh today's bar is full", () => {
  render(<ForecastCard card={{ ...CARD, today: { ...CARD.today, soFar: 34.2 } }} />);
  expect(fill(today().getByRole("img", { name: "34.2 of about 31 kWh so far" }))).toBe("100%");
});

test("the next three days, each with its kWh, a bar against the good day and its sky", () => {
  render(<ForecastCard card={CARD} />);
  const days = within(card().getByRole("list", { name: "The next three days" })).getAllByRole("listitem");
  expect(days.map((day) => [day.textContent!.includes("Tomorrow"), day.textContent!.includes("Thursday"), day.textContent!.includes("Friday")])).toEqual([
    [true, false, false], [false, true, false], [false, false, true],
  ]);
  const thursday = within(days[1]);
  expect(thursday.getByText("14")).toBeTruthy();
  expect(thursday.getAllByText("Fog likely").length).toBeGreaterThan(0);
  expect(fill(thursday.getByRole("img", { name: "14 kWh against a good day of 37" }))).toBe("37.8%");
  expect(card().getByText(/Bars run to a good day, 37 kWh, the best of those 30\./)).toBeTruthy();
});

test("an old forecast says when it is from; a fresh one shows no time", () => {
  render(<ForecastCard card={{ ...CARD, staleSince: "2026-11-10T12:15:00Z" }} />);
  expect(card().getByText("Forecast from 4:15 AM")).toBeTruthy();
  cleanup();
  render(<ForecastCard card={CARD} />);
  expect(card().queryByText(/Forecast from/)).toBeNull();
});

test("without a forecast the days give way to a message and today shows only its kWh so far", () => {
  render(<ForecastCard card={{ ...CARD, today: { ...CARD.today, expected: null, code: 45 }, days: null }} />);
  expect(card().getByText("No forecast right now")).toBeTruthy();
  expect(card().queryByRole("list")).toBeNull();
  expect(card().getByRole("group", { name: "Today" }).textContent).toContain("9.6 kWh so far");
  expect(today().queryByText("kWh expected")).toBeNull();
  expect(card().queryByText(/Bars run to/)).toBeNull();
});

test("the days are named from the date the card was worked out for", () => {
  render(<ForecastCard card={{ ...CARD, today: { ...CARD.today, day: "2026-11-11" }, days: [{ day: "2026-11-12", expected: 14, code: 45 }] }} />);
  expect(within(card().getByRole("list", { name: "The next three days" })).getByRole("listitem").textContent).toContain("Tomorrow");
});

test("today's tile shows the sky now while the days ahead keep the forecast's wording", () => {
  render(<ForecastCard card={{ ...CARD, today: { ...CARD.today, code: 45, sky: "now" } }} />);
  expect(today().getByText("Fog now")).toBeTruthy();
  const thursday = within(within(card().getByRole("list", { name: "The next three days" })).getAllByRole("listitem")[1]);
  expect(thursday.getAllByText("Fog likely").length).toBeGreaterThan(0);
});

// November 8, 2026 at 1:40 PM: 7 AM to 4 PM, 7 to 10 AM short of their forecast, 11 AM and noon over it, 2 PM on ahead.
const PST = (hour: number) => new Date(Date.UTC(2026, 10, 10, hour + 8)).toISOString();
const HOURS: [number, number, number | null][] = [
  [7, 0.69, 0.34], [8, 3.16, 1.74], [9, 4.34, 2.47], [10, 5.74, 5.0], [11, 5.26, 5.9],
  [12, 4.57, 5.38], [13, 4.1, 3.1], [14, 3.06, null], [15, 1.59, null], [16, 0.3, null],
];
const BY_HOUR: NonNullable<Card["byHour"]> = {
  hours: HOURS.map(([hour, expected, made]) => ({ start: PST(hour), expected, made })),
  byNow: { made: 23.93, expected: 26.49, at: "2026-11-10T21:40:00Z", over: false },
};
const byHour = () => within(card().getByRole("group", { name: "Today by hour" }));
const parts = (container: HTMLElement, part: string) =>
  [...container.querySelectorAll(`[data-part="${part}"]`)].map((el) => (el as HTMLElement).dataset.hour);

test("today by hour: its legend, made against expected by now, and a column for each hour with a tick only where made beat expected", () => {
  const { container } = render(<ForecastCard card={{ ...CARD, byHour: BY_HOUR }} />);
  expect(byHour().getByText("Made")).toBeTruthy();
  expect(byHour().getByText("Expected")).toBeTruthy();
  expect(card().getByRole("group", { name: "Today by hour" }).textContent).toContain("23.9 kWh made by 1:40 PM, against 26.5 expected by now");
  expect(parts(container, "expected")).toEqual(HOURS.map(([hour]) => PST(hour)));
  expect(parts(container, "made")).toEqual(HOURS.filter(([, , made]) => made !== null).map(([hour]) => PST(hour)));
  expect(parts(container, "tick")).toEqual([PST(11), PST(12)]);
});

test("before the first hour there is no made-against-expected; after the last it reads for the day", () => {
  render(<ForecastCard card={{ ...CARD, byHour: { ...BY_HOUR, byNow: null } }} />);
  expect(card().getByRole("group", { name: "Today by hour" }).textContent).not.toContain("kWh made");
  cleanup();
  render(<ForecastCard card={{ ...CARD, byHour: { ...BY_HOUR, byNow: { made: 31.2, expected: 32.81, at: "2026-11-11T01:30:00Z", over: true } } }} />);
  expect(card().getByRole("group", { name: "Today by hour" }).textContent).toContain("31.2 kWh made today, against 32.8 expected");
});

test("without hourly figures the card has no Today by hour", () => {
  render(<ForecastCard card={CARD} />);
  expect(card().queryByRole("group", { name: "Today by hour" })).toBeNull();
});

const details = (hour: number, expected: number, made: number | null) =>
  render(<HourDetails active payload={[{ payload: { start: PST(hour), expected, made } }]} />).container.textContent;

test("an hour's details: the hour, what it made and what was expected, to one decimal", () => {
  expect(details(9, 4.34, 2.47)).toBe("9–10 AMMade2.5 kWhExpected4.3 kWh");
  cleanup();
  expect(details(11, 5.26, 5.9)).toBe("11 AM–12 PMMade5.9 kWhExpected5.3 kWh");
  cleanup();
  expect(details(12, 4.57, 5.38)).toBe("12–1 PMMade5.4 kWhExpected4.6 kWh");
});

test("an hour not yet started shows only what is expected", () => {
  expect(details(14, 3.06, null)).toBe("2–3 PMExpected3.1 kWh");
});

// site-motion, "The estimate draws before what happened".
test("today's bar: the expected track uncovers at an even pace, then what was made grows into it from halfway", () => {
  vi.useFakeTimers();
  render(<ForecastCard card={CARD} />);
  const bar = today().getByRole("img", { name: "9.6 of about 31 kWh so far" });
  const made = bar.firstElementChild!;
  expect([...bar.classList]).toEqual(expect.arrayContaining(["motion-uncover", "motion-even"]));
  expect([...made.classList]).toEqual(expect.arrayContaining(["motion-uncover", "motion-second", "motion-tween"]));
  act(() => vi.advanceTimersByTime(650));
  expect(bar.classList.contains("motion-uncover")).toBe(false);
  expect(made.classList.contains("motion-uncover")).toBe(false);
  expect(made.classList.contains("motion-tween")).toBe(true);
  vi.useRealTimers();
});

test("today by hour: each hour's expected column rises at an even pace, and its made column from halfway", () => {
  vi.useFakeTimers();
  const { container } = render(<ForecastCard card={{ ...CARD, byHour: BY_HOUR }} />);
  const expected = [...container.querySelectorAll('[data-part="expected"]')] as SVGElement[];
  const made = [...container.querySelectorAll('[data-part="made"]')] as SVGElement[];
  expect(expected.every((path) => path.classList.contains("motion-rise") && path.classList.contains("motion-even"))).toBe(true);
  expect(made.every((path) => path.classList.contains("motion-rise") && path.classList.contains("motion-second"))).toBe(true);
  expect(expected.map((path) => path.style.getPropertyValue("--i"))).toEqual(expected.map((_, i) => String(i)));
  act(() => vi.advanceTimersByTime(650));
  expect(container.querySelectorAll('[data-part].motion-rise')).toHaveLength(0);
  vi.useRealTimers();
});
