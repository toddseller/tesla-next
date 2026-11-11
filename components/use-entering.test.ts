// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { useEntering } from "./use-entering";

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

test("is true from mount until the given time has passed, and stays false after", () => {
  const { result, rerender } = renderHook(() => useEntering(650));
  expect(result.current).toBe(true);
  act(() => vi.advanceTimersByTime(649));
  expect(result.current).toBe(true);
  act(() => vi.advanceTimersByTime(1));
  expect(result.current).toBe(false);
  rerender();
  expect(result.current).toBe(false);
});
