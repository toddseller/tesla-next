// The real night sky over the site for the live scene: the bright stars and the
// planets, where they are at a moment and how bright they show.
// See openspec/specs/scene-weather.

import stars from "@/lib/scene/stars.json";
import { horizontal, moonPhase, moonPosition, sunPosition, toDays } from "@/lib/scene/sun";

const RAD = Math.PI / 180;
const OBLIQUITY = 23.43928 * RAD;

// JPL's approximate Keplerian elements, valid 1800 to 2050 (Standish,
// "Approximate Positions of the Planets", Table 1): semi-major axis (au),
// eccentricity, inclination, mean longitude, longitude of perihelion and of the
// ascending node (degrees), each at J2000 and its change per century. `earth`
// is the Earth-Moon barycenter, a few thousand km from Earth.
type PlanetName = "venus" | "mars" | "jupiter" | "saturn";
type Six = [number, number, number, number, number, number];

const ELEMENTS: Record<PlanetName | "earth", [Six, Six]> = {
  venus: [[0.72333566, 0.00677672, 3.39467605, 181.9790995, 131.60246718, 76.67984255],
    [0.0000039, -0.00004107, -0.0007889, 58517.81538729, 0.00268329, -0.27769418]],
  earth: [[1.00000261, 0.01671123, -0.00001531, 100.46457166, 102.93768193, 0],
    [0.00000562, -0.00004392, -0.01294668, 35999.37244981, 0.32327364, 0]],
  mars: [[1.52371034, 0.0933941, 1.84969142, -4.55343205, -23.94362959, 49.55953891],
    [0.00001847, 0.00007882, -0.00813131, 19140.30268499, 0.44441088, -0.29257343]],
  jupiter: [[5.202887, 0.04838624, 1.30439695, 34.39644051, 14.72847983, 100.47390909],
    [-0.00011607, -0.00013253, -0.00183714, 3034.74612775, 0.21252668, 0.20469106]],
  saturn: [[9.53667594, 0.05386179, 2.48599187, 49.95424423, 92.59887831, 113.66242448],
    [-0.0012506, -0.00050991, 0.00193609, 1222.49362201, -0.41897216, -0.28867794]],
};

// Visual magnitude at 1 au from the sun and from Earth, and its change with the
// phase angle `i` in degrees (Meeus, Astronomical Algorithms). Saturn's leaves
// out its rings.
const BRIGHTNESS: Record<PlanetName, [number, (i: number) => number]> = {
  venus: [-4.4, (i) => 0.0009 * i + 0.000239 * i * i - 0.00000065 * i * i * i],
  mars: [-1.52, (i) => 0.016 * i],
  jupiter: [-9.4, (i) => 0.005 * i],
  saturn: [-8.88, () => 0],
};

// A planet's position around the sun at `centuries` from J2000, in au, on the
// J2000 ecliptic.
const heliocentric = ([base, rate]: [Six, Six], centuries: number) => {
  const [a, e, inclination, longitude, perihelion, node] = base.map((value, i) => value + rate[i] * centuries);
  const anomaly = (((longitude - perihelion) % 360) + 540) % 360 - 180;
  let eccentric = anomaly * RAD + e * Math.sin(anomaly * RAD);
  for (let step = 0; step < 5; step += 1) {
    eccentric -= (eccentric - e * Math.sin(eccentric) - anomaly * RAD) / (1 - e * Math.cos(eccentric));
  }
  const x = a * (Math.cos(eccentric) - e);
  const y = a * Math.sqrt(1 - e * e) * Math.sin(eccentric);
  const [w, o, inc] = [(perihelion - node) * RAD, node * RAD, inclination * RAD];
  return [
    (Math.cos(w) * Math.cos(o) - Math.sin(w) * Math.sin(o) * Math.cos(inc)) * x + (-Math.sin(w) * Math.cos(o) - Math.cos(w) * Math.sin(o) * Math.cos(inc)) * y,
    (Math.cos(w) * Math.sin(o) + Math.sin(w) * Math.cos(o) * Math.cos(inc)) * x + (-Math.sin(w) * Math.sin(o) + Math.cos(w) * Math.cos(o) * Math.cos(inc)) * y,
    Math.sin(w) * Math.sin(inc) * x + Math.cos(w) * Math.sin(inc) * y,
  ];
};

const length = (v: number[]) => Math.hypot(...v);

// Venus, Mars, Jupiter and Saturn as seen from Earth at `date`: J2000 right
// ascension and declination in degrees, and visual magnitude.
type Body = { ascension: number; declination: number; magnitude: number };

export const planets = (date: Date) => {
  const centuries = toDays(date) / 36525;
  const earth = heliocentric(ELEMENTS.earth, centuries);
  return Object.fromEntries(Object.entries(BRIGHTNESS).map(([name, [absolute, phaseTerm]]) => {
    const sunward = heliocentric(ELEMENTS[name as PlanetName], centuries);
    const [x, y, z] = sunward.map((value, i) => value - earth[i]);
    const [r, delta] = [length(sunward), length([x, y, z])];
    const phase = Math.acos((r * r + delta * delta - length(earth) ** 2) / (2 * r * delta)) / RAD;
    const equatorial = [x, y * Math.cos(OBLIQUITY) - z * Math.sin(OBLIQUITY), y * Math.sin(OBLIQUITY) + z * Math.cos(OBLIQUITY)];
    return [name, {
      ascension: ((Math.atan2(equatorial[1], equatorial[0]) / RAD) + 360) % 360,
      declination: Math.asin(equatorial[2] / delta) / RAD,
      magnitude: absolute + 5 * Math.log10(r * delta) + phaseTerm(phase),
    }];
  })) as Record<PlanetName, Body>;
};

// The faintest magnitude that shows, by the sun's height in degrees: nothing by
// day (Venus peaks at -4.9), only the brightest points just after sunset, the bright stars by the end of civil
// twilight (6 degrees down), all of them by the end of astronomical (18).
const TWILIGHT: [number, number][] = [[0, -5], [-6, 1.5], [-12, 3.5], [-18, 4.5]];
// How much a full moon overhead lowers that limit; less as it is lower or thinner.
const MOONLIGHT = 1.5;

export const limitingMagnitude = (sunAltitude: number, moon: { altitude: number; phase: number }) => {
  const next = TWILIGHT.findIndex(([altitude]) => sunAltitude >= altitude);
  let limit: number;
  if (next === 0) limit = TWILIGHT[0][1];
  else if (next === -1) limit = TWILIGHT.at(-1)![1];
  else {
    const [[fromAltitude, from], [toAltitude, to]] = [TWILIGHT[next - 1], TWILIGHT[next]];
    limit = from + ((sunAltitude - fromAltitude) / (toAltitude - fromAltitude)) * (to - from);
  }
  const lit = (1 - Math.cos(2 * Math.PI * moon.phase)) / 2;
  return limit - MOONLIGHT * lit * Math.max(0, Math.sin(moon.altitude * RAD));
};

// How much dimmer a star shows at `altitude` degrees than overhead, in
// magnitudes, through the extra air (airmass capped at 10, near the horizon).
export const extinction = (altitude: number) => 0.25 * (Math.min(10, 1 / Math.sin(Math.max(altitude, 0.1) * RAD)) - 1);

// Where a body at compass direction `azimuth` sits across the scene: 0.95 at 60
// degrees (east-northeast) to 0.05 at 300 (west-northwest), due south in the
// middle, and on past the scene's edges beyond them.
export const azimuthX = (azimuth: number) => 0.95 - (0.9 * (azimuth - 60)) / 240;

// Past this share of the scene's width beyond either edge, a point is out of
// view even in the frame's padding.
const EDGE = 0.05;

// Faintly tinted by B-V color index: blue-white hot stars to orange cool ones,
// mixed mostly with white. Planets have their own tints.
const COLOR_STOPS: [number, number[]][] = [[-0.3, [190, 205, 255]], [0, [220, 228, 255]], [0.6, [255, 250, 244]], [1, [255, 232, 205]], [1.6, [255, 214, 170]]];
const PLANET_COLORS: Record<PlanetName, number[]> = { venus: [255, 255, 250], mars: [255, 206, 170], jupiter: [255, 250, 240], saturn: [255, 238, 196] };
const tint = (colorIndex: number | null) => {
  if (colorIndex == null) return [255, 255, 255];
  const next = COLOR_STOPS.findIndex(([index]) => colorIndex < index);
  if (next === 0) return COLOR_STOPS[0][1];
  if (next === -1) return COLOR_STOPS.at(-1)![1];
  const [[fromIndex, from], [toIndex, to]] = [COLOR_STOPS[next - 1], COLOR_STOPS[next]];
  const t = (colorIndex - fromIndex) / (toIndex - fromIndex);
  return from.map((value, i) => Math.round(value + t * (to[i] - value)));
};

// A point's size in stage units and its brightness when fully out, by the
// magnitude it shows at: Venus a bright point rather than a disc.
const radiusOf = (magnitude: number) => Math.min(3, Math.max(0.6, 1.9 - 0.3 * magnitude));
const peakOf = (magnitude: number) => Math.min(1, Math.max(0.3, 1 - 0.12 * (magnitude + 1)));

// The stars and planets that show at the site at `now`: across the scene `x`,
// height `altitude` in degrees, `radius` in stage units, `opacity` and `color`;
// a star's `index` in the catalog, or a planet's name as `planet`.
export type SkyPoint = { x: number; altitude: number; radius: number; opacity: number; color: string; index?: number; planet?: PlanetName };

export const nightSky = (now: Date): SkyPoint[] => {
  const moon = { altitude: moonPosition(now).altitude, phase: moonPhase(now) };
  const limit = limitingMagnitude(sunPosition(now).altitude, moon);
  const points = [
    ...(stars as [number, number, number, number | null][]).map(([ascension, declination, magnitude, colorIndex], index) => ({ ascension, declination, magnitude, rgb: tint(colorIndex), index })),
    ...(Object.entries(planets(now)) as [PlanetName, Body][]).map(([planet, body]) => ({ ...body, rgb: PLANET_COLORS[planet], planet })),
  ];
  return points.flatMap(({ ascension, declination, magnitude, rgb, ...id }) => {
    if (magnitude > limit) return [];
    const { altitude, azimuth } = horizontal(ascension, declination, now);
    const x = azimuthX(azimuth);
    const shown = magnitude + extinction(altitude);
    const opacity = Math.min(1, limit - shown) * peakOf(shown);
    if (altitude <= 0 || opacity <= 0 || x < -EDGE || x > 1 + EDGE) return [];
    return [{ x, altitude, radius: radiusOf(shown), opacity, color: `rgb(${rgb.join(" ")})`, ...id }];
  });
};

// A star's brightness at `ms`, 1 down to 1 minus its depth: two sines at its own
// rates of 2 to 6 a second, set by its catalog index, flicker it the way the
// air does, barely overhead (0.08) and strongly near the horizon (0.5), with the
// airmass. Planets are disks, not points, so the air doesn't make them twinkle.
export const twinkle = ({ index, altitude, planet }: Pick<SkyPoint, "index" | "altitude" | "planet">, ms: number) => {
  if (planet) return 1;
  const depth = 0.08 + (0.42 * (Math.min(10, 1 / Math.sin(Math.max(altitude, 0.1) * RAD)) - 1)) / 9;
  const t = ms / 1000;
  // Every point that isn't a planet is a star, with its catalog index.
  const star = index!;
  const wave = Math.sin(2 * Math.PI * (2 + ((star * 0.618) % 1) * 4) * t + star * 2.4)
    + Math.sin(2 * Math.PI * (2 + ((star * 0.414) % 1) * 4) * t + star * 1.7);
  return 1 - depth * (0.5 + wave / 4);
};
