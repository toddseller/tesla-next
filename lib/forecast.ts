import { db } from "@/lib/db";
import { shiftDay } from "@/lib/scene/replay";
import { skyAt } from "@/lib/scene/sun";

export type ForecastRow = { day: string; radiation_mj: number; weather_code: number; fetched_at: string };
// The 30 days before today with both a solar total and a forecast: their kWh, forecast MJ/m², count and best day.
export type Scale = { solar_kwh: number; radiation_mj: number; days: number; good_day: number | null };
export type Reading = { code: number; sampled_at: string };
export type ForecastData = { scale: Scale; rows: ForecastRow[]; so_far: number | null; reading: Reading | null };

export type SkyWhen = "forecast" | "now" | "night";

export type ForecastCard = {
  // The day the card was worked out for, so a page left open past midnight names its days from the data.
  today: { day: string; soFar: number | null; expected: number | null; code: number | null; sky: SkyWhen };
  days: { day: string; expected: number; code: number }[] | null;
  goodDay: number | null;
  staleSince: string | null;
};

export async function forecast(today: string): Promise<ForecastData> {
  const [scale, rows, soFar, reading] = await Promise.all([
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
    db.query<{ code: number; sampled_at: Date }>("SELECT weather_code AS code, sampled_at FROM weather_sample ORDER BY sampled_at DESC LIMIT 1"),
  ]);
  const newest = reading.rows[0];
  return {
    scale: scale.rows[0],
    rows: rows.rows.map((row) => ({ ...row, fetched_at: row.fetched_at.toISOString() })),
    so_far: soFar.rows[0]?.so_far ?? null,
    reading: newest ? { code: newest.code, sampled_at: newest.sampled_at.toISOString() } : null,
  };
}

const HOUR = 3_600_000;
// Several missed hourly fetches; a day without one means anton has stopped, and the days ahead are guesses.
const STALE_AFTER = 6 * HOUR;
const GONE_AFTER = 24 * HOUR;
const FEWEST_DAYS = 7;
// As the scene treats a reading: older than this, it no longer stands for the sky.
const READING_FOR = 3 * HOUR;

export function forecastCard({ scale, rows, so_far, reading }: ForecastData, today: string, now: number): ForecastCard {
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
      code: current?.code ?? todays?.weather_code ?? null,
      sky,
    },
    days: usable ? ahead.map((r) => ({ day: r.day, expected: expected(r), code: r.weather_code })) : null,
    goodDay: scale.good_day,
    staleSince: usable && newest && age(newest) > STALE_AFTER ? newest.fetched_at : null,
  };
}
