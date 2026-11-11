import { db } from "@/lib/db";
import { FIRST_PRECIPITATION_CODE, skyFrom } from "@/lib/intervals/weather";
import { shiftDay, TIME_ZONE, wallTime } from "@/lib/scene/replay";
import { skyAt } from "@/lib/scene/sun";

export type ForecastRow = { day: string; radiation_mj: number; weather_code: number; fetched_at: string };
// The 30 days before today with both a solar total and a forecast: their kWh, forecast MJ/m², count and best day.
export type Scale = { solar_kwh: number; radiation_mj: number; days: number; good_day: number | null };
export type Reading = Sample & { sampled_at: string };
// Each hour of the day's Wh and forecast W/m² over the same 30 days, and the days with any such hour.
export type HourScale = { hour: number; wh: number; wm2: number };
export type TodayHour = { start_at: string; wm2: number; made_wh: number | null };
export type Hourly = { scale: HourScale[]; days: number; today: TodayHour[]; made_until: string | null };
export type ForecastData = { scale: Scale; rows: ForecastRow[]; so_far: number | null; reading: Reading | null; hourly: Hourly };

export type SkyWhen = "forecast" | "now" | "night";

export type ByHour = {
  // made is null for an hour not yet started.
  hours: { start: string; expected: number; made: number | null }[];
  // Made against expected up to the newest interval's end; null before the first shown hour starts.
  byNow: { made: number; expected: number; at: string; over: boolean } | null;
};

export type ForecastCard = {
  // The day the card was worked out for, so a page left open past midnight names its days from the data.
  today: { day: string; soFar: number | null; expected: number | null; code: number | null; sky: SkyWhen };
  days: { day: string; expected: number; code: number }[] | null;
  goodDay: number | null;
  staleSince: string | null;
  byHour: ByHour | null;
};

// Each hour of the day's made Wh and forecast W/m² over the 30 days before the day, and the days with any such hour.
// Joined on the hour's start, an instant, so the nights the clocks change need nothing of their own.
const hourScale = (day: string) =>
  db.query<HourScale & { days: number }>(
    `WITH made AS (
       SELECT date_trunc('hour', start_at) AS start_at, min(day) AS day, sum(solar_generated_wh) AS wh
       FROM energy_interval WHERE day BETWEEN $1::date - 30 AND $1::date - 1 GROUP BY 1),
     joined AS (
       SELECT m.day, extract(hour FROM f.start_at AT TIME ZONE $2)::int AS hour, m.wh, f.radiation_wm2
       FROM made m JOIN solar_forecast_hour f USING (start_at))
     SELECT hour, sum(wh)::float8 AS wh, sum(radiation_wm2)::float8 AS wm2, (SELECT count(DISTINCT day) FROM joined)::int AS days
     FROM joined GROUP BY hour ORDER BY hour`,
    [day, TIME_ZONE],
  );

// Wh per W/m² for each hour of the day; an hour without sunlight in the scale's days expects nothing.
const perWm2 = (scale: HourScale[]) => new Map(scale.map(({ hour, wh, wm2 }) => [hour, wm2 > 0 ? wh / wm2 : 0]));
const expectedKwh = (scales: Map<number, number>, start: string, wm2: number) => (wm2 * (scales.get(wallTime(Date.parse(start)).hour) ?? 0)) / 1000;

export async function expectedHours(day: string): Promise<{ start: string; kwh: number }[]> {
  const [scale, hours] = await Promise.all([
    hourScale(day),
    db.query<{ start_at: Date; wm2: number }>(
      `SELECT start_at, radiation_wm2::float8 AS wm2 FROM solar_forecast_hour
       WHERE start_at >= $1::date::timestamp AT TIME ZONE $2 AND start_at < ($1::date + 1)::timestamp AT TIME ZONE $2 ORDER BY start_at`,
      [day, TIME_ZONE],
    ),
  ]);
  if ((scale.rows[0]?.days ?? 0) < FEWEST_DAYS) return [];
  const scales = perWm2(scale.rows);
  return hours.rows.map(({ start_at, wm2 }) => {
    const start = start_at.toISOString();
    return { start, kwh: expectedKwh(scales, start, wm2) };
  });
}

export async function forecast(today: string): Promise<ForecastData> {
  const [scale, rows, soFar, reading, hourly, todayHours, madeUntil] = await Promise.all([
    db.query<Scale>(
      `SELECT coalesce(sum(d.solar_generated), 0)::float8 AS solar_kwh, coalesce(sum(f.radiation_mj), 0)::float8 AS radiation_mj,
         count(*)::int AS days, max(d.solar_generated)::float8 AS good_day
       FROM data d JOIN solar_forecast f ON f.day = d.date::date
       WHERE d.date::date BETWEEN $1::date - 30 AND $1::date - 1 AND d.solar_generated IS NOT NULL`,
      [today],
    ),
    db.query<Omit<ForecastRow, "fetched_at"> & { fetched_at: Date }>(
      // radiation_mj is real; rounded so 12.83 doesn't arrive as 12.829999923706055. The daily code is the whole day's
      // worst weather, so overnight fog would label a sunny day; days stored before anton kept a daylight code keep the daily one.
      `SELECT day::text, round(radiation_mj::numeric, 2)::float8 AS radiation_mj, coalesce(daylight_code, weather_code) AS weather_code, fetched_at
       FROM solar_forecast WHERE day BETWEEN $1::date AND $1::date + 3 ORDER BY day`,
      [today],
    ),
    db.query<{ so_far: number }>("SELECT round(solar_generated::numeric, 2)::float8 AS so_far FROM data WHERE date = $1", [today]),
    db.query<Sample & { sampled_at: Date }>(
      `SELECT weather_code AS code, cloud_cover, cloud_cover_low, cloud_cover_mid, cloud_cover_high, airport_low, airport_mid, sampled_at
       FROM weather_sample ORDER BY sampled_at DESC LIMIT 1`,
    ),
    hourScale(today),
    db.query<Omit<TodayHour, "start_at"> & { start_at: Date }>(
      `SELECT f.start_at, round(f.radiation_wm2::numeric, 1)::float8 AS wm2, m.wh::float8 AS made_wh
       FROM solar_forecast_hour f
       LEFT JOIN (SELECT date_trunc('hour', start_at) AS start_at, sum(solar_generated_wh) AS wh FROM energy_interval WHERE day = $1 GROUP BY 1) m
         USING (start_at)
       WHERE f.start_at >= $1::date::timestamp AT TIME ZONE $2 AND f.start_at < ($1::date + 1)::timestamp AT TIME ZONE $2
       ORDER BY f.start_at`,
      [today, TIME_ZONE],
    ),
    db.query<{ made_until: Date | null }>("SELECT max(start_at) + interval '5 minutes' AS made_until FROM energy_interval WHERE day = $1", [today]),
  ]);
  const newest = reading.rows[0];
  return {
    scale: scale.rows[0],
    rows: rows.rows.map((row) => ({ ...row, fetched_at: row.fetched_at.toISOString() })),
    so_far: soFar.rows[0]?.so_far ?? null,
    reading: newest ? { ...newest, sampled_at: newest.sampled_at.toISOString() } : null,
    hourly: {
      scale: hourly.rows.map(({ hour, wh, wm2 }) => ({ hour, wh, wm2 })),
      days: hourly.rows[0]?.days ?? 0,
      today: todayHours.rows.map((row) => ({ ...row, start_at: row.start_at.toISOString() })),
      made_until: madeUntil.rows[0].made_until?.toISOString() ?? null,
    },
  };
}

const HOUR = 3_600_000;
// Several missed hourly fetches; a day without one means anton has stopped, and the days ahead are guesses.
const STALE_AFTER = 6 * HOUR;
const GONE_AFTER = 24 * HOUR;
// A weather reading's code and cloud in percent, with the airport's low and mid cloud when its report was fresh.
export type Sample = {
  code: number; cloud_cover: number; cloud_cover_low: number | null; cloud_cover_mid: number | null; cloud_cover_high: number | null;
  airport_low: number | null; airport_mid: number | null;
};

// The sky the Distribution scene draws, as a code the card labels: the model's few clouds under the airport's clear
// sky read sunny, as the scene shows. The steps fall between the airport's few (19%), scattered (44%) and broken (75%).
export function observedCode(r: Sample): number {
  if (r.code >= FIRST_PRECIPITATION_CODE) return r.code;
  const { cover } = skyFrom(r.code, r.cloud_cover, r.cloud_cover_low, r.cloud_cover_mid, r.cloud_cover_high, r.airport_low, r.airport_mid);
  if ((r.code === 45 || r.code === 48) && cover >= 1) return r.code;
  return cover < 0.25 ? 0 : cover < 0.75 ? 2 : 3;
}

const FEWEST_DAYS = 7;
// As the scene treats a reading: older than this, it no longer stands for the sky.
const READING_FOR = 3 * HOUR;

export function forecastCard({ scale, rows, so_far, reading, hourly }: ForecastData, today: string, now: number): ForecastCard {
  const row = (day: string) => rows.find((r) => r.day === day);
  const age = (r: ForecastRow) => now - Date.parse(r.fetched_at);
  const newest = rows.reduce<ForecastRow | null>((a, r) => (!a || r.fetched_at > a.fetched_at ? r : a), null);
  const ahead = [1, 2, 3].flatMap((n) => row(shiftDay(today, n)) ?? []);
  const usable = scale.days >= FEWEST_DAYS && scale.radiation_mj > 0 && ahead.some((r) => age(r) <= GONE_AFTER);
  const expected = (r: ForecastRow) => Math.round((r.radiation_mj * scale.solar_kwh) / scale.radiation_mj);
  const todays = row(today);
  const current = reading && now - Date.parse(reading.sampled_at) < READING_FOR ? reading : null;
  const sky: SkyWhen = current ? (skyAt(new Date(now)) === "day" ? "now" : "night") : "forecast";
  return {
    today: {
      day: today,
      soFar: so_far,
      expected: usable && todays ? expected(todays) : null,
      code: current ? observedCode(current) : (todays?.weather_code ?? null),
      sky,
    },
    days: usable ? ahead.map((r) => ({ day: r.day, expected: expected(r), code: r.weather_code })) : null,
    goodDay: scale.good_day,
    staleSince: usable && newest && age(newest) > STALE_AFTER ? newest.fetched_at : null,
    byHour: byHour(hourly),
  };
}

// Below this an hour's output is the panels' night-time noise, not daylight.
const MADE_AT_LEAST_KWH = 0.05;

function byHour({ scale, days, today, made_until }: Hourly): ByHour | null {
  if (today.length === 0 || days < FEWEST_DAYS) return null;
  const scales = perWm2(scale);
  const all = today.map(({ start_at, wm2, made_wh }) => ({
    start: start_at,
    expected: expectedKwh(scales, start_at, wm2),
    made: made_wh === null ? null : made_wh / 1000,
  }));
  const lit = (h: (typeof all)[number]) => h.expected > 0 || (h.made ?? 0) >= MADE_AT_LEAST_KWH;
  const hours = all.slice(all.findIndex(lit), all.findLastIndex(lit) + 1);
  if (hours.length === 0) return null;
  const at = made_until === null ? null : Date.parse(made_until);
  if (at === null || at <= Date.parse(hours[0].start)) return { hours, byNow: null };
  const gone = (start: string) => Math.min(1, Math.max(0, (at - Date.parse(start)) / HOUR));
  return {
    hours,
    byNow: {
      made: all.reduce((sum, h) => sum + (h.made ?? 0), 0),
      expected: hours.reduce((sum, h) => sum + h.expected * gone(h.start), 0),
      at: made_until!,
      // The forecast's last sunlit hour can end before the panels stop, so the day ends at sunset too.
      over: at >= Date.parse(hours.at(-1)!.start) + HOUR && skyAt(new Date(at)) === "night",
    },
  };
}
