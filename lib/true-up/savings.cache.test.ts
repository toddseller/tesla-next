// trueUpSavings() keeps each true-up year's answer for the site day, refreshed on today's totals (true-up-savings).
import { afterEach, beforeEach, expect, test, vi } from "vitest";

const cycleGrids = vi.hoisted(() => vi.fn(async (_start: string) => [] as never[]));
vi.mock("@/lib/true-up/grid", async (original) => ({ ...(await original<typeof import("@/lib/true-up/grid")>()), cycleGrids }));
vi.mock("@/lib/true-up/cost", async (original) => ({ ...(await original<typeof import("@/lib/true-up/cost")>()), loadPricing: async () => ({ revisions: [] }) }));

const YEAR = ["2026-10-01", "2027-09-30"] as const;
const workedOut = () => cycleGrids.mock.calls.length;
const later = () => {
  let resolve!: (value: never[]) => void;
  const promise = new Promise<never[]>((yes) => { resolve = yes; });
  return { promise, resolve };
};

beforeEach(() => {
  globalThis.savingsKept = undefined;
  cycleGrids.mockClear();
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(Date.parse("2026-11-11T18:00:00Z"));
});
afterEach(() => vi.useRealTimers());

test("a true-up year's savings are kept for the day: a second call, or two at once, work nothing out again", async () => {
  const { trueUpSavings } = await import("./savings");
  await Promise.all([trueUpSavings(...YEAR), trueUpSavings(...YEAR)]);
  await trueUpSavings(...YEAR);
  expect(workedOut()).toBe(1);
});

test("a range that isn't a true-up year isn't kept", async () => {
  const { trueUpSavings } = await import("./savings");
  await trueUpSavings("2026-01-01", "2026-03-31");
  expect(globalThis.savingsKept?.size ?? 0).toBe(0);
});

test("a new day works them out again", async () => {
  const { trueUpSavings } = await import("./savings");
  await trueUpSavings(...YEAR);
  vi.setSystemTime(Date.parse("2026-11-12T18:00:00Z"));
  await trueUpSavings(...YEAR);
  expect(workedOut()).toBe(2);
});

test("a failed working-out isn't kept", async () => {
  const { trueUpSavings } = await import("./savings");
  cycleGrids.mockRejectedValueOnce(new Error("connection refused"));
  await expect(trueUpSavings(...YEAR)).rejects.toThrow("connection refused");
  await trueUpSavings(...YEAR);
  expect(workedOut()).toBe(2);
});

test("a refresh is in place the moment it's called: callers wait for its answer, and a failed one falls back", async () => {
  const { refreshSavings, trueUpSavings } = await import("./savings");
  const old = await trueUpSavings(...YEAR);
  const slow = later();
  cycleGrids.mockImplementationOnce(() => slow.promise);
  const refreshing = refreshSavings("2026-11-11");
  let settled = false;
  const during = trueUpSavings(...YEAR).then((answer) => { settled = true; return answer; });
  await Promise.resolve();
  expect(settled).toBe(false);
  slow.resolve([]);
  await refreshing;
  await during;
  expect(workedOut()).toBe(2);

  const error = vi.spyOn(console, "error").mockImplementation(() => {});
  cycleGrids.mockRejectedValueOnce(new Error("connection refused"));
  await refreshSavings("2026-11-11");
  expect(await trueUpSavings(...YEAR)).toBe(old);
  expect(workedOut()).toBe(3);
  error.mockRestore();
});

test("a settled year, ended more than 31 days ago, is kept across days; an unsettled one isn't", async () => {
  const { trueUpSavings } = await import("./savings");
  await trueUpSavings("2024-10-01", "2025-09-30");
  await trueUpSavings(...YEAR);
  vi.setSystemTime(Date.parse("2026-11-12T18:00:00Z"));
  await trueUpSavings("2024-10-01", "2025-09-30");
  await trueUpSavings(...YEAR);
  expect(cycleGrids.mock.calls.map(([start]) => start)).toEqual(["2024-10-01", "2026-10-01", "2026-10-01"]);
});

test("a refresh re-works only today's unsettled kept years", async () => {
  const { refreshSavings, trueUpSavings } = await import("./savings");
  await trueUpSavings(...YEAR);
  await trueUpSavings("2025-10-01", "2026-09-30");
  cycleGrids.mockClear();
  await refreshSavings("2026-11-11");
  expect(cycleGrids.mock.calls.map(([start]) => start)).toEqual(["2026-10-01"]);

  // On October 20 the year that ended September 30 isn't settled yet: its last cycle and late meter days are still coming.
  globalThis.savingsKept = undefined;
  vi.setSystemTime(Date.parse("2026-10-20T18:00:00Z"));
  await trueUpSavings(...YEAR);
  await trueUpSavings("2025-10-01", "2026-09-30");
  cycleGrids.mockClear();
  await refreshSavings("2026-10-20");
  expect(cycleGrids.mock.calls.map(([start]) => start).sort()).toEqual(["2025-10-01", "2026-10-01"]);
});
