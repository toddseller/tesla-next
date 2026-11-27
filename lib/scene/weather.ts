// Replay's readings are blended so a fast replay changes the sky smoothly between them. See the scene-weather spec.
import type { Units } from "@/lib/units";

// 0 to 1, km/h for wind, degrees the 10 m wind blows from, °C, or the WMO weather code. Any may be missing or null:
// before a reading, or for a reading stored before that field was kept.
export type Sky = Partial<Record<"cover" | "rain" | "wind" | "windLow" | "windMid" | "windHigh" | "cirrus" | "low" | "mid" | "sun" | "windSpeed" | "windGusts" | "windDirection" | "temperature" | "code", number | null>>;
export type WeatherReading = Sky & { start: string };

export const weatherAt = (readings: WeatherReading[] | null | undefined, t: number, field: keyof Sky): number | null | undefined => {
  if (!readings?.length) return null;
  const points = readings.map((reading): [number, number | null | undefined] => [new Date(reading.start).getTime(), reading[field]]);
  const after = points.findIndex(([at]) => at >= t);
  if (after === 0) return points[0][1];
  if (after === -1) return points[points.length - 1][1];
  const [[t0, c0], [t1, c1]] = [points[after - 1], points[after]];
  if (field === "code") return t === t1 ? c1 : c0;
  const f = (t - t0) / (t1 - t0);
  // Blended as numbers, a missing gust or temperature would read as 0, and a missing direction as north.
  if ((field === "windDirection" || field === "windGusts" || field === "temperature") && (c0 == null || c1 == null)) return c0 ?? c1;
  if (field === "windDirection") return turn(c0!, c1!, f);
  return c0! + (c1! - c0!) * f;
};

// Degrees from `from` toward `to` by the share `f`, the shorter way round, in 0..360.
export const turn = (from: number, to: number, f: number) => {
  const by = ((((to - from) % 360) + 540) % 360) - 180;
  return (((from + by * f) % 360) + 360) % 360;
};

// Rain, or fog without the airport's report, arrive without the low and mid split; their cover draws as low cloud.
// Applied before blending, since arithmetic on the missing shares would make them zero cloud.
export const withSplit = <T extends Sky>(reading: T): T =>
  reading.cover != null && reading.low == null && reading.mid == null ? { ...reading, low: reading.cover, mid: 0, cirrus: 0 } : reading;

const MPH_PER_KMH = 0.621371;
const POINTS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
// Below this the wind has no direction worth showing; the vane keeps its last one too (scene-weather spec).
export const CALM_MPH = 2;
export const isCalm = (speed: number) => speed * MPH_PER_KMH < CALM_MPH;

// The vane's readout, from the 10 m wind in km/h and degrees from, in the viewer's wind unit.
export const windIn = (kmh: number, unit: Units["wind"]) => `${Math.round(unit === "mph" ? kmh * MPH_PER_KMH : kmh)} ${unit}`;

export const windText = (speed: number | null | undefined, gusts: number | null | undefined, direction: number | null | undefined, unit: Units["wind"]) => {
  if (speed == null || direction == null) return "No wind reading";
  if (isCalm(speed)) return "Calm";
  const from = POINTS[Math.round(direction / 45) % 8];
  return gusts == null ? `${windIn(speed, unit)} from ${from}` : `${windIn(speed, unit)}, gusts ${windIn(gusts, unit)}, from ${from}`;
};
