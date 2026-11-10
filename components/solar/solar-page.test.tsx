// @vitest-environment jsdom
// The Solar page in the browser: its address changes and staying current, from the solar-range-chart spec.
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { SolarPage } from "@/components/solar/solar-page";
import type { ForecastCard } from "@/lib/forecast";
import type { RangeItem } from "@/lib/range";
import { FakeStream } from "@/test/fake-event-source";

const router = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));

const november = { start: "2026-11-01", end: "2026-11-30" };
const march = { start: "2026-03-01", end: "2026-03-31" };
const item = (day: string, solar: number): RangeItem => ({ date: `Nov ${Number(day.slice(8))}`, day, solar, grid: 1, house: 2 });

let fetches: string[];
let answers: (() => Promise<Response | { ok: boolean; json: () => unknown }>)[];

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(Date.parse("2026-11-07T20:00:00Z"));
  FakeStream.opened = [];
  vi.stubGlobal("EventSource", FakeStream);
  fetches = [];
  answers = [];
  vi.stubGlobal("fetch", (url: string) => {
    fetches.push(url);
    return answers.shift()?.() ?? Promise.resolve({ ok: true, json: () => ({ data: [item("2026-11-07", 30.5)] }) });
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
  router.push.mockReset();
});

const solarOf = (container: HTMLElement, label: string) => container.querySelector(`[data-series="solar"][data-label="${label}"]`);
// The fetch, its JSON and the state update each take a turn.
const settle = () => act(() => new Promise((resolve) => setTimeout(resolve, 0)));

test("a preset and a picked day each push their address", () => {
  const { container } = render(<SolarPage range={november} items={[item("2026-11-07", 12.1)]} today="2026-11-07" initialStatus={null} />);
  fireEvent.click(screen.getByRole("button", { name: "This year" }));
  expect(router.push).toHaveBeenCalledWith("/?start=2026-01-01&end=2026-12-31");
  fireEvent.click(solarOf(container, "Nov 7")!);
  expect(router.push).toHaveBeenLastCalledWith("/?start=2026-11-01&end=2026-11-30&day=2026-11-07");
});

test("a month bar of a long range pushes that month, and the subtitle says a month can be selected", () => {
  const trueUpYear = { start: "2026-10-01", end: "2027-09-30" };
  const months: RangeItem[] = [{ date: "Oct-26", solar: 997.6, grid: 299.5, house: 1261.7 }, { date: "Nov-26", solar: 240.2, grid: 120.1, house: 330.4 }];
  const { container } = render(<SolarPage range={trueUpYear} items={months} today="2026-11-07" initialStatus={null} />);
  expect(screen.getByText(/select a month for its days/)).toBeTruthy();
  fireEvent.click(solarOf(container, "Oct 2026")!);
  expect(router.push).toHaveBeenCalledWith("/?start=2026-10-01&end=2026-10-31");
});

test("the served bars draw with no request of their own", async () => {
  render(<SolarPage range={november} items={[item("2026-11-07", 12.1)]} today="2026-11-07" initialStatus={null} />);
  await settle();
  expect(fetches).toEqual([]);
});

test("totals for a day in the range reload the bars in place; other days' don't", async () => {
  const { container } = render(<SolarPage range={november} items={[item("2026-11-06", 12.1)]} today="2026-11-07" initialStatus={null} />);
  FakeStream.opened[0].send({ date: "2026-10-17" }, "totals");
  expect(fetches).toEqual([]);
  FakeStream.opened[0].send({ date: "2026-11-07" }, "totals");
  await settle();
  expect(fetches).toEqual(["/api/range?start_date=2026-11-01&end_date=2026-11-30"]);
  expect(solarOf(container, "Nov 7")).not.toBeNull();
});

test("a stream that opens again reloads a range that includes today, but not a past one", async () => {
  const { rerender } = render(<SolarPage range={march} items={[]} today="2026-11-07" initialStatus={null} />);
  const [stream] = FakeStream.opened;
  stream.connect();
  stream.fail(false);
  stream.connect();
  await settle();
  expect(fetches).toEqual([]);
  rerender(<SolarPage range={november} items={[]} today="2026-11-07" initialStatus={null} />);
  stream.fail(false);
  stream.connect();
  await settle();
  expect(fetches).toEqual(["/api/range?start_date=2026-11-01&end_date=2026-11-30"]);
});

test("a failed reload keeps the bars", async () => {
  answers.push(() => Promise.resolve({ ok: false, json: () => ({}) }));
  const { container } = render(<SolarPage range={november} items={[item("2026-11-06", 12.1)]} today="2026-11-07" initialStatus={null} />);
  vi.spyOn(console, "error").mockImplementation(() => {});
  FakeStream.opened[0].send({ date: "2026-11-07" }, "totals");
  await settle();
  expect(solarOf(container, "Nov 6")).not.toBeNull();
});

test("a slower, earlier reload never replaces a later one", async () => {
  let answerFirst: (value: { ok: boolean; json: () => unknown }) => void = () => {};
  answers.push(() => new Promise((resolve) => (answerFirst = resolve)));
  answers.push(() => Promise.resolve({ ok: true, json: () => ({ data: [item("2026-11-07", 30.5)] }) }));
  const { container } = render(<SolarPage range={november} items={[]} today="2026-11-07" initialStatus={null} />);
  FakeStream.opened[0].send({ date: "2026-11-07" }, "totals");
  FakeStream.opened[0].send({ date: "2026-11-07" }, "totals");
  await settle();
  await act(async () => answerFirst({ ok: true, json: () => ({ data: [item("2026-11-05", 1)] }) }));
  expect(solarOf(container, "Nov 7")).not.toBeNull();
  expect(solarOf(container, "Nov 5")).toBeNull();
});

test("a new range from the server replaces bars reloaded for the old one", async () => {
  const { container, rerender } = render(<SolarPage range={november} items={[]} today="2026-11-07" initialStatus={null} />);
  FakeStream.opened[0].send({ date: "2026-11-07" }, "totals");
  await settle();
  rerender(<SolarPage range={march} items={[{ date: "Mar 3", day: "2026-03-03", solar: 9, grid: 1, house: 2 }]} today="2026-11-07" initialStatus={null} />);
  expect(solarOf(container, "Mar 3")).not.toBeNull();
  expect(solarOf(container, "Nov 7")).toBeNull();
});

const CARD: ForecastCard = { today: { day: "2026-11-07", soFar: 9.6, expected: 31, code: 0, sky: "forecast" }, days: [{ day: "2026-11-08", expected: 33, code: 0 }], goodDay: 37, staleSince: null, byHour: null };
const later = { ...CARD, today: { ...CARD.today, soFar: 12.4 } };
const soFar = () => screen.getByRole("group", { name: "Today" }).textContent;

test("with a forecast, today's totals reload it with the bars; another day's totals don't", async () => {
  answers.push(() => Promise.resolve({ ok: true, json: () => ({ data: [item("2026-11-06", 12.1)] }) }));
  render(<SolarPage range={november} items={[item("2026-11-06", 12.1)]} today="2026-11-07" initialStatus={null} forecast={CARD} />);
  FakeStream.opened[0].send({ date: "2026-11-06" }, "totals");
  await settle();
  expect(fetches).toEqual(["/api/range?start_date=2026-11-01&end_date=2026-11-30"]);
  expect(soFar()).toContain("9.6 kWh so far");
  fetches = [];
  answers.push(() => Promise.resolve({ ok: true, json: () => ({ data: [item("2026-11-07", 12.4)] }) }));
  answers.push(() => Promise.resolve({ ok: true, json: () => ({ data: later }) }));
  FakeStream.opened[0].send({ date: "2026-11-07" }, "totals");
  await settle();
  expect(fetches).toEqual(["/api/range?start_date=2026-11-01&end_date=2026-11-30", "/api/forecast"]);
  expect(soFar()).toContain("12.4 kWh so far");
});

test("a stream that opens again reloads the forecast, even for a past range", async () => {
  answers.push(() => Promise.resolve({ ok: true, json: () => ({ data: later }) }));
  render(<SolarPage range={march} items={[]} today="2026-11-07" initialStatus={null} forecast={CARD} />);
  const [stream] = FakeStream.opened;
  stream.connect();
  stream.fail(false);
  stream.connect();
  await settle();
  expect(fetches).toEqual(["/api/forecast"]);
  expect(soFar()).toContain("12.4 kWh so far");
});

test("a failed forecast reload keeps the card", async () => {
  answers.push(() => Promise.resolve({ ok: true, json: () => ({ data: [] }) }));
  answers.push(() => Promise.resolve({ ok: false, json: () => ({}) }));
  vi.spyOn(console, "error").mockImplementation(() => {});
  render(<SolarPage range={november} items={[]} today="2026-11-07" initialStatus={null} forecast={CARD} />);
  FakeStream.opened[0].send({ date: "2026-11-07" }, "totals");
  await settle();
  expect(soFar()).toContain("9.6 kWh so far");
});

test("left open past midnight, the new day's totals reload the card", async () => {
  answers.push(() => Promise.resolve({ ok: true, json: () => ({ data: [] }) }));
  answers.push(() => Promise.resolve({ ok: true, json: () => ({ data: { ...later, today: { ...later.today, day: "2026-11-08" } } }) }));
  render(<SolarPage range={november} items={[]} today="2026-11-07" initialStatus={null} forecast={CARD} />);
  vi.setSystemTime(Date.parse("2026-11-08T17:00:00Z"));
  FakeStream.opened[0].send({ date: "2026-11-08" }, "totals");
  await settle();
  expect(fetches).toEqual(["/api/range?start_date=2026-11-01&end_date=2026-11-30", "/api/forecast"]);
  expect(soFar()).toContain("12.4 kWh so far");
});

test("a new range served with fresher forecast figures shows them over an earlier reload", async () => {
  answers.push(() => Promise.resolve({ ok: true, json: () => ({ data: [] }) }));
  answers.push(() => Promise.resolve({ ok: true, json: () => ({ data: later }) }));
  const { rerender } = render(<SolarPage range={november} items={[]} today="2026-11-07" initialStatus={null} forecast={CARD} />);
  FakeStream.opened[0].send({ date: "2026-11-07" }, "totals");
  await settle();
  expect(soFar()).toContain("12.4 kWh so far");
  rerender(<SolarPage range={march} items={[]} today="2026-11-07" initialStatus={null} forecast={{ ...CARD, today: { ...CARD.today, soFar: 15 } }} />);
  expect(soFar()).toContain("15.0 kWh so far");
});
