import {AMBIENT, CUTOFF, FADE_DEGREES, type Layer, LAYERS, type Look, LOOK_KEYS, MOONLIGHT, PRESETS, SUNSET_RAMP} from "@/components/scene/cloud-looks";
import {type SceneState, TWILIGHT_DEGREES} from "@/lib/scene/live-scene";
import {EAVES, HEADROOM, HORIZON, skyY, STAGE} from "@/components/scene/layout";

// The shader blends only the two looks with the most weight, to bound its cost.
const BLENDED = 2;

// How much each preset's look applies to this weather: inverse distance to each
// preset's weather, rain counting double, sharpened so a preset's own weather
// gives its look alone. Sunny lends no look.
type Amounts = { low?: number; mid?: number; cirrus?: number };

export const cloudWeights = ({ low = 0, mid = 0, cirrus = 0 }: Amounts, rain: number | null = 0) => {
  const all = Object.entries(PRESETS)
    .filter(([, { look }]) => look)
    .map(([name, { weather: p }]) => {
      const d2 = (low - p.low) ** 2 + (mid - p.mid) ** 2 + (cirrus - p.cirrus) ** 2 + (2 * ((rain ?? 0) - p.rain)) ** 2;
      return { name, weight: 1 / (d2 * d2 + 1e-12) };
    })
    .sort((a, b) => b.weight - a.weight);
  // Measured above the strongest look left out, so a look's weight reaches 0 as it
  // drops out of the blend rather than being swapped for another's in one frame.
  const floor = all[BLENDED]?.weight ?? 0;
  const raw = all.slice(0, BLENDED).map(({ name, weight }) => ({ name, weight: weight - floor + 1e-12 }));
  const total = raw.reduce((t, w) => t + w.weight, 0);
  return raw.map(({ name, weight }) => ({ name, weight: weight / total }));
};

// A layer fades in over its first 0.04 rather than switching on.
const fadeIn = (amount: number) => Math.min(1, amount / 0.04);
// Each layer's opacity before the look's: the cirrus a half-opaque veil, the mid
// clouds a little lighter than the low.
const BASE_OPACITY: Record<Layer, number> = { cirrus: 0.55, mid: 0.85, low: 0.95, dense: 1 };

// What the cloud shader draws for this scene: plain numbers, from the scene
// state and the cloud amounts as walked to a new reading (rain walked with them,
// so the looks change gradually too).
export type SceneLight = Pick<SceneState, "sunGlow" | "twilight" | "moon" | "dusk">;

export const cloudInputs = (state: SceneLight, { low = 0, mid = 0, cirrus = 0, rain = 0 }: Amounts & { rain?: number | null }) => {
  const weights = cloudWeights({ low, mid, cirrus }, rain);
  const look = Object.fromEntries(LOOK_KEYS.map((key) => [key, weights.reduce((t, { name, weight }) => t + weight * PRESETS[name].look![key], 0)])) as Look;
  // The darker overcast cloud fades in from half the low cloud.
  const dense = Math.max(0, (low - 0.5) / 0.5);
  const shares: Record<Layer, number> = { cirrus, mid, low, dense };
  const opacity = Object.fromEntries(Object.entries(shares).map(([layer, share]) => [layer, BASE_OPACITY[layer as Layer] * look.opacity * fadeIn(share)])) as Record<Layer, number>;
  return { weights, look, shares, opacity, light: lightOf(state, look, { low, mid }) };
};

// Heights in the frame the canvas covers, as shares of its height: the sky above
// the stage, then the stage. The frame's padding is left out; it moves them by under 2%.
const FRAME = HEADROOM + STAGE.height;
const inFrame = (stageY: number) => (HEADROOM + stageY) / FRAME;
// Below the horizon the light drops this far per degree, so the march toward it
// points down and lights the clouds' undersides.
const DROP_PER_DEGREE = 0.04;
const DARK = [0, 0, 0];
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const lerp = (a: number[], b: number[], t: number) => a.map((v, i) => v + (b[i] - v) * t);

const rampAt = (altitude: number) => {
  if (altitude >= SUNSET_RAMP[0][0]) return SUNSET_RAMP[0][1];
  for (let i = 1; i < SUNSET_RAMP.length; i++) {
    const [at, color] = SUNSET_RAMP[i];
    if (altitude >= at) return lerp(color, SUNSET_RAMP[i - 1][1], (altitude - at) / (SUNSET_RAMP[i - 1][0] - at));
  }
  return SUNSET_RAMP.at(-1)![1];
};

// Where the clouds' light comes from and its color for each layer: the sun by day
// and through twilight, each layer losing it by its height after sunset, then the
// moon while it is up. `deck` is how much the low or mid cloud has become a deck,
// under which the low sun's color stays near the horizon.
const lightOf = ({ sunGlow, twilight, moon, dusk }: SceneLight, look: Look, { low, mid }: { low: number; mid: number }) => {
  // Through twilight `dusk` runs evenly with the sun's height, so it gives the
  // altitude once the sun glow is gone.
  const altitude = sunGlow?.altitude ?? dusk * 2 * TWILIGHT_DEGREES - TWILIGHT_DEGREES;
  let position: number[];
  let color: Record<Layer, number[]>;
  if (altitude > -TWILIGHT_DEGREES) {
    position = sunGlow
      ? [sunGlow.x, inFrame(skyY(altitude))]
      : [twilight?.x ?? 0.5, inFrame(HORIZON) + Math.max(0, -altitude) * DROP_PER_DEGREE];
    const sun = rampAt(altitude);
    color = Object.fromEntries(LAYERS.map((layer) => [layer, sun.map((v) => v * clamp01((altitude - CUTOFF[layer]) / FADE_DEGREES))])) as Record<Layer, number[]>;
  } else {
    position = moon ? [moon.x, inFrame(skyY(moon.altitude))] : [0.5, -1];
    color = Object.fromEntries(LAYERS.map((layer) => [layer, moon ? MOONLIGHT : DARK])) as Record<Layer, number[]>;
  }
  return {
    position,
    color,
    ambient: lerp(AMBIENT.night, AMBIENT.day, dusk).map((v) => v * look.ambient),
    deck: clamp01((Math.max(low, mid) - 0.55) / 0.35),
    sky: inFrame(EAVES),
    horizon: inFrame(HORIZON),
  };
};
