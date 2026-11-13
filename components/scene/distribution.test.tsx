// @vitest-environment jsdom
// Ported from anton-tesla-api-ws tesla-api-frontend/client/src/pages/Distribution.test.jsx.
import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";

import Distribution, { StaleWarning } from "@/components/scene/distribution";

const STAMP = new Date(2026, 9, 19, 12, 33, 37);
const at = (seconds: number) => new Date(STAMP.getTime() + seconds * 1000);
const warning = (container: Element) => container.querySelector<HTMLElement>('[data-part="stale-warning"]');

// The context the page reads: live values, and the replay day's history.
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- the hook's stand-in, which each test rewrites freely
const context: Record<string, any> = {};
vi.mock("@/components/scene/use-site-data", () => ({ useSiteData: () => context }));
// jsdom has no WebGL; the clouds' renderer is a stand-in that records what it is asked to draw.
const cloudRenderer = vi.hoisted(() => ({ bake: vi.fn(), draw: vi.fn(), dispose: vi.fn() }));
vi.mock("@/components/scene/cloud-renderer", () => ({ createCloudRenderer: () => cloudRenderer }));

const FLOW_KEYS = ["solar_to_home", "solar_to_vehicle", "solar_to_powerwall", "solar_to_grid", "powerwall_to_home",
  "powerwall_to_vehicle", "powerwall_to_grid", "grid_to_home", "grid_to_vehicle", "grid_to_powerwall"];
// A day's history from `from` to `to` (hours, PDT), solar to home at 3.0 kW and the battery at 60%.
const history = (from: number, to: number, date = "2026-10-19") => ({
  date,
  data: Array.from({ length: Math.round((to - from) * 12) }, (_, i) => {
    const minutes = from * 60 + i * 5;
    const time = `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
    return {
      start: `${date}T${time}:00-07:00`,
      ...Object.fromEntries(FLOW_KEYS.map((key) => [`${key}_kw`, key === "solar_to_home" ? 3.0 : 0])),
      battery_percentage: 60,
      vehicle: null,
    };
  }),
});

beforeEach(() => {
  Object.keys(context).forEach((key) => delete context[key]);
  Object.assign(context, {
    solarPower: 6.1, homePower: 4.1, batteryPower: 0, battery: 100, gridPower: 2.0, liveReceived: true,
    modified: "12:33 PM", modifiedAt: new Date(2026, 9, 19, 12, 33, 37),
    vehicle: { name: "R2D2", color: "#C0C4C8", charging_power: 0, battery_level: 80, battery_level_at: new Date().toISOString() },
    setReplayDay: vi.fn(),
    replayData: history(17, 20),
  });
});

afterEach(() => {
  vi.useRealTimers();
  // anton's Vitest removed each render with its globals; this one is told to.
  cleanup();
});

// The page reads its address from the server's search parameters and rewrites it in place, as a visitor sees it.
const location = window.location;
const page = (entry = "/distribution") => {
  window.history.replaceState(null, "", entry);
  const search = Object.fromEntries(new URL(entry, location.origin).searchParams);
  return render(<Distribution initialStatus={null} search={search} />).container;
};

test("renders the live scene from context, with no update line while data is fresh", () => {
  vi.useFakeTimers({ now: at(14) });
  const container = page();

  expect(warning(container)).toBeNull();
  expect(container.textContent).not.toContain("Updated");
  expect(container.querySelector<HTMLElement>('[data-part="label-car"]')).not.toBeNull();
  expect(container.textContent).toContain("R2D2");
  expect(container.textContent).toContain("0 kW · 80%");
});

test("darkens toward night through dusk while the page is open, with no live update", () => {
  // 6:28:00 PM in Half Moon Bay; sunset is 6:28:45 PM on 2026-10-19.
  vi.useFakeTimers({ now: new Date("2026-10-20T01:28:00Z") });
  const container = page();
  const day = () => Number(container.querySelector<HTMLElement>('[data-part="scene"]')!.style.getPropertyValue("--day"));
  const before = day();

  act(() => vi.advanceTimersByTime(60000));
  expect(day()).toBeLessThan(before);
  expect(day()).toBeGreaterThan(0);
});

describe("weather", () => {
  // The south faces' sunlight, which cloud fades to nothing.
  const sun = (container: Element) => Number(container.querySelector<HTMLElement>('[data-part="sun-south"]')!.style.opacity);

  test("the live scene takes the latest reading's cover", () => {
    vi.useFakeTimers({ now: new Date("2026-10-20T20:00:00Z") }); // 1 PM
    expect(sun(page())).toBeGreaterThan(0.3);

    context.weatherCover = 1;
    expect(sun(page())).toBe(0);
  });

  test("the weather isn't known before the first live status, so nothing fades in from a clear sky", () => {
    vi.useFakeTimers({ now: new Date("2026-10-20T20:00:00Z"), toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "requestAnimationFrame", "cancelAnimationFrame", "Date"] });
    const eased = (container: Element) => container.querySelector<HTMLElement>('[data-part="scene"]')!.classList.contains("scene-eased");
    context.liveReceived = false;
    context.weatherCover = null;
    const waiting = page();
    act(() => vi.advanceTimersByTime(100));
    expect(eased(waiting)).toBe(false);

    context.liveReceived = true;
    const received = page();
    act(() => vi.advanceTimersByTime(100));
    expect(eased(received)).toBe(true);
  });

  // How much of the far rain layer shows: 0 dry, 0.35 + 1.3 x rain otherwise, up to 1.
  const rain = (container: Element) => Number(container.querySelector<HTMLElement>('[data-part="rain-far"]')!.style.opacity);
  const gray = (container: Element) => Number(container.querySelector<HTMLElement>('[data-part="sky-gray"]')!.style.opacity);

  test("the live scene takes the latest reading's rain", () => {
    vi.useFakeTimers({ now: new Date("2026-10-20T20:00:00Z") });
    expect(rain(page())).toBe(0);

    Object.assign(context, { weatherCover: 1, weatherRain: 0.2 });
    expect(rain(page())).toBeCloseTo(0.61);
  });

  test("a replay takes the replayed time's rain, blended between readings", () => {
    vi.useFakeTimers({ now: new Date("2026-10-20T18:00:00Z") });
    context.replayData = {
      ...history(12, 14, "2026-10-19"),
      weather: [{ start: "2026-10-19T12:00:00-07:00", cover: 1, rain: 0 }, { start: "2026-10-19T14:00:00-07:00", cover: 1, rain: 0.4 }],
    };

    expect(rain(page("/distribution?at=2026-10-19T13:00"))).toBeCloseTo(0.61);
  });

  const tilt = (container: Element) => container.querySelector<HTMLElement>('[data-part="rain-tilt"]')!.style.transform;

  test("the wind reaches the scene, live and in replay", () => {
    vi.useFakeTimers({ now: new Date("2026-10-20T18:00:00Z") });
    Object.assign(context, { weatherCover: 1, weatherRain: 0.5, weatherWind: -10 });
    expect(tilt(page())).toBe("skewX(-12deg)");

    context.replayData = {
      ...history(12, 14, "2026-10-19"),
      weather: [{ start: "2026-10-19T12:00:00-07:00", cover: 1, rain: 0.5, wind: 0 }, { start: "2026-10-19T14:00:00-07:00", cover: 1, rain: 0.5, wind: 20 }],
    };
    expect(tilt(page("/distribution?at=2026-10-19T13:00"))).toBe("skewX(12deg)");
  });

  // The share of a cloud layer the scene hands its canvas, as of the next frame.
  const drawn = (layer: string) => () => {
    act(() => vi.advanceTimersByTime(50));
    return cloudRenderer.draw.mock.calls.at(-1)![0].shares[layer];
  };
  // How far each layer drifts in 10 seconds, in scene widths, once eased.
  const drifts = () => {
    act(() => vi.advanceTimersByTime(3000));
    const before = cloudRenderer.draw.mock.calls.at(-1)![1];
    act(() => vi.advanceTimersByTime(10000));
    return cloudRenderer.draw.mock.calls.at(-1)![1].map((after: number, i: number) => ((after - before[i] + 1.5) % 1) - 0.5);
  };
  const lowCut = drawn("low");
  const cirrusCut = drawn("cirrus");

  test("the high cloud share reaches the scene, live and in replay", () => {
    vi.useFakeTimers({ now: new Date("2026-10-20T20:00:00Z") });
    Object.assign(context, { weatherCover: 0.2, weatherRain: 0, weatherWind: 0, weatherCirrus: 0.8, weatherLow: 0, weatherMid: 0 });
    page();
    expect(cirrusCut()).toBeCloseTo(0.8, 6);

    context.replayData = {
      ...history(12, 14, "2026-10-19"),
      weather: [{ start: "2026-10-19T12:00:00-07:00", cover: 0.45, rain: 0, wind: 0, cirrus: 0.4, low: 0, mid: 0 },
        { start: "2026-10-19T14:00:00-07:00", cover: 0.45, rain: 0, wind: 0, cirrus: 0.8, low: 0, mid: 0 }],
    };
    page("/distribution?at=2026-10-19T13:00");
    expect(cirrusCut()).toBeCloseTo(0.6, 6);
  });

  // The low clouds follow the low share, not the weighted cover, which also counts the mid cloud.
  // Live readings arrive every 15 minutes; each is walked in over about 5 minutes.
  describe("live weather walks to each new reading", () => {
    const MINUTE = 60000;
    // The walk reads only the time elapsed, so jump the clock and run one of its 1-second
    // steps, not every second and animation frame on the way (seconds a test on the server).
    const pass = (ms: number) => act(() => { vi.setSystemTime(Date.now() + ms - 1000); vi.advanceTimersByTime(1000); });
    const reading = (low: number, extra = {}) => ({ weatherCover: low, weatherRain: 0, weatherWind: 0, weatherCirrus: 0, weatherLow: low, weatherMid: 0, weatherSun: null, ...extra });
    const livePage = (entry = "/distribution") => {
      window.history.replaceState(null, "", entry);
      const search = Object.fromEntries(new URL(entry, location.origin).searchParams);
      const tree = () => <Distribution initialStatus={null} search={search} />;
      const { container, rerender } = render(tree());
      return { container, update: (fields: Record<string, unknown>) => { Object.assign(context, fields); rerender(tree()); } };
    };
    beforeEach(() => vi.useFakeTimers({ now: new Date("2026-10-20T20:00:00Z") }));

    test("the first weather shows at once", () => {
      Object.assign(context, reading(0.9));
      livePage();
      expect(lowCut()).toBeCloseTo(0.9, 6);
    });

    test("a new reading is halfway after 2.5 minutes and there after 5", () => {
      Object.assign(context, reading(0.9));
      const { update } = livePage();
      lowCut();
      update(reading(0.2));
      expect(lowCut()).toBeGreaterThan(0.85);
      pass(2.5 * MINUTE);
      expect(lowCut()).toBeCloseTo(0.55, 1);
      pass(2.5 * MINUTE);
      expect(lowCut()).toBeCloseTo(0.2, 6);
    });

    test("a reading arriving partway walks on from where the sky is", () => {
      Object.assign(context, reading(0.9));
      const { update } = livePage();
      update(reading(0.2));
      pass(2 * MINUTE);
      const shown = lowCut();
      expect(shown).toBeCloseTo(0.62, 1);
      update(reading(0.5));
      pass(2.5 * MINUTE);
      expect(lowCut()).toBeCloseTo((shown + 0.5) / 2, 1);
    });

    test("a missing sunshine walks as none", () => {
      Object.assign(context, reading(0.9));
      const { update } = livePage();
      update(reading(0.9, { weatherSun: 1 }));
      pass(2.5 * MINUTE);
      // Sunshine of 0.5, halfway from none: a cap of 0.3 + 0.7 * (0.8 - 0.5) / 0.4.
      expect(lowCut()).toBeCloseTo(0.825, 2);
    });

    // Everything that follows the weather walks together: one walk, upstream of the scene.
    const sunlight = (container: Element) => Math.max(...[...container.querySelectorAll<HTMLElement>(".scene-sun")].map((el) => Number(el.style.opacity) || 0));
    const rainFar = (container: Element) => Number(container.querySelector<HTMLElement>('[data-part="rain-far"]')!.style.opacity);
    // The sunlight on the house under each reading, shown at once as the first weather.
    const sunlightUnder = (low: number) => {
      Object.assign(context, reading(low));
      const { container } = render(<Distribution initialStatus={null} search={{}} />);
      lowCut();
      const shown = sunlight(container);
      cleanup();
      return shown;
    };

    test.each([["", false], [" under reduced motion", true]])("clouds, gray sky and sunlight on the house are each halfway after 2.5 minutes%s", (_, reduced) => {
      const original = window.matchMedia;
      if (reduced) window.matchMedia = ((query: string) => ({ matches: query === "(prefers-reduced-motion: reduce)", addEventListener: () => {}, removeEventListener: () => {} })) as unknown as typeof window.matchMedia;
      try {
        const before = sunlightUnder(0.9), after = sunlightUnder(0.2);
        Object.keys(context).filter((k) => k.startsWith("weather")).forEach((k) => delete context[k]);
        Object.assign(context, reading(0.9));
        const { container, update } = livePage();
        update(reading(0.2));
        pass(2.5 * MINUTE);
        expect(lowCut()).toBeCloseTo(0.55, 1);
        // The gray sky: (low - 0.4) / 0.5, from 1 to 0.
        expect(gray(container)).toBeCloseTo(0.3, 1);
        expect(sunlight(container)).toBeCloseTo((before + after) / 2, 2);
        expect(after).toBeGreaterThan(before);
      } finally {
        window.matchMedia = original;
      }
    });

    test("rain fades in over the same 5 minutes", () => {
      Object.assign(context, reading(0.9));
      const { container, update } = livePage();
      update(reading(0.9, { weatherRain: 0.4 }));
      pass(2.5 * MINUTE);
      lowCut();
      // Rain of 0.2, halfway: the far streaks at 0.35 + 1.3 * 0.2.
      expect(rainFar(container)).toBeCloseTo(0.61, 2);
      pass(2.5 * MINUTE);
      lowCut();
      expect(rainFar(container)).toBeCloseTo(0.87, 2);
    });

    test("the winds at the clouds' heights walk with the rest", () => {
      Object.assign(context, reading(0.4, { weatherWindLow: 30, weatherWindHigh: 0 }));
      const { update } = livePage();
      update(reading(0.4, { weatherWindLow: 90, weatherWindHigh: 94 }));
      // The 10 seconds measured are centered on the walk's halfway point.
      pass(2.5 * MINUTE - 8000);
      const [high, , low] = drifts();
      expect(low).toBeCloseTo((10 * 60) / 1.5 / 14400, 3);
      expect(high).toBeCloseTo((10 * 47) / 9.4 / 14400, 3);
    });

    test("weather in the address shows at once, over the walk", () => {
      Object.assign(context, reading(0.9));
      const { update } = livePage("/distribution?low=0.1");
      expect(lowCut()).toBeCloseTo(0.1, 6);
      update(reading(0.2, { weatherCirrus: 0.6 }));
      expect(lowCut()).toBeCloseTo(0.1, 6);
      pass(2.5 * MINUTE);
      expect(cirrusCut()).toBeCloseTo(0.3, 1);
    });
  });

  test("in replay each band drifts by the replayed time's blend of its wind", () => {
    vi.useFakeTimers({ now: new Date("2026-10-20T20:00:00Z") });
    context.replayData = {
      ...history(12, 14, "2026-10-19"),
      weather: [{ start: "2026-10-19T12:00:00-07:00", cover: 0.4, rain: 0, wind: 0, windLow: -20, windHigh: 0, cirrus: 0.4, low: 0.4, mid: 0 },
        { start: "2026-10-19T14:00:00-07:00", cover: 0.4, rain: 0, wind: 0, windLow: -40, windHigh: 94, cirrus: 0.4, low: 0.4, mid: 0 }],
    };
    page("/distribution?at=2026-10-19T13:00");
    // Paused clouds hold still; played in real time the blend barely moves while measured.
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    const [cirrus, , low] = drifts();
    expect(low).toBeCloseTo((10 * -30) / 1.5 / 14400, 3);
    expect(cirrus).toBeCloseTo((10 * 47) / 9.4 / 14400, 3);
  });

  // Rain arrives without the split: replayed, it must draw as a full low deck, not a clear sky.
  test("a rainy stretch replays as a full deck, blending into it from a reading with the split", () => {
    vi.useFakeTimers({ now: new Date("2026-10-22T20:00:00Z") });
    const rainy = (start: string) => ({ start, cover: 1, rain: 0.4, wind: 0, cirrus: null, low: null, mid: null });
    context.replayData = {
      ...history(5, 8, "2026-10-22"),
      weather: [{ start: "2026-10-22T05:00:00-07:00", cover: 0.6, rain: 0, wind: 0, cirrus: 0, low: 0.6, mid: 0 },
        rainy("2026-10-22T05:30:00-07:00"), rainy("2026-10-22T05:45:00-07:00")],
    };
    const container = page("/distribution?at=2026-10-22T05:40");
    expect(lowCut()).toBeCloseTo(1, 6);
    expect(gray(container)).toBe(1);

    page("/distribution?at=2026-10-22T05:15");
    expect(lowCut()).toBeCloseTo(0.8, 6);
  });

  test("the low and mid cloud shares reach the scene, live and in replay", () => {
    vi.useFakeTimers({ now: new Date("2026-10-20T20:00:00Z") });
    Object.assign(context, { weatherCover: 0.5, weatherRain: 0, weatherWind: 0, weatherCirrus: 0, weatherLow: 0.2, weatherMid: 0.5 });
    page();
    expect(lowCut()).toBeCloseTo(0.2, 6);

    context.replayData = {
      ...history(12, 14, "2026-10-19"),
      weather: [{ start: "2026-10-19T12:00:00-07:00", cover: 0.6, rain: 0, wind: 0, cirrus: 0, low: 0.1, mid: 0.5 },
        { start: "2026-10-19T14:00:00-07:00", cover: 0.6, rain: 0, wind: 0, cirrus: 0, low: 0.3, mid: 0.5 }],
    };
    page("/distribution?at=2026-10-19T13:00");
    expect(lowCut()).toBeCloseTo(0.2, 6);
  });

  test("the roof's sunshine reaches the scene, live, in replay and from the address", () => {
    vi.useFakeTimers({ now: new Date("2026-10-20T19:00:00Z") });
    Object.assign(context, { weatherCover: 0.62, weatherRain: 0, weatherWind: 0, weatherCirrus: 0, weatherLow: 0.62, weatherMid: 0 });
    expect(gray(page())).toBeGreaterThan(0.4);
    context.weatherSun = 1;
    expect(gray(page())).toBe(0);

    const reading = { cover: 0.62, rain: 0, wind: 0, cirrus: 0, low: 0.62, mid: 0, sun: 1 };
    context.replayData = {
      ...history(12, 14, "2026-10-19"),
      weather: [{ start: "2026-10-19T12:00:00-07:00", ...reading }, { start: "2026-10-19T14:00:00-07:00", ...reading }],
    };
    expect(gray(page("/distribution?at=2026-10-19T13:00"))).toBe(0);

    context.weatherSun = null;
    expect(gray(page("/distribution?cover=0.62&low=0.62&sun=1"))).toBe(0);
  });

  test("in development the address can set the cloud shares", () => {
    vi.useFakeTimers({ now: new Date("2026-10-20T20:00:00Z") });

    page("/distribution?cover=0.2&cirrus=0.8&low=0&mid=0");
    expect(cirrusCut()).toBeCloseTo(0.8, 6);
    page("/distribution?cover=0.6&low=0.2&mid=0.5");
    expect(lowCut()).toBeCloseTo(0.2, 6);
    page("/distribution?cover=0.2");
    expect(lowCut()).toBeCloseTo(0.2, 6);
  });

  test("in development the address can set the wind too", () => {
    vi.useFakeTimers({ now: new Date("2026-10-20T20:00:00Z") });

    expect(tilt(page("/distribution?cover=1&rain=1&wind=-80"))).toBe("skewX(-30deg)");
  });

  test("in development the address can set the weather", () => {
    vi.useFakeTimers({ now: new Date("2026-10-20T20:00:00Z") });
    const container = page("/distribution?cover=1&rain=0.7");

    expect(gray(container)).toBe(1);
    expect(rain(container)).toBe(1);
  });

  test("in development the address can set each band's wind and the pace", () => {
    vi.useFakeTimers({ now: new Date("2026-10-20T20:00:00Z") });
    Object.assign(context, { weatherCover: 0.4, weatherLow: 0.4, weatherWindLow: 30, weatherWindMid: 30, weatherWindHigh: 30 });

    page("/distribution?windLow=-10&windMid=40&windHigh=60");
    const [high, mid, low] = drifts();
    expect(low).toBeCloseTo((10 * -10) / 1.5 / 14400, 4);
    expect(mid).toBeCloseTo((10 * 40) / 3 / 14400, 4);
    expect(high).toBeCloseTo((10 * 60) / 9.4 / 14400, 4);

    cleanup();
    page("/distribution?windLow=-10&windMid=40&windHigh=60&drift=2");
    expect(drifts().slice(0, 3)).toEqual([2 * high, 2 * mid, 2 * low].map((v) => expect.closeTo(v, 5)));
  });

  test("a production build ignores the address's band winds and pace", () => {
    vi.useFakeTimers({ now: new Date("2026-10-20T20:00:00Z") });
    Object.assign(context, { weatherCover: 0.4, weatherLow: 0.4, weatherWindLow: 30 });
    vi.stubEnv("NODE_ENV", "production");
    try {
      page("/distribution?windLow=-10&drift=2");
      expect(drifts()[2]).toBeCloseTo((10 * 30) / 1.5 / 14400, 4);
    } finally {
      vi.unstubAllEnvs();
    }
  });

  test("a production build ignores the address's weather", () => {
    vi.useFakeTimers({ now: new Date("2026-10-20T20:00:00Z") });
    vi.stubEnv("NODE_ENV", "production");
    const container = page("/distribution?cover=1&rain=0.7");
    vi.unstubAllEnvs();

    expect(gray(container)).toBe(0);
    expect(rain(container)).toBe(0);
  });

  test("a replay takes the replayed time's stored weather, blended between readings", () => {
    vi.useFakeTimers({ now: new Date("2026-10-20T18:00:00Z") });
    const day = history(12, 14, "2026-10-19");
    const replayAt = (weather: unknown[]) => {
      context.replayData = { ...day, weather };
      return sun(page("/distribution?at=2026-10-19T13:00"));
    };

    const clear = replayAt([]);
    // Halfway from 0.6 to 1: 0.8 of the sky clouded, 0.2 of the clear light left.
    const cloudy = replayAt([{ start: "2026-10-19T12:00:00-07:00", cover: 0.6 }, { start: "2026-10-19T14:00:00-07:00", cover: 1 }]);

    expect(clear).toBeGreaterThan(0.3);
    expect(cloudy).toBeCloseTo(0.2 * clear, 3);
  });
});

describe("replay", () => {
  // 11 AM on 2026-10-20 at the site.
  const NOW = new Date("2026-10-20T18:00:00Z");
  const time = (container: Element) => container.querySelector<HTMLElement>('[data-part="replay-time"]')!.textContent;
  const label = (container: Element, name: string) => container.querySelector<HTMLElement>(`[data-part="label-${name}"]`)!.textContent;
  const live = () => screen.getByRole("button", { name: "LIVE" }).getAttribute("aria-pressed");
  const pdt = (clock: string) => Date.parse(`2026-10-19T${clock}:00-07:00`);

  beforeEach(() => vi.useFakeTimers({ now: NOW }));

  test("the page opens live, with the bar at now", () => {
    const container = page();

    expect(live()).toBe("true");
    expect(time(container)).toBe("11:00 AM");
    expect(context.setReplayDay).toHaveBeenLastCalledWith(null);
  });

  test("scrubbing replays that time from history", () => {
    const container = page();
    fireEvent.click(screen.getByRole("button", { name: "Previous day" }));
    fireEvent.change(screen.getByRole("slider", { name: "Time" }), { target: { value: String(pdt("18:35")) } });

    expect(live()).toBe("false");
    expect(context.setReplayDay).toHaveBeenLastCalledWith("2026-10-19");
    expect(time(container)).toBe("6:35 PM");
    expect(label(container, "solar")).toBe("SOLAR3.0 kW");
    expect(label(container, "powerwall")).toBe("POWERWALL0 kW · 60%");
  });

  // Replay minutes per second.
  const speed = (minutes: number) => fireEvent.change(screen.getByRole("combobox", { name: "Speed" }), { target: { value: String(minutes * 60) } });

  test("starts at real time", () => {
    const container = page("/distribution?at=2026-10-19T18:00");
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    act(() => vi.advanceTimersByTime(60000));

    expect(time(container)).toBe("6:01 PM");
  });

  // Today's history ends in a step with a battery reading whose flows Tesla hasn't published yet.
  const todayToHalfPast = () => {
    const today = history(10, 10.5, "2026-10-20");
    today.data.push({ ...Object.fromEntries(FLOW_KEYS.map((key) => [`${key}_kw`, null])),
      start: "2026-10-20T10:30:00-07:00", battery_percentage: 61, vehicle: null });
    return today;
  };

  test("playing into the end of today returns to live", () => {
    context.replayData = todayToHalfPast();
    const container = page("/distribution?at=2026-10-20T10:20");
    speed(10);
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    act(() => vi.advanceTimersByTime(3000));

    expect(live()).toBe("true");
    expect(label(container, "solar")).toBe("SOLAR6.1 kW");
    expect(time(container)).toBe("11:00 AM");
    expect(location.search).toBe("");
    expect(screen.getByRole("button", { name: "Play" })).toBeTruthy();
  });

  test("paused at the end of today stays in replay, and a reload extends it", () => {
    context.replayData = todayToHalfPast();
    const container = page("/distribution?at=2026-10-20T10:29");
    act(() => vi.advanceTimersByTime(3000));
    expect(live()).toBe("false");
    expect(time(container)).toBe("10:29 AM");

    // New steps' arrival; the page's minute clock re-renders it in, and playing runs on into them.
    context.replayData = history(10, 10.75, "2026-10-20");
    act(() => vi.advanceTimersByTime(60000));
    speed(1);
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    act(() => vi.advanceTimersByTime(3000));
    expect(live()).toBe("false");
    expect(time(container)).toBe("10:32 AM");
  });

  test("the Replay tag shows over the scene only while replaying", () => {
    const container = page("/distribution?at=2026-10-19T18:00");
    expect(container.querySelector<HTMLElement>('[data-part="replay-tag"]')!.textContent).toBe("REPLAY");

    fireEvent.click(screen.getByRole("button", { name: "LIVE" }));
    expect(container.querySelector<HTMLElement>('[data-part="replay-tag"]')).toBeNull();
  });

  test("plays at 10 replay minutes per second", () => {
    const container = page("/distribution?at=2026-10-19T18:00");
    speed(10);
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    act(() => vi.advanceTimersByTime(3000));

    expect(time(container)).toBe("6:30 PM");
  });

  test("pauses at the end of the day's data", () => {
    context.replayData = history(18, 19);
    const container = page("/distribution?at=2026-10-19T18:40");
    speed(10);
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    act(() => vi.advanceTimersByTime(3000));

    expect(time(container)).toBe("6:59 PM");
    expect(screen.getByRole("button", { name: "Play" })).toBeTruthy();
  });

  test("LIVE returns to live status and drops the moment from the address", () => {
    const container = page("/distribution?at=2026-10-19T18:35");
    fireEvent.click(screen.getByRole("button", { name: "LIVE" }));

    expect(live()).toBe("true");
    expect(label(container, "solar")).toBe("SOLAR6.1 kW");
    expect(location.search).toBe("");
  });

  test("no stale warning while replaying; it returns on LIVE", () => {
    const container = page("/distribution?at=2026-10-19T18:35");
    expect(warning(container)).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "LIVE" }));
    expect(warning(container)).not.toBeNull();
  });

  test("a shared link opens paused at its moment", () => {
    const container = page("/distribution?at=2026-10-19T18:35");

    expect(time(container)).toBe("6:35 PM");
    expect(screen.getByRole("button", { name: "Play" })).toBeTruthy();
    expect(context.setReplayDay).toHaveBeenLastCalledWith("2026-10-19");
  });

  test("a link that isn't a moment to replay opens live", () => {
    page("/distribution?at=2031-01-01T12:00");

    expect(live()).toBe("true");
    expect(location.search).toBe("");
  });

  test("the address follows a pause, not play", () => {
    page("/distribution?at=2026-10-19T18:00");
    speed(10);
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    act(() => vi.advanceTimersByTime(1000));
    expect(new URLSearchParams(location.search).get("at")).toBe("2026-10-19T18:00");

    fireEvent.click(screen.getByRole("button", { name: "Pause" }));
    expect(new URLSearchParams(location.search).get("at")).toBe("2026-10-19T18:10");
  });
});

describe("replay bar shown on demand", () => {
  const NOW = new Date("2026-10-20T18:00:00Z");
  const shown = (container: Element) => container.querySelector<HTMLElement>('[data-part="replay-drawer"]')!.getAttribute("data-shown");
  const scene = (container: Element) => container.querySelector<HTMLElement>('[data-part="scene"]')!;
  const wait = (ms: number) => act(() => vi.advanceTimersByTime(ms));
  // React's pointer enter and leave come from pointerover and pointerout.
  const pointer = (type: "pointerMove" | "pointerDown" | "pointerEnter" | "pointerLeave" | "pointerOver" | "pointerOut", element: Element, pointerType: string) => fireEvent[type](element, { pointerType });

  beforeEach(() => vi.useFakeTimers({ now: NOW }));

  test("shows on load, then hides", () => {
    const container = page();
    expect(shown(container)).toBe("true");
    wait(2900);
    expect(shown(container)).toBe("true");
    wait(200);
    expect(shown(container)).toBe("false");
  });

  test("a moving mouse shows it; resting on the scene, it hides", () => {
    const container = page();
    wait(5000);
    pointer("pointerMove", scene(container), "mouse");
    expect(shown(container)).toBe("true");
    wait(2000);
    pointer("pointerMove", scene(container), "mouse");
    wait(2900);
    expect(shown(container)).toBe("true");
    wait(200);
    expect(shown(container)).toBe("false");
  });

  test("a mouse resting on the bar keeps it shown, until a while after it leaves", () => {
    const container = page();
    const bar = container.querySelector<HTMLElement>('[data-part="replay-bar"]')!;
    pointer("pointerOver", bar, "mouse");
    wait(10000);
    expect(shown(container)).toBe("true");
    pointer("pointerOut", bar, "mouse");
    wait(2900);
    expect(shown(container)).toBe("true");
    wait(200);
    expect(shown(container)).toBe("false");
  });

  test("a tap shows it for a while; touch is no hover", () => {
    const container = page();
    wait(5000);
    pointer("pointerMove", scene(container), "touch");
    pointer("pointerDown", scene(container), "touch");
    expect(shown(container)).toBe("true");
    wait(3100);
    expect(shown(container)).toBe("false");
  });

  test("a hold keeps it shown, until a while after release", () => {
    const container = page();
    const slider = screen.getByRole("slider", { name: "Time" });
    pointer("pointerDown", slider, "touch");
    wait(10000);
    expect(shown(container)).toBe("true");
    fireEvent.pointerUp(window);
    wait(2900);
    expect(shown(container)).toBe("true");
    wait(200);
    expect(shown(container)).toBe("false");
  });

  test("hidden, its controls stay in the tab order", () => {
    const container = page();
    wait(5000);
    expect(shown(container)).toBe("false");
    const play = screen.getByRole("button", { name: "Play" });
    play.focus();
    expect(document.activeElement).toBe(play);
  });

  test("a paused replay keeps it shown; playing hides it after a while", () => {
    const container = page("/distribution?at=2026-10-19T18:00");
    wait(10000);
    expect(shown(container)).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    wait(2900);
    expect(shown(container)).toBe("true");
    wait(200);
    expect(shown(container)).toBe("false");
  });
});

describe("progress line", () => {
  const line = (container: Element) => container.querySelector<HTMLElement>('[data-part="progress-line"]');
  const fill = (container: Element) => line(container)!.firstChild as HTMLElement;
  const wait = (ms: number) => act(() => vi.advanceTimersByTime(ms));

  test("live at 6 PM: three quarters, in red, once the bar hides", () => {
    // 6:00 PM on 2026-10-19 at the site.
    vi.useFakeTimers({ now: new Date("2026-10-20T01:00:00Z") });
    const container = page();
    expect(line(container)).toBeNull();
    wait(3100);
    expect(fill(container).style.width).toBe("75%");
    expect(fill(container).className).toContain("bg-[rgb(204,0,0)]");
  });

  test("a replay playing from 6 AM: a quarter, in white", () => {
    vi.useFakeTimers({ now: new Date("2026-10-20T18:00:00Z") });
    const container = page("/distribution?at=2026-10-19T06:00");
    wait(5000);
    expect(line(container)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    wait(3100);
    expect(fill(container).style.width).toMatch(/^25\.00/);
    expect(fill(container).className).toContain("bg-white");
  });
});

describe("stale warning", () => {
  test("nothing before the first live update", () => {
    const { container } = render(<StaleWarning liveReceived={false} modifiedAt={null} />);

    expect(container.innerHTML).toBe("");
  });

  test("nothing while updates arrive", () => {
    vi.useFakeTimers({ now: at(38) });
    const { container } = render(<StaleWarning liveReceived modifiedAt={STAMP} />);

    expect(container.innerHTML).toBe("");
  });

  test("appears in amber when updates stop, with the last update's time on hover", () => {
    vi.useFakeTimers({ now: at(115) });
    const { container } = render(<StaleWarning liveReceived modifiedAt={STAMP} />);

    expect(warning(container)).toBeNull();
    act(() => vi.advanceTimersByTime(75000));

    const line = screen.getByText("No update for 3 min");
    expect(line.className).toContain("text-amber-500");
    expect(line.getAttribute("title")).toBe("Last update 12:33:37 PM");
  });

  test("disappears when a fresh update arrives", () => {
    vi.useFakeTimers({ now: at(190) });
    const { container, rerender } = render(<StaleWarning liveReceived modifiedAt={STAMP} />);
    expect(warning(container)).not.toBeNull();

    rerender(<StaleWarning liveReceived modifiedAt={at(185)} />);

    expect(warning(container)).toBeNull();
  });

  test("the timer stops when the page is left", () => {
    vi.useFakeTimers({ now: at(14) });
    const { unmount } = render(<StaleWarning liveReceived modifiedAt={STAMP} />);

    expect(vi.getTimerCount()).toBe(1);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe("weather vane readout", () => {
  const vane = () => screen.getByRole("button", { name: /^Wind:/ });
  const gale = { weatherCover: 0.4, weatherRain: 0, weatherWind: 20.5, weatherWindSpeed: 29, weatherWindGusts: 56, weatherWindDirection: 225 };

  test("tapping the vane shows the live wind, and tapping elsewhere closes it", () => {
    vi.useFakeTimers({ now: new Date("2026-10-20T20:00:00Z") });
    Object.assign(context, gale);
    page();
    act(() => fireEvent.click(vane()));
    expect(screen.getByRole("dialog").textContent).toBe("18 mph, gusts 35 mph, from SW");
    act(() => vi.advanceTimersByTime(0)); // Radix listens for a tap outside from the next tick
    act(() => { fireEvent.pointerDown(document.body); fireEvent.click(document.body); });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  test("Escape closes it, and the vane is a button the keyboard reaches", () => {
    vi.useFakeTimers({ now: new Date("2026-10-20T20:00:00Z") });
    Object.assign(context, gale);
    page();
    vane().focus();
    expect(document.activeElement).toBe(vane());
    act(() => fireEvent.click(vane()));
    act(() => fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  test("without a wind reading it says so", () => {
    vi.useFakeTimers({ now: new Date("2026-10-20T20:00:00Z") });
    Object.assign(context, { weatherCover: 0.4 });
    page();
    act(() => fireEvent.click(vane()));
    expect(screen.getByRole("dialog").textContent).toBe("No wind reading");
  });

  test("in replay it shows the replayed reading, through north", () => {
    vi.useFakeTimers({ now: new Date("2026-10-20T18:00:00Z") });
    Object.assign(context, gale);
    context.replayData = {
      ...history(12, 14, "2026-10-19"),
      weather: [{ start: "2026-10-19T12:00:00-07:00", cover: 0.4, windSpeed: 20, windGusts: 30, windDirection: 340 },
        { start: "2026-10-19T14:00:00-07:00", cover: 0.4, windSpeed: 40, windGusts: 70, windDirection: 20 }],
    };
    page("/distribution?at=2026-10-19T13:00");
    expect(vane().getAttribute("aria-label")).toBe("Wind: 19 mph, gusts 31 mph, from N");
  });

  test("in replay a day without readings has no wind reading", () => {
    vi.useFakeTimers({ now: new Date("2026-10-20T18:00:00Z") });
    Object.assign(context, gale);
    context.replayData = { ...history(12, 14, "2026-10-19"), weather: [] };
    page("/distribution?at=2026-10-19T13:00");
    expect(vane().getAttribute("aria-label")).toBe("Wind: No wind reading");
  });

  test("live, the readout gives the latest reading at once, even without gusts", () => {
    vi.useFakeTimers({ now: new Date("2026-10-20T20:00:00Z") });
    Object.assign(context, { ...gale, weatherWindSpeed: 20, weatherWindGusts: null, weatherWindDirection: 270 });
    const tree = () => <Distribution initialStatus={null} search={{}} />;
    window.history.replaceState(null, "", "/distribution");
    const { rerender } = render(tree());
    Object.assign(context, { weatherWindSpeed: 40 });
    rerender(tree());
    act(() => { vi.setSystemTime(Date.now() + 60000 - 1000); vi.advanceTimersByTime(1000); });
    expect(vane().getAttribute("aria-label")).toBe("Wind: 25 mph from W");
  });

  test("live, a new direction isn't walked the long way round", () => {
    vi.useFakeTimers({ now: new Date("2026-10-20T20:00:00Z") });
    Object.assign(context, { ...gale, weatherWindSpeed: 20, weatherWindGusts: 30, weatherWindDirection: 350 });
    const tree = () => <Distribution initialStatus={null} search={{}} />;
    window.history.replaceState(null, "", "/distribution");
    const { rerender } = render(tree());
    Object.assign(context, { weatherWindSpeed: 40, weatherWindGusts: 70, weatherWindDirection: 10 });
    rerender(tree());
    act(() => { vi.setSystemTime(Date.now() + 2.5 * 60000 - 1000); vi.advanceTimersByTime(1000); });
    // The vane's wind isn't walked with the sky: the readout gives the latest reading, and the vane eases on its own.
    expect(vane().getAttribute("aria-label")).toBe("Wind: 25 mph, gusts 43 mph, from N");
  });
});
