// @vitest-environment jsdom
// The home page's Today chapter (home-story spec: today against the forecast, its totals, the days ahead, staying current).
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import type { ForecastCard } from "@/lib/forecast";
import { FakeStream } from "@/test/fake-event-source";
import { Today } from "./today";

const TODAY = "2026-11-21";
const HOURS = [{ start: "2026-11-21T22:00:00.000Z", expected: 17.64, made: 2 }, { start: "2026-11-21T23:00:00.000Z", expected: 0.4, made: null }];
const CARD: ForecastCard = {
  today: { day: TODAY, soFar: 21.728, expected: 18, code: 3, sky: "now", temperature: 12 },
  days: [
    { day: "2026-11-22", expected: 22, code: 3, byHour: null, high: null, low: null },
    { day: "2026-11-23", expected: 28, code: 3, byHour: null, high: null, low: null },
    { day: "2026-11-24", expected: 17, code: 3, byHour: null, high: null, low: null },
  ],
  goodDay: 41, staleSince: null,
  byHour: { hours: HOURS, byNow: { made: 21.728, expected: 17.819, at: "2026-11-21T23:35:00.000Z", over: false } },
};
// Today's day view totals: the house 21.3 kWh (car apart), 14.4 from the grid, 11.0 sent, the Powerwalls 0.7 in and 0 out.
const TOTALS = { solar_to_home: 9.366, solar_to_powerwall: 0.318, solar_to_grid: 11.007, powerwall_to_home: 0, powerwall_to_grid: 0, grid_to_home: 11.962, grid_to_powerwall: 0.362, solar_to_vehicle: 1.037, powerwall_to_vehicle: 0, grid_to_vehicle: 2.043 };
const DAY = { date: TODAY, vehicle_data: true, totals: TOTALS, data: [] };
const figure = (label: string) => screen.getByText(label).parentElement!.querySelector("b")!.textContent;

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(Date.parse("2026-11-21T23:35:00Z"));
  FakeStream.opened = [];
  vi.stubGlobal("EventSource", FakeStream);
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

test("leads with today's solar so far, then the day's expected, the expected by now and what is still to come", () => {
  render(<Today today={TODAY} forecast={CARD} day={DAY} />);
  expect(screen.getByRole("heading", { name: "Today" })).toBeTruthy();
  expect(figure("made, of 18.0 kWh expected")).toBe("21.7 kWh");
  expect(figure("expected by 3:35 PM")).toBe("17.8 kWh");
  expect(figure("still to come")).toBe("0.2 kWh");
});

test("the day's expected is its hours' sum to a tenth, as still to come is, not the tile's whole kWh", () => {
  render(<Today today={TODAY} forecast={{ ...CARD, today: { ...CARD.today, expected: 8 }, byHour: { hours: [{ start: HOURS[0].start, expected: 7.68, made: null }], byNow: null } }} day={DAY} />);
  expect(figure("made, of 7.7 kWh expected")).toBe("21.7 kWh");
  expect(figure("still to come")).toBe("7.7 kWh");
});

test("without a forecast, today's solar so far alone, and no days ahead", () => {
  render(<Today today={TODAY} forecast={{ ...CARD, today: { ...CARD.today, expected: null }, days: null, byHour: null }} day={DAY} />);
  expect(figure("made")).toBe("21.7 kWh");
  expect(screen.queryByText(/expected by/)).toBeNull();
  expect(screen.getByText("No forecast right now")).toBeTruthy();
});

test("today's six totals are the day view's, the car apart from the house, and the days ahead by name", () => {
  render(<Today today={TODAY} forecast={CARD} day={DAY} />);
  expect(figure("used by the house")).toBe("21.3 kWh");
  expect(figure("charged into the car")).toBe("3.1 kWh");
  expect(figure("from the grid")).toBe("14.4 kWh");
  expect(figure("sent to PG&E")).toBe("11.0 kWh");
  expect(figure("into the Powerwalls")).toBe("0.7 kWh");
  expect(figure("out of the Powerwalls")).toBe("0.0 kWh");
  expect(figure("expected over the next three days")).toBe("Sun 22 kWh · Mon 28 kWh · Tue 17 kWh");
  const days = screen.getByText("expected over the next three days").parentElement!.querySelectorAll('[data-part="day-ahead"]');
  expect([...days].map((day) => [day.textContent, day.className.includes("whitespace-nowrap")])).toEqual([["Sun 22 kWh", true], ["Mon 28 kWh", true], ["Tue 17 kWh", true]]);
  expect(screen.getByRole("link", { name: "Today, hour by hour" }).getAttribute("href")).toBe("/solar?start=2026-11-01&end=2026-11-30&day=2026-11-21");
});

test("a totals event for today reloads the forecast and the day; one for another day reloads nothing", async () => {
  const fetch = vi.fn(async (url: string) => ({
    ok: true,
    json: async () => (url.startsWith("/api/forecast") ? { data: { ...CARD, today: { ...CARD.today, soFar: 22.4 } } } : { ...DAY, totals: { ...TOTALS, grid_to_home: 12.5 } }),
  }));
  vi.stubGlobal("fetch", fetch);
  render(<Today today={TODAY} forecast={CARD} day={DAY} />);
  FakeStream.opened[0].send({ date: "2026-11-20" }, "totals");
  expect(fetch).not.toHaveBeenCalled();
  FakeStream.opened[0].send({ date: TODAY }, "totals");
  await act(async () => {});
  expect(fetch.mock.calls.map(([url]) => url).sort()).toEqual(["/api/forecast", `/api/intervals?date=${TODAY}`]);
  expect(figure("made, of 18.0 kWh expected")).toBe("22.4 kWh");
  expect(figure("used by the house")).toBe("21.9 kWh");
});

test("a failed reload keeps the figures and says when they are from, until one succeeds", async () => {
  let ok = false;
  vi.stubGlobal("fetch", vi.fn(async (url: string) => ({ ok, json: async () => (url.startsWith("/api/forecast") ? { data: CARD } : DAY) })));
  vi.spyOn(console, "error").mockImplementation(() => {});
  render(<Today today={TODAY} forecast={CARD} day={DAY} />);
  FakeStream.opened[0].send({ date: TODAY }, "totals");
  await act(async () => {});
  expect(figure("made, of 18.0 kWh expected")).toBe("21.7 kWh");
  expect(screen.getByText("as of 3:35 PM")).toBeTruthy();
  ok = true;
  FakeStream.opened[0].send({ date: TODAY }, "totals");
  await act(async () => {});
  expect(screen.queryByText("as of 3:35 PM")).toBeNull();
});

test("a tab left open past midnight follows the new day's totals, not the day it was served", async () => {
  const fetch = vi.fn(async (url: string) => ({ ok: true, json: async () => (url.startsWith("/api/forecast") ? { data: CARD } : { ...DAY, date: "2026-11-22" }) }));
  vi.stubGlobal("fetch", fetch);
  render(<Today today={TODAY} forecast={CARD} day={DAY} />);
  vi.setSystemTime(Date.parse("2026-11-22T08:30:00Z"));
  FakeStream.opened[0].send({ date: TODAY }, "totals");
  expect(fetch).not.toHaveBeenCalled();
  FakeStream.opened[0].send({ date: "2026-11-22" }, "totals");
  await act(async () => {});
  expect(fetch.mock.calls.map(([url]) => url).sort()).toEqual(["/api/forecast", "/api/intervals?date=2026-11-22"]);
  expect(screen.getByRole("link", { name: "Today, hour by hour" }).getAttribute("href")).toBe("/solar?start=2026-11-01&end=2026-11-30&day=2026-11-22");
});

test("without an hourly forecast, a failed reload still says when the figures are from", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, json: async () => ({}) })));
  vi.spyOn(console, "error").mockImplementation(() => {});
  render(<Today today={TODAY} forecast={{ ...CARD, byHour: null }} day={DAY} />);
  FakeStream.opened[0].send({ date: TODAY }, "totals");
  await act(async () => {});
  expect(screen.getByText("as of 3:35 PM")).toBeTruthy();
});
