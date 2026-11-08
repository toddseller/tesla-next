// @vitest-environment jsdom
// The live status and replay parts of anton-tesla-api-ws's ContextProvider, on tesla-next's stream (/api/live) and
// intervals read (/api/intervals). Values from the live-site-status spec's scenarios.
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { applyStatus, EMPTY, useSiteData } from "@/components/scene/use-site-data";

const charging = {
  load_power: 11.3, home_power: 4.1, solar_power: 6.1, grid_power: 2.0, battery_power: 0, battery_percentage: 82,
  battery_status: "Standby", modified: "2026-10-19T12:33:37-07:00",
  vehicle: { name: "R2D2", color: "#C0C4C8", charging_power: 7.2, battery_level: 80, charging_state: "Charging", battery_level_at: "2026-10-19T19:30:00Z" },
  weather: { cover: 0.4, rain: 0, wind: -3.2, windLow: 5, windMid: 8, windHigh: 20, cirrus: 0.1, low: 0.3, mid: 0, sun: 0.9 },
};

test("a live status becomes the page's values", () => {
  const state = applyStatus(EMPTY, charging);
  expect(state).toMatchObject({
    solarPower: 6.1, homePower: 4.1, batteryPower: 0, battery: 82, gridPower: 2.0, vehicle: charging.vehicle, liveReceived: true,
    weatherCover: 0.4, weatherRain: 0, weatherWind: -3.2, weatherWindLow: 5, weatherWindMid: 8, weatherWindHigh: 20,
    weatherCirrus: 0.1, weatherLow: 0.3, weatherMid: 0, weatherSun: 0.9,
  });
  expect(state.modifiedAt).toEqual(new Date("2026-10-19T19:33:37Z"));
});

test("a missing battery reading keeps the last one; no car and no weather are null", () => {
  const before = applyStatus(EMPTY, charging);
  const after = applyStatus(before, { ...charging, battery_percentage: null, vehicle: null, weather: null });
  expect(after.battery).toBe(82);
  expect(after.vehicle).toBeNull();
  expect([after.weatherCover, after.weatherSun]).toEqual([null, null]);
});

test("home power falls back to load power", () => {
  expect(applyStatus(EMPTY, { ...charging, home_power: undefined }).homePower).toBe(11.3);
});

// The stream: each instance the hook opens, and what it has been sent.
class FakeStream {
  static CONNECTING = 0;
  static CLOSED = 2;
  static opened: FakeStream[] = [];
  readyState = FakeStream.CONNECTING;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: (() => void) | null = null;
  listeners: Record<string, (event: MessageEvent) => void> = {};
  closed = false;
  constructor(public url: string) {
    FakeStream.opened.push(this);
  }
  addEventListener(name: string, listener: (event: MessageEvent) => void) {
    this.listeners[name] = listener;
  }
  close() {
    this.closed = true;
  }
  // The browser's own retry after a dropped connection keeps it connecting; an answer other than 200 closes it for good.
  fail(forGood: boolean) {
    this.readyState = forGood ? FakeStream.CLOSED : FakeStream.CONNECTING;
    act(() => this.onerror?.());
  }
  send(data: unknown, name?: string) {
    const event = { data: JSON.stringify(data) } as MessageEvent;
    act(() => (name ? this.listeners[name](event) : this.onmessage!(event)));
  }
}

const day = (date: string, extra = {}) => ({ date, data: [], weather: [], ...extra });
let fetches: string[];
let answers: Record<string, () => Promise<unknown>>;

beforeEach(() => {
  FakeStream.opened = [];
  fetches = [];
  answers = {};
  vi.stubGlobal("EventSource", FakeStream);
  vi.stubGlobal("fetch", (url: string) => {
    fetches.push(url);
    const body = answers[url]?.() ?? Promise.resolve(day(url.slice(-10)));
    return body.then((json) => ({ ok: true, json: () => json }));
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

test("starts from the status the server rendered, before the stream sends anything", () => {
  const { result } = renderHook(() => useSiteData(JSON.stringify(charging)));
  expect(result.current).toMatchObject({ solarPower: 6.1, liveReceived: true });
});

test("without one, starts with nothing received", () => {
  const { result } = renderHook(() => useSiteData(null));
  expect(result.current).toMatchObject({ liveReceived: false, vehicle: null, modifiedAt: null, weatherCover: null });
});

test("each status on the stream updates the values, and the stream closes with the page", () => {
  const { result, unmount } = renderHook(() => useSiteData(null));
  const [stream] = FakeStream.opened;
  expect(stream.url).toBe("/api/live");
  stream.send({ ...charging, solar_power: 3.4 });
  expect(result.current.solarPower).toBe(3.4);
  unmount();
  expect(stream.closed).toBe(true);
});

test("a replay day loads its history, and leaving replay drops it", async () => {
  const { result } = renderHook(() => useSiteData(null));
  act(() => result.current.setReplayDay("2026-10-19"));
  await waitFor(() => expect(result.current.replayData?.date).toBe("2026-10-19"));
  expect(fetches).toEqual(["/api/intervals?date=2026-10-19"]);
  act(() => result.current.setReplayDay(null));
  expect(result.current.replayData).toBeNull();
});

test("new totals for the replayed day reload it; other days' don't", async () => {
  const { result } = renderHook(() => useSiteData(null));
  act(() => result.current.setReplayDay("2026-10-19"));
  await waitFor(() => expect(result.current.replayData).not.toBeNull());
  const [stream] = FakeStream.opened;
  stream.send({ date: "2026-10-18" }, "totals");
  stream.send({ date: "2026-10-19" }, "totals");
  await waitFor(() => expect(fetches).toEqual(["/api/intervals?date=2026-10-19", "/api/intervals?date=2026-10-19"]));
});

test("a slow answer for an earlier day never replaces a later one", async () => {
  let answerFirst = (value: unknown) => {};
  answers["/api/intervals?date=2026-10-18"] = () => new Promise((resolve) => (answerFirst = resolve));
  const { result } = renderHook(() => useSiteData(null));
  act(() => result.current.setReplayDay("2026-10-18"));
  act(() => result.current.setReplayDay("2026-10-19"));
  await waitFor(() => expect(result.current.replayData?.date).toBe("2026-10-19"));
  await act(async () => answerFirst(day("2026-10-18")));
  expect(result.current.replayData?.date).toBe("2026-10-19");
});

test("a stream the browser gives up on, after an answer other than 200, is opened again", () => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  try {
    const { result, unmount } = renderHook(() => useSiteData(null));
    FakeStream.opened[0].fail(true);
    act(() => vi.advanceTimersByTime(5_000));
    expect(FakeStream.opened).toHaveLength(2);
    FakeStream.opened[1].send({ ...charging, solar_power: 2.2 });
    expect(result.current.solarPower).toBe(2.2);
    unmount();
    expect(FakeStream.opened[1].closed).toBe(true);
  } finally {
    vi.useRealTimers();
  }
});

test("a stream the browser is still retrying is left to it", () => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  try {
    renderHook(() => useSiteData(null));
    FakeStream.opened[0].fail(false);
    act(() => vi.advanceTimersByTime(60_000));
    expect(FakeStream.opened).toHaveLength(1);
  } finally {
    vi.useRealTimers();
  }
});
