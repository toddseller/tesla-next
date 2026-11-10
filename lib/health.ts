import { db } from "@/lib/db";

export type MonthLoad = { month: string; watts: number };
export type PowerwallYear = { year: number; out_wh: number; in_wh: number; first_day: string };
export type Health = { months: MonthLoad[]; years: PowerwallYear[] };

// The session runs in UTC, so every hour, day and year is taken in site time.
const SITE = "'America/Los_Angeles'";

export async function health(): Promise<Health> {
  const [months, years] = await Promise.all([
    // A night's intervals start 1:00 to 4:55 AM, Wh in 5 minutes x 12 is watts, and percentile_disc takes the lower
    // middle of an even count.
    db.query<MonthLoad>(
      `SELECT to_char(day, 'YYYY-MM') AS month, percentile_disc(0.5) WITHIN GROUP (ORDER BY watts) AS watts
       FROM (SELECT day, min(house_from_grid_wh + house_from_solar_wh + house_from_battery_wh) * 12 AS watts
             FROM energy_interval
             WHERE extract(hour FROM start_at AT TIME ZONE ${SITE}) BETWEEN 1 AND 4
             GROUP BY day HAVING count(*) >= 40) nights
       GROUP BY 1 ORDER BY 1`,
    ),
    db.query<PowerwallYear>(
      `SELECT extract(year FROM day)::int AS year, sum(battery_exported_wh)::float8 AS out_wh,
         sum(battery_imported_from_grid_wh + battery_imported_from_solar_wh)::float8 AS in_wh, min(day)::text AS first_day
       FROM energy_interval GROUP BY 1 ORDER BY 1`,
    ),
  ]);
  return { months: months.rows, years: years.rows };
}

// Months stay "YYYY-MM" and are moved in UTC, so the server's zone never shifts one.
const shift = (month: string, by: number) => new Date(Date.UTC(+month.slice(0, 4), +month.slice(5, 7) - 1 + by)).toISOString().slice(0, 7);
const monthName = (month: string) => new Date(`${month}-01T00:00:00Z`).toLocaleString("en-US", { month: "long", timeZone: "UTC" });
const named = (month: string) => `${monthName(month)} ${month.slice(0, 4)}`;
const wattsIn = (months: MonthLoad[], month: string) => months.find((m) => m.month === month)?.watts ?? null;

export function latestFigures(months: MonthLoad[], today: string) {
  const latest = months.at(-1);
  if (!latest) return null;
  const earlier = shift(latest.month, -12);
  const before = wattsIn(months, earlier);
  return {
    label: latest.month === today.slice(0, 7) ? `${monthName(latest.month)} so far` : named(latest.month),
    watts: latest.watts,
    before: before === null ? null : { label: named(earlier), watts: before },
    kwhPerDay: before === null ? null : Math.round(((latest.watts - before) * 24) / 1000),
  };
}

export function sameMonth(months: MonthLoad[]) {
  const latest = months.at(-1)!.month;
  return {
    name: monthName(latest),
    rows: months.filter((m) => m.month.slice(5) === latest.slice(5)).map((m) => ({ year: +m.month.slice(0, 4), watts: m.watts })),
  };
}

export function lastTwelve(months: MonthLoad[]) {
  const latest = months.at(-1)!.month;
  return Array.from({ length: 12 }, (_, i) => {
    const month = shift(latest, i - 11);
    return { month, watts: wattsIn(months, month), before: wattsIn(months, shift(month, -12)) };
  });
}

// The three Powerwalls' rated size.
const CYCLE_KWH = 40.5;

export function powerwallYears(years: PowerwallYear[], today: string) {
  const rows = years.map(({ year, out_wh, in_wh, first_day }, i) => ({
    year,
    note: year === +today.slice(0, 4) ? "so far"
      : i === 0 && !first_day.endsWith("-01-01")
        ? `from ${new Date(`${first_day}T00:00:00Z`).toLocaleString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}`
        : null,
    kwh: Math.round(out_wh / 1000),
    cycles: Math.round(out_wh / 1000 / CYCLE_KWH),
    roundTrip: in_wh ? Math.round((100 * out_wh) / in_wh) : null,
  }));
  const out = years.reduce((sum, y) => sum + y.out_wh, 0) / 1000;
  return { rows, total: { kwh: Math.round(out), cycles: Math.round(out / CYCLE_KWH) } };
}
