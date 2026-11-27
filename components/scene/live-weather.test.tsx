// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { useLiveWeather } from "@/components/scene/live-weather";
import { applyStatus, EMPTY } from "@/components/scene/use-site-data";

const site = (cover: number, temperature: number, code: number) =>
  ({ ...applyStatus(EMPTY, { weather: { cover, temperature, code } }), replayData: null, setReplayDay: () => {} });

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

test("the temperature and code pass on unwalked while the sky walks", () => {
  const { result, rerender } = renderHook(({ site: s }) => useLiveWeather(s), { initialProps: { site: site(0.2, 16.7, 3) } });
  expect(result.current).toMatchObject({ cover: 0.2, temperature: 16.7, code: 3 });
  rerender({ site: site(1, 12.1, 61) });
  act(() => void vi.advanceTimersByTime(60_000));
  expect(result.current).toMatchObject({ temperature: 12.1, code: 61 });
  expect(result.current.cover).toBeLessThan(1);
});
