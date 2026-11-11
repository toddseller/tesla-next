// payback() keeps the day's answer, refreshed on today's totals; finished years are kept once priced (system-payback).
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, beforeEach, expect, test, vi } from "vitest";

const trueUpSavings = vi.hoisted(() => vi.fn(async (start: string) => ({ solar_saved: 6_000, powerwalls_added: -150, through: start.startsWith("2026") ? "2026-11-09" : "2025-10-02" })));
const refreshSavings = vi.hoisted(() => vi.fn(async () => {}));
vi.mock("@/lib/true-up/savings", () => ({ trueUpSavings, refreshSavings }));
vi.mock("@/lib/true-up/cost", () => ({ vppSeason: async () => null }));
vi.mock("@/lib/backup", () => ({ backupHistory: async () => ({ summary: { outages: 0, seconds: 0, longest: null } }) }));
vi.mock("@/lib/db", () => ({ db: { query: async () => ({ rows: [] }) } }));
vi.mock("@/lib/true-up/reads", () => ({
  trueUpYears: async () => [
    { label: "'23 - '24", start_date: "2023-10-01", end_date: "2024-09-30", current: false },
    { label: "'24 - '25", start_date: "2024-10-01", end_date: "2025-09-30", current: false },
    { label: "'26 - '27", start_date: "2026-10-01", end_date: "2027-09-30", current: true },
  ],
}));

beforeAll(() => {
  const path = join(mkdtempSync(join(tmpdir(), "costs-")), "costs.json");
  writeFileSync(path, JSON.stringify({ solar: 25_000, powerwalls: 20_000, sales_tax: 3_000, credit_rate: 0.26 }));
  vi.stubEnv("SYSTEM_COSTS_FILE", path);
});

afterAll(() => vi.unstubAllEnvs());

beforeEach(() => {
  globalThis.paybackKept?.clear();
  trueUpSavings.mockClear();
});

const priced = (start: string) => trueUpSavings.mock.calls.filter(([s]) => s === start).length;
const later = <T,>() => {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};

test("the day's answer is kept: a second call, or two at once, price nothing again", async () => {
  const { payback } = await import("./payback");
  const [a, b] = await Promise.all([payback("2026-11-09"), payback("2026-11-09")]);
  const c = await payback("2026-11-09");
  expect(b).toBe(a);
  expect(c).toBe(a);
  expect(priced("2026-10-01")).toBe(1);
  expect(priced("2023-10-01")).toBe(1);
});

test("a new day works the current year out again", async () => {
  const { payback } = await import("./payback");
  await payback("2026-11-09");
  await payback("2026-11-10");
  expect(priced("2026-10-01")).toBe(2);
});

test("from the moment a refresh starts, callers get its answer, not the old one", async () => {
  const { payback, refreshPayback } = await import("./payback");
  const old = await payback("2026-11-09");
  const slow = later<{ solar_saved: number; powerwalls_added: number; through: string }>();
  trueUpSavings.mockImplementationOnce(() => slow.promise);
  const refreshing = refreshPayback("2026-11-09");
  const during = payback("2026-11-09");
  slow.resolve({ solar_saved: 7_000, powerwalls_added: -150, through: "2026-11-09" });
  await refreshing;
  const fresh = await during;
  expect(fresh).not.toBe(old);
  expect(await payback("2026-11-09")).toBe(fresh);
});

test("a failed refresh falls back to the old figures and is logged", async () => {
  const error = vi.spyOn(console, "error").mockImplementation(() => {});
  const { payback, refreshPayback } = await import("./payback");
  const old = await payback("2026-11-09");
  trueUpSavings.mockRejectedValueOnce(new Error("connection refused"));
  const refreshing = refreshPayback("2026-11-09");
  const during = payback("2026-11-09");
  await refreshing;
  expect(await during).toBe(old);
  expect(await payback("2026-11-09")).toBe(old);
  expect(error).toHaveBeenCalledWith("payback refresh failed:", "connection refused");
  error.mockRestore();
});

test("a failed working-out isn't kept, so the next call tries again", async () => {
  const { payback } = await import("./payback");
  trueUpSavings.mockRejectedValueOnce(new Error("connection refused"));
  await expect(payback("2026-11-09")).rejects.toThrow("connection refused");
  await expect(payback("2026-11-09")).resolves.not.toBeNull();
});

test("emptying the kept answer works it out again", async () => {
  const { payback } = await import("./payback");
  await payback("2026-11-09");
  globalThis.paybackKept?.clear();
  await payback("2026-11-09");
  expect(priced("2026-10-01")).toBe(2);
});

test("a refresh works the current year's savings out again first, so the payback reads them fresh", async () => {
  const { payback, refreshPayback } = await import("./payback");
  await payback("2026-11-09");
  const order: string[] = [];
  refreshSavings.mockImplementationOnce(async () => { order.push("savings"); });
  trueUpSavings.mockImplementation(async (start: string) => { order.push(`priced ${start}`); return { solar_saved: 6_000, powerwalls_added: -150, through: "2026-11-09" }; });
  await refreshPayback("2026-11-09");
  expect(refreshSavings).toHaveBeenCalledWith("2026-11-09");
  expect(order[0]).toBe("savings");
});

// The savings cache keeps finished years (until a rewrite); payback has no store of its own to go stale.
test("a new day prices every year through the savings again, with no finished-years store of its own", async () => {
  const { payback } = await import("./payback");
  await payback("2026-11-09");
  await payback("2026-11-10");
  expect(priced("2023-10-01")).toBe(2);
  expect("paybackYears" in globalThis).toBe(false);
});
