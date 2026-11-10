// @vitest-environment jsdom
// The Solar forecast card (solar-forecast spec, mockup A).
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";

import { ForecastCard } from "@/components/solar/forecast";
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
};
const card = () => within(screen.getByRole("region", { name: "Solar forecast" }));
const today = () => within(card().getByRole("group", { name: "Today" }));
const fill = (bar: HTMLElement) => (bar.firstElementChild as HTMLElement).style.width;

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
