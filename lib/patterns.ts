import { db } from "@/lib/db";
import { energySteps } from "@/lib/intervals/steps";
import type { Readings } from "@/lib/meter";
import { shiftDay } from "@/lib/scene/replay";

export type MonthLoad = { month: string; watts: number };
export type PowerwallYear = { year: number; out_wh: number; in_wh: number; first_day: string };
export type HourLoad = { month: string; hour: number; watts: number };
export type Patterns = { months: MonthLoad[]; years: PowerwallYear[]; hours: HourLoad[] };

// Months stay "YYYY-MM" and are moved in UTC, so the server's zone never shifts one.
const shift = (month: string, by: number) => new Date(Date.UTC(+month.slice(0, 4), +month.slice(5, 7) - 1 + by)).toISOString().slice(0, 7);

// The session runs in UTC, so every hour, day and year is taken in site time.
const SITE = "'America/Los_Angeles'";

// The three figures from days `from` up to `to`; the hour grid only from `hoursFrom`.
async function between(from: string, to: string, hoursFrom: string, readings: Readings): Promise<Patterns> {
  const [months, years, hours] = await Promise.all([
    // A night's intervals start 1:00 to 4:55 AM, Wh in 5 minutes x 12 is watts, and percentile_disc takes the lower
    // middle of an even count.
    db.query<MonthLoad>(
      `SELECT to_char(day, 'YYYY-MM') AS month, percentile_disc(0.5) WITHIN GROUP (ORDER BY watts) AS watts
       FROM (SELECT day, round(min(house_from_grid_wh + house_from_solar_wh + house_from_battery_wh) * 12)::int AS watts
             FROM ${energySteps(readings, "day >= $1 AND day < $2")} AS steps
             WHERE extract(hour FROM start_at AT TIME ZONE ${SITE}) BETWEEN 1 AND 4
             GROUP BY day HAVING count(*) >= 40) nights
       GROUP BY 1 ORDER BY 1`,
      [from, to],
    ),
    db.query<PowerwallYear>(
      `SELECT extract(year FROM day)::int AS year, sum(battery_exported_wh)::float8 AS out_wh,
         sum(battery_imported_from_grid_wh + battery_imported_from_solar_wh)::float8 AS in_wh, min(day)::text AS first_day
       FROM energy_interval WHERE day >= $1 AND day < $2 GROUP BY 1 ORDER BY 1`,
      [from, to],
    ),
    db.query<HourLoad>(
      `SELECT to_char(day, 'YYYY-MM') AS month, extract(hour FROM start_at AT TIME ZONE ${SITE})::int AS hour,
         round(avg(house_from_grid_wh + house_from_solar_wh + house_from_battery_wh) * 12)::int AS watts
       FROM ${energySteps(readings, "day >= $1 AND day < $2")} AS steps GROUP BY 1, 2 ORDER BY 1, 2`,
      [hoursFrom, to],
    ),
  ]);
  return { months: months.rows, years: years.rows, hours: hours.rows };
}

// The split year falls on both sides, so its two parts add up.
function joinYears(kept: PowerwallYear[], live: PowerwallYear[]) {
  const last = kept.at(-1);
  const first = live[0];
  if (!last || !first || last.year !== first.year) return [...kept, ...live];
  const year = { year: last.year, out_wh: last.out_wh + first.out_wh, in_wh: last.in_wh + first.in_wh, first_day: last.first_day };
  return [...kept.slice(0, -1), year, ...live.slice(1)];
}

const EVER = "1970-01-01";
const NEVER = "9999-12-31";

declare global {
  var patternsMonths: Map<string, Patterns> | undefined;
}
// A finished month's figures change only when anton rewrites stored days, which empties this (instrumentation.ts).
const keptMonths = (globalThis.patternsMonths ??= new Map());

// Keyed by the hour grid's window too: on the 1st the window moves on a month while the split stays. Each choice of
// readings keeps its own, and a new window or split forgets the old ones.
async function keptBefore(split: string, window: string, readings: Readings) {
  const span = `${window}..${split}`;
  const key = `${readings}:${span}`;
  const kept = keptMonths.get(key);
  if (kept) return kept;
  const worked = await between(EVER, split, window, readings);
  for (const old of keptMonths.keys()) if (!old.endsWith(`:${span}`)) keptMonths.delete(old);
  keptMonths.set(key, worked);
  return worked;
}

export async function patterns(today: string, readings: Readings): Promise<Patterns> {
  // Months before the one holding yesterday are finished; yesterday's last intervals arrive after midnight.
  const split = `${shiftDay(today, -1).slice(0, 7)}-01`;
  const window = `${shift(today.slice(0, 7), -23)}-01`;
  const [kept, live] = await Promise.all([keptBefore(split, window, readings), between(split, NEVER, split > window ? split : window, readings)]);
  return { months: [...kept.months, ...live.months], years: joinYears(kept.years, live.years), hours: [...kept.hours, ...live.hours] };
}

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

export type HourMonth = { month: string; watts: (number | null)[] };

export function hourGrids(hours: HourLoad[], today: string) {
  const month = (by: number): HourMonth => {
    const name = shift(today.slice(0, 7), by);
    const watts = Array<number | null>(24).fill(null);
    for (const row of hours) if (row.month === name) watts[row.hour] = row.watts;
    return { month: name, watts };
  };
  return {
    last: Array.from({ length: 12 }, (_, i) => month(i - 11)),
    before: Array.from({ length: 12 }, (_, i) => month(i - 23)),
  };
}

// Half-kilowatt steps from 1 kW: the house rarely draws under 0.5 kW, so the palest step takes everything below 1.
export const stepOf = (watts: number) => Math.min(6, Math.max(0, Math.floor((watts - 500) / 500)));
