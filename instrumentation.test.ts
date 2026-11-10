// register() fills the car charging and payback caches at boot, in the background (warm-caches design).
import { afterAll, beforeEach, expect, test, vi } from "vitest";

import { FIRST_DAY, siteToday } from "@/lib/scene/replay";

const startListening = vi.hoisted(() => vi.fn());
const carCharging = vi.hoisted(() => vi.fn());
const payback = vi.hoisted(() => vi.fn());
vi.mock("./lib/live", () => ({ startListening }));
vi.mock("./lib/car-charging", () => ({ carCharging }));
vi.mock("./lib/true-up/payback", () => ({ payback }));

vi.stubEnv("NEXT_RUNTIME", "nodejs");
afterAll(() => vi.unstubAllEnvs());
beforeEach(() => vi.clearAllMocks());

const pending = () => new Promise(() => {});

test("starts the listener and warms All time charging and the payback years without waiting", async () => {
  carCharging.mockImplementation(pending);
  payback.mockImplementation(pending);
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
  const { register } = await import("./instrumentation");
  await expect(register()).resolves.toBeUndefined();
  expect(payback).toHaveBeenCalledOnce();
  await vi.waitFor(() => expect(log).toHaveBeenCalledWith(expect.stringMatching(/^caches warmed in \d+(\.\d)?s$/)));
  expect(error).toHaveBeenCalledWith("cache warm-up failed:", "connection refused");
});
