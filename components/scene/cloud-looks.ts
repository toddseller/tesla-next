// The clouds' looks for each kind of weather (openspec/specs/scene-weather), as
// tuned live on the scene: each preset's weather is where its look applies in
// full, and weather between presets blends the nearest ones' looks. Sunny stands
// for no cloud and lends no look, so near-clear weather takes the fair puffs'.

// The cloud layers, highest first, in the order the shader draws them.
export type Layer = "cirrus" | "mid" | "low" | "dense";
export const LAYERS: Layer[] = ["cirrus", "mid", "low", "dense"];

export const LOOK_KEYS = [
  "shading", "sunlight", "ambient", "coreDark", "sunEdge", "march",
  "softness", "opacity", "lowScale", "midScale", "warp", "cirrusStretch",
] as const;
export type Look = Record<(typeof LOOK_KEYS)[number], number>;
export type RGB = [number, number, number];

export const PRESETS: Record<string, { weather: { low: number; mid: number; cirrus: number; rain: number }; look: Look | null }> = {
  sunny: { weather: { low: 0, mid: 0, cirrus: 0, rain: 0 }, look: null },
  fairPuffs: {
    weather: { low: 0.13, mid: 0.06, cirrus: 0.11, rain: 0 },
    look: { shading: 0.33, sunlight: 0.85, ambient: 1, coreDark: 0.23, sunEdge: 1.4, march: 0.018, softness: 0.22, opacity: 1, lowScale: 5, midScale: 9, warp: 0.55, cirrusStretch: 9 },
  },
  partlyCloudy: {
    weather: { low: 0.31, mid: 0.33, cirrus: 0.43, rain: 0 },
    look: { shading: 0.55, sunlight: 0.85, ambient: 1, coreDark: 0.35, sunEdge: 1.3, march: 0.009, softness: 0.22, opacity: 1, lowScale: 5, midScale: 8, warp: 0.55, cirrusStretch: 9 },
  },
  marineLayer: {
    weather: { low: 1, mid: 0.22, cirrus: 0, rain: 0 },
    look: { shading: 0.2, sunlight: 0.45, ambient: 0.95, coreDark: 0.04, sunEdge: 0.4, march: 0.011, softness: 0.57, opacity: 0.78, lowScale: 2, midScale: 10, warp: 0.12, cirrusStretch: 9 },
  },
  overcast: {
    weather: { low: 0.9, mid: 0.75, cirrus: 0.3, rain: 0 },
    look: { shading: 0.2, sunlight: 0.45, ambient: 0.95, coreDark: 0.5, sunEdge: 0.5, march: 0.03, softness: 0.5, opacity: 1, lowScale: 3, midScale: 9, warp: 0.12, cirrusStretch: 9 },
  },
  // Rain arrives without the low, mid and high split, as an overcast code drawn as
  // low cloud of 1, so the storm look sits there; the stored readings' rain runs 0.2 to 0.4.
  // A full deck lets little sunlight through, so its ambient light mostly sets how
  // dark it is: tuned at partial cover, an ambient of 0.56 and cores darkened 0.85
  // turned a full deck nearly black, where a rainy noon is a dark gray with shape.
  storm: {
    weather: { low: 1, mid: 0, cirrus: 0, rain: 0.4 },
    look: { shading: 1.2, sunlight: 0.46, ambient: 0.8, coreDark: 0.7, sunEdge: 0.4, march: 0.05, softness: 0.38, opacity: 1.1, lowScale: 5, midScale: 11, warp: 0.91, cirrusStretch: 3 },
  },
};

// The low sun's color by its altitude in degrees: white well up, gold, orange on
// the horizon, then pink, crimson and magenta below it.
export const SUNSET_RAMP: [number, RGB][] = [
  [8, [1, 1, 0.97]],
  [4, [1, 0.86, 0.62]],
  [0, [1, 0.62, 0.34]],
  [-1.5, [1, 0.5, 0.48]],
  [-3.5, [0.92, 0.36, 0.46]],
  [-5.5, [0.6, 0.32, 0.5]],
];

// The sun's altitude at which each layer has lost its light, as the earth's
// shadow climbs the sky after sunset: low cloud first, high cloud last. Each
// fades out over the FADE_DEGREES above it.
export const CUTOFF: Record<Layer, number> = { low: -1.2, dense: -1.2, mid: -2.8, cirrus: -5.5 };
export const FADE_DEGREES = 1.2;

export const MOONLIGHT: RGB = [0.32, 0.35, 0.44];
export const AMBIENT: Record<"night" | "day", RGB> = { night: [0.1, 0.115, 0.16], day: [0.56, 0.6, 0.68] };
