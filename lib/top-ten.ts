import { EVENTS } from "@/lib/backup";
import { db } from "@/lib/db";
import { pyRound } from "@/lib/intervals/python";
import { dailyItem, dayColumns, type DayRow, gridIn, gridOut } from "@/lib/range";

export type SolarDay = { date: string; solar: number; day: string };
export type GridDay = { date: string; net_grid: number; day: string };
export type GridMonth = { date: string; net_grid: number; month: string };
export type OutageDay = { date: string; hours: number; day: string };
// One shape for the route, the server page and the page's reloads.
export type TopTen = [{ solar: SolarDay[] }, { net_grid: GridDay[] }, { to_grid_months: GridMonth[] }, { outages: OutageDay[] }];

const dayLabel = (day: string) =>
  new Date(`${day}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
const monthLabel = (month: string) =>
  new Date(`${month}-01T00:00:00Z`).toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });

// Figures that read the same to a tenth rank newest first, so the queries also return rows within 0.1 kWh of the
// 10th: one of them can take 10th place.
const ten = <T>(rows: T[], shown: (row: T) => number, date: (row: T) => string) =>
  rows.sort((a, b) => shown(a) - shown(b) || date(b).localeCompare(date(a))).slice(0, 10);

const net = `coalesce(${gridIn}, 0::integer) - ${gridOut}`;

export async function topTen(withVpp: boolean): Promise<TopTen> {
  const kept = withVpp ? "true" : "NOT data.is_vpp";
  const [solar, days, months, outages] = await Promise.all([
    db.query<{ date: string; solar_generated: number }>(
      `SELECT date, solar_generated FROM data WHERE solar_generated >=
         (SELECT min(v) FROM (SELECT solar_generated AS v FROM data WHERE solar_generated IS NOT NULL ORDER BY v DESC LIMIT 10) t) - 0.1`,
    ),
    db.query<DayRow>(
      `SELECT ${dayColumns} FROM data WHERE ${kept} AND ${net} <= (SELECT max(v) FROM (SELECT ${net} AS v FROM data WHERE ${kept} ORDER BY v LIMIT 10) t) + 0.1`,
    ),
    db.query<{ month: string; net: number }>(
      `WITH months AS (SELECT substr(data.date, 1, 7) AS month, sum(coalesce(${gridIn}, 0::integer)) - sum(${gridOut}) AS net FROM data WHERE ${kept} GROUP BY month)
       SELECT month, net FROM months WHERE net <= (SELECT max(net) FROM (SELECT net FROM months ORDER BY net LIMIT 10) t) + 0.1`,
    ),
    // A few dozen outages, so all of them are read and ranked here.
    db.query<{ day: string; hours: number }>(
      `SELECT timezone('America/Los_Angeles', start_at)::date::text AS day, extract(epoch FROM end_at - start_at)::float8 / 3600 AS hours
       FROM (${EVENTS}) e WHERE kind = 'outage'`,
    ),
  ]);
  return [
    { solar: ten(solar.rows.map((r) => ({ date: dayLabel(r.date), solar: r.solar_generated, day: r.date })), (r) => -pyRound(r.solar, 1), (r) => r.day) },
    { net_grid: ten(days.rows.map((r) => ({ date: dayLabel(r.date), net_grid: dailyItem(r).grid!, day: r.date })), (r) => r.net_grid, (r) => r.day) },
    { to_grid_months: ten(months.rows.map((r) => ({ date: monthLabel(r.month), net_grid: pyRound(r.net, 1), month: r.month })), (r) => r.net_grid, (r) => r.month) },
    { outages: ten(outages.rows.map((r) => ({ date: dayLabel(r.day), hours: pyRound(r.hours, 1), day: r.day })), (r) => -r.hours, (r) => r.day) },
  ];
}
