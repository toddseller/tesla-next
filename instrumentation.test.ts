// register() fills the car charging and payback caches at boot, in the background (warm-caches design).
import { afterAll, beforeEach, expect, test, vi } from "vitest";

import { FIRST_DAY, siteToday } from "@/lib/scene/replay";

const startListening = vi.hoisted(() => vi.fn());
const carCharging = vi.hoisted(() => vi.fn());
const payback = vi.hoisted(() => vi.fn());
const patterns = vi.hoisted(() => vi.fn());
const onRewrite = vi.hoisted(() => vi.fn());
vi.mock("./lib/live", () => ({ startListening, onRewrite }));
vi.mock("./lib/car-charging", () => ({ carCharging }));
vi.mock("./lib/true-up/payback", () => ({ payback }));
vi.mock("./lib/patterns", () => ({ patterns }));

vi.stubEnv("NEXT_RUNTIME", "nodejs");
afterAll(() => vi.unstubAllEnvs());
beforeEach(() => vi.clearAllMocks());

const pending = () => new Promise(() => {});

test("starts the listener and warms All time charging and the payback years without waiting", async () => {
  carCharging.mockImplementation(pending);
  payback.mockImplementation(pending);
  patterns.mockImplementation(pending);
  const { register } = await import("./instrumentation");
  await register();
  const today = siteToday();
  expect(startListening).toHaveBeenCalledOnce();
  expect(carCharging).toHaveBeenCalledWith(FIRST_DAY, today, today);
  expect(payback).toHaveBeenCalledWith(today);
});

test("a failed warm-up is logged, the other still runs, and the time is logged once both settle", async () => {
  const error = vi.spyOn(console, "error").mockImplementation(() => {});
  const log = vi.spyOn(console, "log").mockImplementation(() => {});
  carCharging.mockRejectedValue(new Error("connection refused"));
  payback.mockResolvedValue(null);
  patterns.mockResolvedValue(null);
  const { register } = await import("./instrumentation");
  await expect(register()).resolves.toBeUndefined();
  expect(payback).toHaveBeenCalledOnce();
  await vi.waitFor(() => expect(log).toHaveBeenCalledWith(expect.stringMatching(/^caches warmed in \d+(\.\d)?s$/)));
  expect(error).toHaveBeenCalledWith("cache warm-up failed:", "connection refused");
});

test("also warms the Patterns page's kept months", async () => {
  carCharging.mockImplementation(pending);
  payback.mockImplementation(pending);
  patterns.mockImplementation(pending);
  const { register } = await import("./instrumentation");
  await register();
  expect(patterns).toHaveBeenCalledWith(siteToday());
});

test("a rewrite empties every kept figure and warms them again without waiting, a failed warm-up logged", async () => {
  const error = vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "log").mockImplementation(() => {});
  carCharging.mockResolvedValue(null);
  payback.mockResolvedValue(null);
  patterns.mockResolvedValue(null);
  const { register } = await import("./instrumentation");
  await register();
  const [hook] = onRewrite.mock.calls.at(-1)!;
  vi.clearAllMocks();
  globalThis.chargingDays = new Map([["2026-04-01", {} as never]]);
  globalThis.paybackYears = new Map([["2025-04-01", {} as never]]);
  globalThis.patternsMonths = new Map([["2025-01-01..2026-11-01", {} as never]]);
  globalThis.trueUpGrids = new Map([["2024-10-01..2025-09-30", []]]);
  patterns.mockRejectedValue(new Error("connection refused"));
  carCharging.mockImplementation(pending);
  payback.mockImplementation(pending);
  hook();
  expect([globalThis.chargingDays.size, globalThis.paybackYears.size, globalThis.patternsMonths.size, globalThis.trueUpGrids.size]).toEqual([0, 0, 0, 0]);
  const today = siteToday();
  expect(carCharging).toHaveBeenCalledWith(FIRST_DAY, today, today);
  expect(payback).toHaveBeenCalledWith(today);
  await vi.waitFor(() => expect(error).toHaveBeenCalledWith("cache warm-up failed:", "connection refused"));
});
