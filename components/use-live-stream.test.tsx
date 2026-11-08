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
