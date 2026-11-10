import { db } from "@/lib/db";
import { shiftDay } from "@/lib/scene/replay";

export type ForecastRow = { day: string; radiation_mj: number; weather_code: number; fetched_at: string };
// The 30 days before today with both a solar total and a forecast: their kWh, forecast MJ/m², count and best day.
export type Scale = { solar_kwh: number; radiation_mj: number; days: number; good_day: number | null };
export type ForecastData = { scale: Scale; rows: ForecastRow[]; so_far: number | null };

export type ForecastCard = {
  // The day the card was worked out for, so a page left open past midnight names its days from the data.
  today: { day: string; soFar: number | null; expected: number | null; code: number | null };
  days: { day: string; expected: number; code: number }[] | null;
  goodDay: number | null;
  staleSince: string | null;
};

export async function forecast(today: string): Promise<ForecastData> {
  const [scale, rows, soFar] = await Promise.all([
    db.query<Scale>(
      `SELECT coalesce(sum(d.solar_generated), 0)::float8 AS solar_kwh, coalesce(sum(f.radiation_mj), 0)::float8 AS radiation_mj,
         count(*)::int AS days, max(d.solar_generated)::float8 AS good_day
       FROM data d JOIN solar_forecast f ON f.day = d.date::date
       WHERE d.date::date BETWEEN $1::date - 30 AND $1::date - 1 AND d.solar_generated IS NOT NULL`,
      [today],
    ),
    db.query<Omit<ForecastRow, "fetched_at"> & { fetched_at: Date }>(
      // radiation_mj is real; rounded so 12.83 doesn't arrive as 12.829999923706055.
      `SELECT day::text, round(radiation_mj::numeric, 2)::float8 AS radiation_mj, weather_code, fetched_at
       FROM solar_forecast WHERE day BETWEEN $1::date AND $1::date + 3 ORDER BY day`,
      [today],
    ),
    db.query<{ so_far: number }>("SELECT round(solar_generated::numeric, 2)::float8 AS so_far FROM data WHERE date = $1", [today]),
  ]);
  return {
    scale: scale.rows[0],
    rows: rows.rows.map((row) => ({ ...row, fetched_at: row.fetched_at.toISOString() })),
    so_far: soFar.rows[0]?.so_far ?? null,
  };
}

const HOUR = 3_600_000;
// Several missed hourly fetches; a day without one means anton has stopped, and the days ahead are guesses.
const STALE_AFTER = 6 * HOUR;
const GONE_AFTER = 24 * HOUR;
const FEWEST_DAYS = 7;

export function forecastCard({ scale, rows, so_far }: ForecastData, today: string, now: number): ForecastCard {
  const row = (day: string) => rows.find((r) => r.day === day);
  const age = (r: ForecastRow) => now - Date.parse(r.fetched_at);
  const newest = rows.reduce<ForecastRow | null>((a, r) => (!a || r.fetched_at > a.fetched_at ? r : a), null);
  const ahead = [1, 2, 3].flatMap((n) => row(shiftDay(today, n)) ?? []);
  const usable = scale.days >= FEWEST_DAYS && scale.radiation_mj > 0 && ahead.some((r) => age(r) <= GONE_AFTER);
  const expected = (r: ForecastRow) => Math.round((r.radiation_mj * scale.solar_kwh) / scale.radiation_mj);
  const todays = row(today);
  return {
    today: { day: today, soFar: so_far, expected: usable && todays ? expected(todays) : null, code: todays?.weather_code ?? null },
    days: usable ? ahead.map((r) => ({ day: r.day, expected: expected(r), code: r.weather_code })) : null,
    goodDay: scale.good_day,
    staleSince: usable && newest && age(newest) > STALE_AFTER ? newest.fetched_at : null,
  };
}
