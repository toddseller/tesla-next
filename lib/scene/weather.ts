// Replay's readings are blended so a fast replay changes the sky smoothly between them. See the scene-weather spec.

// 0 to 1, or km/h for wind. Any may be missing or null: before a reading, or for a reading stored before that field
// was kept.
export type Sky = Partial<Record<"cover" | "rain" | "wind" | "windLow" | "windMid" | "windHigh" | "cirrus" | "low" | "mid" | "sun", number | null>>;
export type WeatherReading = Sky & { start: string };

export const weatherAt = (readings: WeatherReading[] | null | undefined, t: number, field: keyof Sky): number | null | undefined => {
  if (!readings?.length) return null;
  const points = readings.map((reading): [number, number | null | undefined] => [new Date(reading.start).getTime(), reading[field]]);
  const after = points.findIndex(([at]) => at >= t);
  if (after === 0) return points[0][1];
  if (after === -1) return points[points.length - 1][1];
  const [[t0, c0], [t1, c1]] = [points[after - 1], points[after]];
  return c0! + ((c1! - c0!) * (t - t0)) / (t1 - t0);
};

// Rain, or fog without the airport's report, arrive without the low and mid split; their cover draws as low cloud.
// Applied before blending, since arithmetic on the missing shares would make them zero cloud.
export const withSplit = <T extends Sky>(reading: T): T =>
  reading.cover != null && reading.low == null && reading.mid == null ? { ...reading, low: reading.cover, mid: 0, cirrus: 0 } : reading;
