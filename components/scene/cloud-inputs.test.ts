// Ported from anton-tesla-api-ws tesla-api-frontend/client/src/components/scene/cloudInputs.test.js.
import { describe, test, expect } from "vitest";
import {cloudInputs, cloudWeights} from "@/components/scene/cloud-inputs";
import {LOOK_KEYS, MOONLIGHT, PRESETS} from "@/components/scene/cloud-looks";
import {EAVES, HEADROOM, HORIZON, STAGE} from "@/components/scene/layout";
import {type LiveInput, sceneState} from "@/lib/scene/live-scene";

const NOON = new Date("2026-10-26T20:00:00Z");
const midday: LiveInput = { liveReceived: true, solarPower: 4, homePower: 1, batteryPower: 0, battery: 80, gridPower: 0, vehicle: null };
const inputsAt = (now: Date, { low = 0, mid = 0, cirrus = 0, rain = 0 }: { low?: number; mid?: number; cirrus?: number; rain?: number } = {}) =>
  cloudInputs(sceneState(midday, now, { low, mid, cirrus, rain, cover: low }), { low, mid, cirrus, rain });

const weightOf = (weights: { name: string; weight: number }[], name: string) => weights.find((w) => w.name === name)?.weight ?? 0;

describe("cloud weights", () => {
  test("each preset's anchor gives that preset alone", () => {
    for (const [name, { weather, look }] of Object.entries(PRESETS)) {
      if (!look) continue;
      const weights = cloudWeights(weather, weather.rain);
      expect(weightOf(weights, name)).toBeCloseTo(1, 6);
    }
  });

  test("at most two presets, summing to 1", () => {
    const weights = cloudWeights({ low: 0.6, mid: 0.2, cirrus: 0.2 }, 0.1);
    expect(weights.length).toBeLessThanOrEqual(2);
    expect(weights.reduce((t, w) => t + w.weight, 0)).toBeCloseTo(1, 9);
  });

  test("sunny lends no look: a nearly clear sky takes the fair puffs'", () => {
    const weights = cloudWeights({ low: 0.05, mid: 0, cirrus: 0 }, 0);
    expect(weights[0].name).toBe("fairPuffs");
    expect(weights.some((w) => w.name === "sunny")).toBe(false);
  });

  test("a marine layer burning off moves its weight to the fair looks steadily", () => {
    const marine = [1, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3].map((low) => weightOf(cloudWeights({ low, mid: 0.05, cirrus: 0 }, 0), "marineLayer"));
    for (let i = 1; i < marine.length; i++) expect(marine[i]).toBeLessThanOrEqual(marine[i - 1] + 1e-4);
    expect(marine[0]).toBeGreaterThan(0.9);
    expect(marine.at(-1)).toBeLessThan(0.1);
  });

  // The live walk from scattered cloud to a marine layer once swapped a 35% share of
  // partly cloudy for marine layer in one step, when they traded second place.
  test("no look's weight jumps along a walk, even where the two blended looks change", () => {
    const from = { low: 0.19, mid: 0.05, cirrus: 0.1 }, to = { low: 0.95, mid: 0.2, cirrus: 0 };
    let previous = cloudWeights(from, 0);
    for (let step = 1; step <= 300; step++) {
      const f = step / 300;
      const weights = cloudWeights(Object.fromEntries((Object.keys(to) as (keyof typeof to)[]).map((k) => [k, from[k] + (to[k] - from[k]) * f])), 0);
      for (const name of Object.keys(PRESETS)) expect(Math.abs(weightOf(weights, name) - weightOf(previous, name))).toBeLessThan(0.05);
      previous = weights;
    }
  });

  // Rain arrives without the split, as an overcast code: the scene sees low cloud
  // of 1 and nothing above it, with rain of 0.2 to 0.4 in the stored readings.
  test("rain as it arrives, without the split, is storm", () => {
    expect(weightOf(cloudWeights({ low: 1, mid: 0, cirrus: 0 }, 0.4), "storm")).toBeGreaterThan(0.95);
    expect(weightOf(cloudWeights({ low: 1, mid: 0, cirrus: 0 }, 0.3), "storm")).toBeGreaterThan(0.8);
  });

  test("a dry marine layer stays a marine layer, not storm", () => {
    expect(weightOf(cloudWeights({ low: 1, mid: 0, cirrus: 0 }, 0), "marineLayer")).toBeGreaterThan(0.9);
  });

  test("heavy rain under heavy cover is mostly storm", () => {
    expect(weightOf(cloudWeights({ low: 0.9, mid: 0.5, cirrus: 0.5 }, 0.7), "storm")).toBeGreaterThan(0.6);
  });
});

describe("cloud inputs: look and shares", () => {
  test("at a preset's weather the look is that preset's", () => {
    const { weather, look } = PRESETS.marineLayer;
    const blended = inputsAt(NOON, weather).look;
    for (const key of LOOK_KEYS) expect(blended[key]).toBeCloseTo(look![key], 6);
  });

  test("halfway between two presets each look value lies between theirs", () => {
    const a = PRESETS.fairPuffs, b = PRESETS.partlyCloudy;
    const half = Object.fromEntries((["low", "mid", "cirrus", "rain"] as const).map((k) => [k, (a.weather[k] + b.weather[k]) / 2]));
    const { look } = inputsAt(NOON, half);
    for (const key of LOOK_KEYS) {
      expect(look[key]).toBeGreaterThanOrEqual(Math.min(a.look![key], b.look![key]) - 1e-9);
      expect(look[key]).toBeLessThanOrEqual(Math.max(a.look![key], b.look![key]) + 1e-9);
    }
  });

  test("the shares follow the walked amounts, the dense cloud from half the low", () => {
    const inputs = cloudInputs(sceneState(midday, NOON, { low: 1, mid: 0.2, cirrus: 0.3 }), { low: 0.8, mid: 0.2, cirrus: 0.3, rain: 0 });
    expect(inputs.shares).toEqual({ cirrus: 0.3, mid: 0.2, low: 0.8, dense: expect.closeTo(0.6, 9) });
  });

  test("no cloud gives no shares and no opacity", () => {
    const { shares, opacity } = inputsAt(NOON);
    expect(Object.values(shares)).toEqual([0, 0, 0, 0]);
    expect(Object.values(opacity)).toEqual([0, 0, 0, 0]);
  });

  test("a layer fades in over its first 0.04, cirrus half opaque, mid lighter than low", () => {
    const { opacity, look } = inputsAt(NOON, { low: 0.5, mid: 0.02, cirrus: 0.5 });
    expect(opacity.cirrus).toBeCloseTo(0.55 * look.opacity, 6);
    expect(opacity.mid).toBeCloseTo(0.85 * look.opacity * 0.5, 6);
    expect(opacity.low).toBeCloseTo(0.95 * look.opacity, 6);
  });
});

describe("cloud inputs: light", () => {
  const FRAME = HEADROOM + STAGE.height;
  const AFTERNOON = new Date("2026-10-26T21:00:00Z"); // 2 PM
  const MORNING = new Date("2026-10-26T16:00:00Z"); // 9 AM
  const BEFORE_SUNSET = new Date("2026-10-27T01:00:00Z"); // sun 2.75 degrees up
  const SUNSET = new Date("2026-10-27T01:15:00Z"); // sun on the horizon
  const DUSK = new Date("2026-10-27T01:25:00Z"); // sun 2 degrees down
  const MOONLIT = new Date("2026-10-27T04:00:00Z"); // 9 PM, moon 29 degrees up
  const MOONLESS = new Date("2026-11-09T07:00:00Z"); // 11 PM, new moon

  test("the afternoon sun lights from left of center, above the eaves", () => {
    const { position } = inputsAt(AFTERNOON, { low: 0.3 }).light;
    expect(position[0]).toBeLessThan(0.5);
    expect(position[1]).toBeLessThan((HEADROOM + EAVES) / FRAME);
  });

  test("the morning sun lights from the right", () => {
    expect(inputsAt(MORNING, { low: 0.3 }).light.position[0]).toBeGreaterThan(0.5);
  });

  test("below the horizon the light sits under it on the twilight's side, so the clouds are lit from below", () => {
    const state = sceneState(midday, DUSK, { low: 0.3, cover: 0.3 });
    const { position } = cloudInputs(state, { low: 0.3 }).light;
    expect(position[0]).toBeCloseTo(state.twilight.x, 6);
    expect(position[1]).toBeGreaterThan((HEADROOM + HORIZON) / FRAME);
  });

  test("white at noon, gold a few degrees up, orange on the horizon", () => {
    const noon = inputsAt(NOON, { low: 0.3 }).light.color.low;
    expect(noon).toEqual([1, 1, 0.97]);
    const [r, g, b] = inputsAt(BEFORE_SUNSET, { low: 0.3 }).light.color.low;
    expect(r).toBe(1);
    expect(g).toBeGreaterThan(0.7);
    expect(b).toBeLessThan(0.6);
    const horizon = inputsAt(SUNSET, { low: 0.3 }).light.color.cirrus;
    horizon.forEach((v, i) => expect(v).toBeCloseTo([1, 0.62, 0.34][i], 1));
  });

  test("two degrees down the low clouds have lost the light and the cirrus is pink", () => {
    const { color } = inputsAt(DUSK, { low: 0.3, cirrus: 0.4 }).light;
    expect(color.low).toEqual([0, 0, 0]);
    expect(color.dense).toEqual([0, 0, 0]);
    const [r, g, b] = color.cirrus;
    expect(r).toBeGreaterThan(0.9);
    expect(b).toBeGreaterThan(g - 0.15);
    expect(color.mid.some((v) => v > 0)).toBe(true);
  });

  test("at night the moon lights the clouds, cool gray, from its place", () => {
    const state = sceneState(midday, MOONLIT, { low: 0.4, cover: 0.4 });
    const { light } = cloudInputs(state, { low: 0.4 });
    expect(light.color.low).toEqual(MOONLIGHT);
    expect(light.position[0]).toBeCloseTo(state.moon!.x, 6);
  });

  test("with the moon down nothing lights them", () => {
    const { color } = inputsAt(MOONLESS, { low: 0.4 }).light;
    for (const layer of ["cirrus", "mid", "low", "dense"] as const) expect(color[layer]).toEqual([0, 0, 0]);
  });

  test("the ambient light is the day's at noon and the night's at night, scaled by the look", () => {
    const noon = inputsAt(NOON, { low: 0.3 });
    expect(noon.light.ambient[0]).toBeCloseTo(0.56 * noon.look.ambient, 6);
    const night = inputsAt(MOONLESS, { low: 0.3 });
    expect(night.light.ambient[0]).toBeCloseTo(0.1 * night.look.ambient, 6);
  });

  test("a deck forms from the heavier of the low and mid cloud", () => {
    expect(inputsAt(NOON, { low: 0.4 }).light.deck).toBe(0);
    expect(inputsAt(NOON, { low: 0.9 }).light.deck).toBe(1);
    expect(inputsAt(NOON, { low: 0.3, mid: 0.9 }).light.deck).toBe(1);
  });

  test("the eaves and the horizon in the frame, for the bands and the deck's warm edge", () => {
    const { sky, horizon } = inputsAt(NOON).light;
    expect(sky).toBeCloseTo((HEADROOM + EAVES) / FRAME, 9);
    expect(horizon).toBeCloseTo((HEADROOM + HORIZON) / FRAME, 9);
  });
});
