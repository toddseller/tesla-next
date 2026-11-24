// @vitest-environment jsdom
// live-flow-scene, "Today's totals under the scene": fetched by the browser at every width, so the page
// itself still renders from the live status alone.
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { FakeStream } from "@/test/fake-event-source";
import { TodaySoFar } from "./today-so-far";

const TODAY = "2026-11-21";
const TOTALS = { solar_to_home: 9.366, solar_to_powerwall: 0.318, solar_to_grid: 11.007, powerwall_to_home: 0, powerwall_to_grid: 0, grid_to_home: 11.962, grid_to_powerwall: 0.362, solar_to_vehicle: 1.037, powerwall_to_vehicle: 0, grid_to_vehicle: 2.043 };
const DAY = { date: TODAY, vehicle_data: true, totals: TOTALS, data: [] };
const figure = (label: string) => screen.getByText(label).parentElement!.querySelector("b")!.textContent;
const answering = (totals = TOTALS) => vi.fn(async (_url: string) => ({ ok: true, json: async () => ({ ...DAY, totals }) }));

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

test("it fetches today and shows solar generated, the six totals and a link to today on Solar", async () => {
  const fetch = answering();
  vi.stubGlobal("fetch", fetch);
  render(<TodaySoFar />);
  await act(async () => {});
  expect(fetch).toHaveBeenCalledWith(`/api/intervals?date=${TODAY}`);
  expect(screen.getByRole("region", { name: "Today so far" })).toBeTruthy();
  expect(figure("generated")).toBe("21.7 kWh");
  expect(figure("used by the house, without the car")).toBe("21.3 kWh");
  expect(figure("charged into the car")).toBe("3.1 kWh");
  expect(screen.getByRole("link", { name: "Today, hour by hour" }).getAttribute("href")).toBe("/solar?start=2026-11-01&end=2026-11-30&day=2026-11-21");
});

test("at every width, two figures to a row on a phone, four from 640px and seven from 1024px", async () => {
  vi.stubGlobal("fetch", answering());
  render(<TodaySoFar />);
  await act(async () => {});
  const region = screen.getByRole("region", { name: "Today so far" });
  expect(region.className).not.toContain("sm:hidden");
  const grid = screen.getByText("generated").parentElement!.parentElement!;
  expect(grid.className).toContain("grid-cols-2 sm:grid-cols-4 lg:grid-cols-7");
});

test("until today's figures arrive, or if they fail, there's no block", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, json: async () => ({}) })));
  vi.spyOn(console, "error").mockImplementation(() => {});
  const { container } = render(<TodaySoFar />);
  await act(async () => {});
  expect(container.textContent).toBe("");
});

test("a totals event for today, or the stream coming back after a sleep, fetches today again", async () => {
  const fetch = answering();
  vi.stubGlobal("fetch", fetch);
  render(<TodaySoFar />);
  await act(async () => {});
  FakeStream.opened[0].send({ date: "2026-11-20" }, "totals");
  expect(fetch).toHaveBeenCalledTimes(1);
  fetch.mockImplementation(answering({ ...TOTALS, grid_to_home: 12.5 }));
  FakeStream.opened[0].send({ date: TODAY }, "totals");
  await act(async () => {});
  expect(figure("used by the house, without the car")).toBe("21.9 kWh");
  FakeStream.opened[0].fail(false);
  FakeStream.opened[0].connect();
  await act(async () => {});
  expect(fetch).toHaveBeenCalledTimes(3);
});
