// @vitest-environment jsdom
// The True-Up Tracker in the browser: its year picker and staying current, from the true-up-tracker spec.
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { COST_25_26, CURRENT, CURRENT_COST, CURRENT_SAVINGS, SAVINGS_25_26, YEAR_25_26, YEARS } from "@/components/true-up/fixtures";
import { TrueUpPage } from "@/components/true-up/true-up-page";
import type { Payback } from "@/lib/true-up/payback";
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
const page = (range = THIS_YEAR, cycles = CURRENT, cost = CURRENT_COST, savings: typeof CURRENT_SAVINGS | null = CURRENT_SAVINGS, payback: Payback | null = null) =>
  <TrueUpPage range={range} years={YEARS} cycles={cycles} cost={cost} savings={savings} payback={payback} today="2026-11-08" />;
const PAYBACK: Payback = {
  solar: { year: 2025, month: "2025-06", projected: false, estimated: true }, system: { year: 2030, projected: true, estimated: true },
  powerwalls: { year: null, wont: true }, outages: { count: 35, seconds: 564_840, longest_seconds: 188_172 },
};
const RELOADS = (range: { start: string; end: string }) =>
  ["cycles", "true-up-cost", "true-up-savings"].map((route) => `/api/${route}?start_date=${range.start}&end_date=${range.end}`);
const savingsCard = () => screen.getByRole("region", { name: "What the system saved" }).textContent;

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
  expect(savingsCard()).toContain("$411");
});

test("totals for today reload the cycles, cost and savings in place", async () => {
  answers = {
    "/api/cycles": CURRENT, "/api/true-up-cost": { ...CURRENT_COST, charges_so_far: 110.5 },
    "/api/true-up-savings": { ...CURRENT_SAVINGS, actual: { pge: 80, westlight: 20, total: 100 } },
  };
  render(page());
  expect(savingsCard()).toContain("$411");
  FakeStream.opened[0].send({ date: "2026-11-08" }, "totals");
  await settle();
  expect(fetches).toEqual(RELOADS(THIS_YEAR));
  expect(screen.getByRole("region", { name: "Charges so far" }).textContent).toContain("$110.50");
  expect(savingsCard()).toContain("$445");
});

test("'25 - '26 reloads for a day in its last cycle, past September 30", async () => {
  answers = { "/api/cycles": YEAR_25_26, "/api/true-up-cost": COST_25_26, "/api/true-up-savings": SAVINGS_25_26 };
  render(page(YEAR_25, YEAR_25_26, COST_25_26, SAVINGS_25_26));
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
  render(page(allTime, CURRENT, null as never, null));
  expect(screen.queryByRole("region", { name: "What the system saved" })).toBeNull();
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
  expect(savingsCard()).toContain("$411");
});

test("the Payback card shows for any range with payback data, and not without", () => {
  render(page(YEAR_25, YEAR_25_26, COST_25_26, SAVINGS_25_26, PAYBACK));
  expect(screen.getByRole("region", { name: "Payback" })).toBeTruthy();
  cleanup();
  render(page());
  expect(screen.queryByRole("region", { name: "Payback" })).toBeNull();
});

test("a totals event for today reloads the Payback card whatever range is shown, keeping it when the reload fails", async () => {
  render(page({ start: "2022-10-01", end: "2023-09-30" }, [], CURRENT_COST, null, PAYBACK));
  answers["/api/payback"] = { ...PAYBACK, system: { year: 2029, projected: true, estimated: true } };
  FakeStream.opened[0].send({ date: "2026-11-08" }, "totals");
  await settle();
  expect(fetches).toContain("/api/payback");
  expect(screen.getByRole("region", { name: "Payback" }).textContent).toContain("2029");
  failing = true;
  vi.spyOn(console, "error").mockImplementation(() => {});
  FakeStream.opened[0].send({ date: "2026-11-08" }, "totals");
  await settle();
  expect(screen.getByRole("region", { name: "Payback" }).textContent).toContain("2029");
});

const follows = (later: HTMLElement, earlier: HTMLElement) => Boolean(earlier.compareDocumentPosition(later) & Node.DOCUMENT_POSITION_FOLLOWING);

test("on a true-up year the Payback card follows the savings card and comes before the billing-cycle chart", () => {
  render(page(YEAR_25, YEAR_25_26, COST_25_26, SAVINGS_25_26, PAYBACK));
  const payback = screen.getByRole("region", { name: "Payback" });
  expect(follows(payback, screen.getByRole("region", { name: "What the system saved" }))).toBe(true);
  expect(follows(screen.getByRole("region", { name: /by billing cycle$/ }), payback)).toBe(true);
});

test("on All time, with no savings card, the Payback card follows the tiles and comes before the chart", () => {
  render(page({ start: "2021-10-01", end: "2027-09-30" }, CURRENT, null as never, null, PAYBACK));
  const payback = screen.getByRole("region", { name: "Payback" });
  expect(screen.queryByRole("region", { name: "What the system saved" })).toBeNull();
  expect(follows(screen.getByRole("region", { name: /by billing cycle$/ }), payback)).toBe(true);
});

// site-motion, "True-Up's figures count up when first seen": a new range's tiles are new figures, but not a first view.
test("figures count up on the page's first view, and not after a range change brings new tiles", () => {
  vi.useFakeTimers({ toFake: ["Date", "setTimeout", "clearTimeout"] });
  vi.setSystemTime(Date.parse("2026-11-08T20:00:00Z"));
  const { rerender } = render(page());
  expect(document.querySelectorAll("[data-part=counting]").length).toBeGreaterThan(0);
  act(() => vi.advanceTimersByTime(1000));
  rerender(page(YEAR_25, YEAR_25_26, COST_25_26, SAVINGS_25_26));
  expect(document.querySelectorAll("[data-part=counting]").length).toBe(0);
});
