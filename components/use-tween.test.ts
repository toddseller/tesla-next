// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { useTween } from "./use-tween";

const reduced = (on: boolean) =>
  vi.stubGlobal("matchMedia", (query: string) => ({ matches: on && query === "(prefers-reduced-motion: reduce)", addEventListener() {}, removeEventListener() {} }));

beforeEach(() => {
  reduced(false);
  vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame", "performance"] });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

test("shows the value at once on the first render", () => {
  const { result } = renderHook(() => useTween(92));
  expect(result.current).toBe(92);
});

test("moves from the old value to the new one over 400 ms, never from zero", () => {
  const { result, rerender } = renderHook(({ value }) => useTween(value), { initialProps: { value: 20 } });
  rerender({ value: 40 });
  expect(result.current).toBe(20);
  const seen: number[] = [];
  for (let ms = 50; ms <= 400; ms += 50) {
    act(() => vi.advanceTimersByTime(50));
    seen.push(result.current);
  }
  expect(seen.every((v) => v > 20 && v <= 40)).toBe(true);
  expect(seen[0]).toBeLessThan(40);
  expect(seen.at(-1)).toBe(40);
});

test("a change mid-way starts from where the figure is, not from the old target", () => {
  const { result, rerender } = renderHook(({ value }) => useTween(value), { initialProps: { value: 0 } });
  rerender({ value: 100 });
  act(() => vi.advanceTimersByTime(200));
  const midway = result.current;
  rerender({ value: 50 });
  act(() => vi.advanceTimersByTime(16));
  expect(Math.abs(result.current - midway)).toBeLessThan(10);
  act(() => vi.advanceTimersByTime(400));
  expect(result.current).toBe(50);
});

test("under reduced motion, changes at once", () => {
  reduced(true);
  const { result, rerender } = renderHook(({ value }) => useTween(value), { initialProps: { value: 20 } });
  rerender({ value: 40 });
  expect(result.current).toBe(40);
});
