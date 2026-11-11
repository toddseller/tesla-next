// A day's answers kept in memory: payback's and each true-up year's savings (payback-cache design).
import { expect, test, vi } from "vitest";

import { type Kept, keptFor, refreshKept } from "./kept";

const later = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((yes) => { resolve = yes; });
  return { promise, resolve };
};

test("an answer is kept for its day: a second call, or two at once, work nothing out again; a new day does", async () => {
  const kept: Kept<number> = new Map();
  const workOut = vi.fn(async () => 1);
  const [a, b] = await Promise.all([keptFor(kept, "k", "2026-11-11", workOut), keptFor(kept, "k", "2026-11-11", workOut)]);
  expect([a, b, await keptFor(kept, "k", "2026-11-11", workOut)]).toEqual([1, 1, 1]);
  expect(workOut).toHaveBeenCalledOnce();
  await keptFor(kept, "k", "2026-11-12", workOut);
  expect(workOut).toHaveBeenCalledTimes(2);
});

test("a failed working-out isn't kept", async () => {
  const kept: Kept<number> = new Map();
  await expect(keptFor(kept, "k", "2026-11-11", () => Promise.reject(new Error("down")))).rejects.toThrow("down");
  expect(kept.size).toBe(0);
});

test("a refresh is in place at once; a failed one falls back to the previous answer, logged", async () => {
  const kept: Kept<number> = new Map();
  await keptFor(kept, "k", "2026-11-11", async () => 1);
  const slow = later<number>();
  const refreshing = refreshKept(kept, "k", "2026-11-11", () => slow.promise, "test");
  const during = keptFor(kept, "k", "2026-11-11", async () => 99);
  slow.resolve(2);
  await refreshing;
  expect(await during).toBe(2);

  const error = vi.spyOn(console, "error").mockImplementation(() => {});
  await refreshKept(kept, "k", "2026-11-11", () => Promise.reject(new Error("down")), "test");
  expect(await keptFor(kept, "k", "2026-11-11", async () => 99)).toBe(2);
  expect(error).toHaveBeenCalledWith("test refresh failed:", "down");
  error.mockRestore();
});

// Instrumentation calls refreshes with `void`: a rejection here would be unhandled, which stops Node.
test("a refresh that fails with nothing kept resolves, and keeps nothing", async () => {
  const kept: Kept<number> = new Map();
  const error = vi.spyOn(console, "error").mockImplementation(() => {});
  await expect(refreshKept(kept, "k", "2026-11-11", () => Promise.reject(new Error("down")), "test")).resolves.toBeUndefined();
  expect(kept.size).toBe(0);
  error.mockRestore();
});

test("a refresh that fails on a new day keeps nothing, not yesterday's answer", async () => {
  const kept: Kept<number> = new Map();
  await keptFor(kept, "k", "2026-11-10", async () => 1);
  const error = vi.spyOn(console, "error").mockImplementation(() => {});
  await refreshKept(kept, "k", "2026-11-11", () => Promise.reject(new Error("down")), "test");
  expect(kept.size).toBe(0);
  expect(await keptFor(kept, "k", "2026-11-11", async () => 2)).toBe(2);
  error.mockRestore();
});
