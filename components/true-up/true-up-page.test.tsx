// @vitest-environment jsdom
// The True-Up Tracker in the browser: its year picker and staying current, from the true-up-tracker spec.
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { COST_25_26, CURRENT, CURRENT_COST, YEAR_25_26, YEARS } from "@/components/true-up/fixtures";
import { TrueUpPage } from "@/components/true-up/true-up-page";
import { FakeStream } from "@/test/fake-event-source";

const router = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));

const THIS_YEAR = { start: "2026-10-01", end: "2027-09-30" };
const YEAR_25 = { start: "2025-10-01", end: "2026-09-30" };

let fetches: string[];
let answers: Record<string, unknown>;
let failing: boolean;

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(Date.parse("2026-11-08T20:00:00Z"));
  FakeStream.opened = [];
  vi.stubGlobal("EventSource", FakeStream);
  fetches = [];
  failing = false;
  answers = {};
  vi.stubGlobal("fetch", (url: string) => {
    fetches.push(url);
    const path = url.split("?")[0];
    return Promise.resolve({ ok: !failing, json: () => ({ data: answers[path] }) });
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
  router.push.mockReset();
});

const settle = () => act(() => new Promise((resolve) => setTimeout(resolve, 0)));
const pressed = (name: string) => screen.getByRole("button", { name }).getAttribute("aria-pressed");
const page = (range = THIS_YEAR, cycles = CURRENT, cost = CURRENT_COST) =>
  <TrueUpPage range={range} years={YEARS} cycles={cycles} cost={cost} today="2026-11-08" />;
const RELOADS = (range: { start: string; end: string }) => [`/api/cycles?start_date=${range.start}&end_date=${range.end}`, `/api/true-up-cost?start_date=${range.start}&end_date=${range.end}`];

test("This year is marked, and the presets and Earlier menu push their addresses", () => {
  render(page());
  expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("True-Up Tracker");
  expect(["This year", "'25 - '26", "'24 - '25", "All time"].map(pressed)).toEqual(["true", "false", "false", "false"]);
  fireEvent.click(screen.getByRole("button", { name: "All time" }));
  expect(router.push).toHaveBeenLastCalledWith("/true-up?start=2021-10-01&end=2027-09-30");
  act(() => fireEvent.click(screen.getByRole("button", { name: /Earlier/ })));
  act(() => fireEvent.click(screen.getByRole("menuitemradio", { name: "'22 - '23" })));
  expect(router.push).toHaveBeenLastCalledWith("/true-up?start=2022-10-01&end=2023-09-30");
});

test("the served data shows with no request of its own", async () => {
  render(page());
  await settle();
  expect(fetches).toEqual([]);
  expect(screen.getByRole("region", { name: "Charges so far" }).textContent).toContain("$106.46");
});

test("totals for today reload the cycles and cost in place", async () => {
  answers = { "/api/cycles": CURRENT, "/api/true-up-cost": { ...CURRENT_COST, charges_so_far: 110.5 } };
  render(page());
  FakeStream.opened[0].send({ date: "2026-11-08" }, "totals");
  await settle();
  expect(fetches).toEqual(RELOADS(THIS_YEAR));
  expect(screen.getByRole("region", { name: "Charges so far" }).textContent).toContain("$110.50");
});

test("'25 - '26 reloads for a day in its last cycle, past September 30", async () => {
  answers = { "/api/cycles": YEAR_25_26, "/api/true-up-cost": COST_25_26 };
  render(page(YEAR_25, YEAR_25_26, COST_25_26));
  FakeStream.opened[0].send({ date: "2026-10-05" }, "totals");
  expect(fetches).toEqual([]);
  FakeStream.opened[0].send({ date: "2026-10-02" }, "totals");
  await settle();
  expect(fetches).toEqual(RELOADS(YEAR_25));
});

test("a past year doesn't reload for today, and a reopened stream reloads only a range covering today", async () => {
  answers = { "/api/cycles": CURRENT, "/api/true-up-cost": CURRENT_COST };
  const { rerender } = render(page(YEAR_25, YEAR_25_26, COST_25_26));
  const [stream] = FakeStream.opened;
  stream.send({ date: "2026-11-08" }, "totals");
  stream.connect();
  stream.fail(false);
  stream.connect();
  await settle();
  expect(fetches).toEqual([]);
  rerender(page());
  stream.fail(false);
  stream.connect();
  await settle();
  expect(fetches).toEqual(RELOADS(THIS_YEAR));
});

test("a range that isn't a true-up year reloads its cycles alone", async () => {
  const allTime = { start: "2021-10-01", end: "2027-09-30" };
  answers = { "/api/cycles": CURRENT };
  render(page(allTime, CURRENT, null as never));
  FakeStream.opened[0].send({ date: "2026-11-08" }, "totals");
  await settle();
  expect(fetches).toEqual([RELOADS(allTime)[0]]);
});

test("a failed reload keeps the data", async () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  failing = true;
  render(page());
  FakeStream.opened[0].send({ date: "2026-11-08" }, "totals");
  await settle();
  expect(screen.getByRole("region", { name: "Charges so far" }).textContent).toContain("$106.46");
});
