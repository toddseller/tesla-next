// @vitest-environment jsdom
// The Solar page in the browser: its address changes and staying current, from the solar-range-chart spec.
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { SolarPage } from "@/components/solar/solar-page";
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
