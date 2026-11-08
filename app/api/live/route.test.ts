import { afterEach, beforeEach, expect, test, vi } from "vitest";

type Listener = (payload: string, channel: string) => void;
const live = vi.hoisted(() => ({ current: null as string | null, listeners: new Set<Listener>() }));

vi.mock("@/lib/live", () => ({
  latest: () => live.current,
  subscribe: (listener: Listener) => {
    live.listeners.add(listener);
    return () => live.listeners.delete(listener);
  },
}));

const { GET } = await import("./route");

const publish = (payload: string, channel = "live_status") => live.listeners.forEach((listener) => listener(payload, channel));

function open() {
  const abort = new AbortController();
  const response = GET(new Request("http://localhost/api/live", { signal: abort.signal }));
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  const read = async () => decoder.decode((await reader.read()).value);
  return { response, read, abort, reader };
}

beforeEach(() => {
  live.current = null;
  live.listeners.clear();
});

afterEach(() => {
  vi.useRealTimers();
});

test("answers 200 as an unbuffered event stream", () => {
  const { response } = open();
  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toBe("text/event-stream");
  expect(response.headers.get("cache-control")).toBe("no-cache, no-transform");
  expect(response.headers.get("x-accel-buffering")).toBe("no");
});

test("writes the retry interval and a comment at once, so the browser sees it open", async () => {
  const { read } = open();
  expect(await read()).toBe("retry: 5000\n: open\n\n");
});

test("sends the latest status first when there is one", async () => {
  live.current = '{"solar_power":2.8}';
  const { read } = open();
  await read();
  expect(await read()).toBe('data: {"solar_power":2.8}\n\n');
});

test("sends each new status as an event", async () => {
  const { read } = open();
  await read();
  publish('{"solar_power":3.1}');
  expect(await read()).toBe('data: {"solar_power":3.1}\n\n');
});

test("sends updated totals as a totals event", async () => {
  const { read } = open();
  await read();
  publish('{"date":"2026-11-07"}', "totals_updated");
  expect(await read()).toBe('event: totals\ndata: {"date":"2026-11-07"}\n\n');
});

test("pings every 25 seconds", async () => {
  vi.useFakeTimers();
  const { read } = open();
  await read();
  vi.advanceTimersByTime(25_000);
  expect(await read()).toBe(": ping\n\n");
});

test("stops listening when the page goes away", async () => {
  const { read, abort } = open();
  await read();
  expect(live.listeners.size).toBe(1);
  abort.abort();
  expect(live.listeners.size).toBe(0);
});

test("a page that cancels its stream before the request aborts raises no error", async () => {
  const { read, abort, reader } = open();
  await read();
  await reader.cancel();
  expect(() => abort.abort()).not.toThrow();
  expect(live.listeners.size).toBe(0);
});
