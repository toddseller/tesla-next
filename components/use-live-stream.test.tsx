// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { useLiveStream } from "@/components/use-live-stream";
import { FakeStream } from "@/test/fake-event-source";

beforeEach(() => {
  FakeStream.opened = [];
  vi.stubGlobal("EventSource", FakeStream);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

const handlers = () => ({ onStatus: vi.fn(), onTotals: vi.fn(), onReopen: vi.fn() });

test("statuses and totals reach their handlers, and the stream closes with the page", () => {
  const on = handlers();
  const { unmount } = renderHook(() => useLiveStream(on));
  const [stream] = FakeStream.opened;
  expect(stream.url).toBe("/api/live");
  stream.send({ solar_power: 3.4 });
  stream.send({ date: "2026-10-14" }, "totals");
  expect(on.onStatus).toHaveBeenCalledWith({ solar_power: 3.4 });
  expect(on.onTotals).toHaveBeenCalledWith("2026-10-14");
  unmount();
  expect(stream.closed).toBe(true);
});

test("the latest render's handlers are the ones called, without opening a new stream", () => {
  const first = handlers();
  const second = handlers();
  const { rerender } = renderHook(({ on }) => useLiveStream(on), { initialProps: { on: first } });
  rerender({ on: second });
  FakeStream.opened[0].send({ date: "2026-10-14" }, "totals");
  expect(first.onTotals).not.toHaveBeenCalled();
  expect(second.onTotals).toHaveBeenCalledWith("2026-10-14");
  expect(FakeStream.opened).toHaveLength(1);
});

test("a stream the browser gives up on is opened again after 5 seconds, and its opening counts as a reopen", () => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  const on = handlers();
  renderHook(() => useLiveStream(on));
  FakeStream.opened[0].connect();
  FakeStream.opened[0].fail(true);
  act(() => vi.advanceTimersByTime(4_999));
  expect(FakeStream.opened).toHaveLength(1);
  act(() => vi.advanceTimersByTime(1));
  expect(FakeStream.opened).toHaveLength(2);
  FakeStream.opened[1].send({ date: "2026-10-14" }, "totals");
  expect(on.onTotals).toHaveBeenCalledWith("2026-10-14");
  FakeStream.opened[1].connect();
  expect(on.onReopen).toHaveBeenCalledTimes(1);
});

test("a stream the browser is still retrying is left to it, and its reconnection counts as a reopen", () => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  const on = handlers();
  renderHook(() => useLiveStream(on));
  const [stream] = FakeStream.opened;
  stream.connect();
  expect(on.onReopen).not.toHaveBeenCalled();
  stream.fail(false);
  act(() => vi.advanceTimersByTime(60_000));
  expect(FakeStream.opened).toHaveLength(1);
  stream.connect();
  expect(on.onReopen).toHaveBeenCalledTimes(1);
});

// --- One stream per tab ----------------------------------------------------------------

test("two parts of the page share one stream, and each gets every status, totals event and reopen", () => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  const bar = handlers();
  const page = handlers();
  renderHook(() => useLiveStream(bar));
  renderHook(() => useLiveStream(page));
  expect(FakeStream.opened).toHaveLength(1);
  FakeStream.opened[0].send({ battery_percentage: 92 });
  FakeStream.opened[0].send({ date: "2026-11-08" }, "totals");
  for (const on of [bar, page]) {
    expect(on.onStatus).toHaveBeenCalledWith({ battery_percentage: 92 });
    expect(on.onTotals).toHaveBeenCalledWith("2026-11-08");
  }
  FakeStream.opened[0].connect();
  FakeStream.opened[0].fail(true);
  act(() => vi.advanceTimersByTime(5_000));
  expect(FakeStream.opened).toHaveLength(2);
  FakeStream.opened[1].connect();
  expect([bar.onReopen.mock.calls.length, page.onReopen.mock.calls.length]).toEqual([1, 1]);
});

test("the stream stays open while anything listens, through moving between pages, and closes with the last", () => {
  const bar = handlers();
  const solar = handlers();
  const topTen = handlers();
  const barHook = renderHook(() => useLiveStream(bar));
  const solarHook = renderHook(() => useLiveStream(solar));
  solarHook.unmount();
  renderHook(() => useLiveStream(topTen));
  const [stream] = FakeStream.opened;
  expect(FakeStream.opened).toHaveLength(1);
  expect(stream.closed).toBe(false);
  stream.send({ date: "2026-11-08" }, "totals");
  expect(solar.onTotals).not.toHaveBeenCalled();
  expect(topTen.onTotals).toHaveBeenCalledWith("2026-11-08");
  barHook.unmount();
  cleanup();
  expect(stream.closed).toBe(true);
});

test("a part listening after the stream closed opens a new one", () => {
  renderHook(() => useLiveStream(handlers())).unmount();
  renderHook(() => useLiveStream(handlers()));
  expect(FakeStream.opened).toHaveLength(2);
  expect(FakeStream.opened[1].closed).toBe(false);
});
