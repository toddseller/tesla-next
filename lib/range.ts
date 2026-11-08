import { db } from "@/lib/db";
import { pyRound } from "@/lib/intervals/python";
import { shiftDay } from "@/lib/scene/replay";

// Until a Tesla service visit on this day, Tesla's grid readings were about half of PG&E's meter; earlier days with
// PG&E's readings take their grid figures from it (anton-tesla-api-ws models/data.py).
const METER_FIX_DATE = "2026-04-27";

// Flask's hybrid properties as SQLAlchemy renders them through psycopg 3: each literal is a typed parameter, so the
// meter's kWh are float8 and every CASE and sum that mixes them with the real columns is float8 too. The casts are
// what make the sums round as Flask's do.
const meter = (column: string) => `(SELECT meter_day.${column} / 1000.0::float8 FROM meter_day WHERE meter_day.date = data.date)`;
const corrected = `(data.date < '${METER_FIX_DATE}'::varchar AND ${meter("imported_wh")} IS NOT NULL)`;
const rawToGrid = "coalesce(data.to_grid, 0::integer) + coalesce(data.powerwall_to_grid, 0::integer)";
const effectiveToGrid = `CASE WHEN data.is_vpp = true THEN coalesce(data.to_grid, 0::integer) ELSE ${rawToGrid} END`;
export const gridIn = `CASE WHEN ${corrected} THEN ${meter("imported_wh")} ELSE data.from_grid END`;
export const gridOut = `CASE WHEN ${corrected} THEN ${meter("exported_wh")} ELSE ${effectiveToGrid} END`;
const extraImported = `CASE WHEN ${corrected} THEN ${meter("imported_wh")} - coalesce(data.from_grid, 0::integer) ELSE 0::integer END`;
const extraExported = `CASE WHEN ${corrected} THEN ${meter("exported_wh")} - (${rawToGrid}) ELSE 0::integer END`;
export const house = `coalesce(data.total_house_usage, 0::integer) + ${extraImported} - ${extraExported}`;
export const houseGrid = `coalesce(data.house_from_grid, 0::integer) + ${extraImported}`;
const solarLessExtra = `coalesce(data.house_from_solar, 0::integer) - ${extraExported}`;
export const houseSolar = `CASE WHEN ${solarLessExtra} < 0::integer THEN 0::integer ELSE ${solarLessExtra} END`;

const day = (year: number, month: number, date: number) => new Date(Date.UTC(year, month, date)).toISOString().slice(0, 10);
const parts = (date: string) => date.split("-").map(Number);
const monthLength = (year: number, month: number) => new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

// Flask's next_month: Jan 31 gives Feb 28 (29 in a leap year).
const nextMonth = (date: string) => {
  const [y, m, d] = parts(date);
  const [year, month] = m === 12 ? [y + 1, 0] : [y, m];
  return day(year, month, Math.min(d, monthLength(year, month)));
};

const endOfMonth = (date: string) => {
  const [y, m] = parts(date);
  return day(y, m - 1, monthLength(y, m - 1));
};

// Flask's get_time_range_list: month-long periods when neither end is a month boundary, calendar months otherwise.
export function periods(start: string, end: string): [string, string][] {
  const endsOnBoundary = parts(end)[2] >= 28;
  const list: [string, string][] = [];
  for (let first = start; ; ) {
    const last = parts(first)[2] !== 1 && !endsOnBoundary ? shiftDay(nextMonth(first), -1) : endOfMonth(first);
    const next = shiftDay(last, 1);
    if (next > end) return [...list, [first, end]];
    list.push([first, last]);
    first = next;
  }
}

export type RangeItem = { date: string; day?: string; solar: number | null; grid: number | null; house: number | null };

const monthName = (date: string) => new Date(`${date}T00:00:00Z`).toLocaleString("en-US", { month: "short", timeZone: "UTC" });
const dayLabel = (date: string) => `${monthName(date)} ${parts(date)[2]}`;
const periodLabel = (date: string) => `${monthName(date)}-${date.slice(2, 4)}`;
const round1 = (value: number | null) => (value === null ? null : pyRound(value, 1));

export type DayRow = {
  date: string; solar_generated: number; from_grid: number | null; to_grid: number | null; powerwall_to_grid: number | null;
  is_vpp: boolean; total_house_usage: number | null; meter_imported: number | null; meter_exported: number | null;
};

export const dayColumns = `date, solar_generated, from_grid, to_grid, powerwall_to_grid, is_vpp, total_house_usage,
  ${meter("imported_wh")} AS meter_imported, ${meter("exported_wh")} AS meter_exported`;

// Flask's solar_json: the grid and house in Python, from the columns as Python reads them.
export function dailyItem(row: DayRow): RangeItem {
  const isCorrected = row.date < METER_FIX_DATE && row.meter_imported !== null;
  const rawOut = (row.to_grid || 0) + (row.powerwall_to_grid || 0);
  const effectiveOut = row.is_vpp ? row.to_grid || 0 : rawOut;
  const gridIn = isCorrected ? row.meter_imported! : row.from_grid!;
  const gridOut = isCorrected ? row.meter_exported! : effectiveOut;
  const extraIn = isCorrected ? row.meter_imported! - (row.from_grid || 0) : 0;
  const extraOut = isCorrected ? row.meter_exported! - rawOut : 0;
  return {
    date: dayLabel(row.date),
    day: row.date,
    solar: row.solar_generated,
    grid: pyRound(gridIn - gridOut, 1),
    house: pyRound((row.total_house_usage || 0) + extraIn - extraOut, 1),
  };
}

// Daily items up to 31 days after the start, Flask's periods beyond, as Flask's /api/v2/formatted answers.
export async function rangeTotals(start: string, end: string): Promise<RangeItem[]> {
  if (Date.parse(end) - Date.parse(start) <= 31 * 86_400_000) {
    const { rows } = await db.query<DayRow>(
      `SELECT ${dayColumns} FROM data WHERE date BETWEEN $1 AND $2 ORDER BY id`,
      [start, end],
    );
    return rows.map(dailyItem);
  }
  const list = periods(start, end);
  // One query, but each period summed by its own scan as Flask's per-period queries are, so float sums add in the same order.
  const { rows } = await db.query<{ solar: number | null; from_grid: number | null; to_grid: number | null; house: number | null }>(
    `SELECT s.* FROM unnest($1::varchar[], $2::varchar[]) WITH ORDINALITY AS p(first, last, n)
     CROSS JOIN LATERAL (
       SELECT sum(data.solar_generated) AS solar, sum(${gridIn}) AS from_grid, sum(${gridOut}) AS to_grid, sum(${house}) AS house
       FROM data WHERE data.date BETWEEN p.first AND p.last
     ) s ORDER BY p.n`,
    [list.map(([first]) => first), list.map(([, last]) => last)],
  );
  return rows.map((row, i) => ({
    date: periodLabel(list[i][0]),
    solar: round1(row.solar),
    grid: row.from_grid === null && row.to_grid === null ? null : round1(row.from_grid! - row.to_grid!),
    house: round1(row.house),
  }));
}
