import { db } from "@/lib/db";
import { pyRound } from "@/lib/intervals/python";
import { METER_FIX_DATE, type Readings } from "@/lib/meter";
import { periods } from "@/lib/solar/ranges";

// Days before the fix with PG&E's readings take their grid figures from them (anton-tesla-api-ws models/data.py).

// anton-tesla-api-ws's hybrid properties as SQLAlchemy rendered them through psycopg 3: each literal is a typed parameter, so the
// meter's kWh are float8 and every CASE and sum that mixes them with the real columns is float8 too. The casts are
// what keep the sums rounding as the site has always shown them.
const meter = (column: string) => `(SELECT meter_day.${column} / 1000.0::float8 FROM meter_day WHERE meter_day.date = data.date)`;
const rawToGrid = "coalesce(data.to_grid, 0::integer) + coalesce(data.powerwall_to_grid, 0::integer)";
const effectiveToGrid = `CASE WHEN data.is_vpp = true THEN coalesce(data.to_grid, 0::integer) ELSE ${rawToGrid} END`;

// The daily figures' SQL, over the `data` table. Tesla's readings keep the same expressions with the correction never
// applying, so the corrected sums keep the types and order that make them round as they always have.
export function dailySql(readings: Readings) {
  const corrected = readings === "tesla" ? "false" : `(data.date < '${METER_FIX_DATE}'::varchar AND ${meter("imported_wh")} IS NOT NULL)`;
  const extraImported = `CASE WHEN ${corrected} THEN ${meter("imported_wh")} - coalesce(data.from_grid, 0::integer) ELSE 0::integer END`;
  const extraExported = `CASE WHEN ${corrected} THEN ${meter("exported_wh")} - (${rawToGrid}) ELSE 0::integer END`;
  const solarLessExtra = `coalesce(data.house_from_solar, 0::integer) - ${extraExported}`;
  return {
    gridIn: `CASE WHEN ${corrected} THEN ${meter("imported_wh")} ELSE data.from_grid END`,
    gridOut: `CASE WHEN ${corrected} THEN ${meter("exported_wh")} ELSE ${effectiveToGrid} END`,
    house: `coalesce(data.total_house_usage, 0::integer) + ${extraImported} - ${extraExported}`,
    houseGrid: `coalesce(data.house_from_grid, 0::integer) + ${extraImported}`,
    houseSolar: `CASE WHEN ${solarLessExtra} < 0::integer THEN 0::integer ELSE ${solarLessExtra} END`,
  };
}

const parts = (date: string) => date.split("-").map(Number);

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

// anton's solar_json: the grid and house in Python, from the columns as Python reads them.
export function dailyItem(row: DayRow, readings: Readings): RangeItem {
  const isCorrected = readings !== "tesla" && row.date < METER_FIX_DATE && row.meter_imported !== null;
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

// Daily items up to 31 days after the start, periods beyond.
export async function rangeTotals(start: string, end: string, readings: Readings): Promise<RangeItem[]> {
  if (Date.parse(end) - Date.parse(start) <= 31 * 86_400_000) {
    const { rows } = await db.query<DayRow>(
      `SELECT ${dayColumns} FROM data WHERE date BETWEEN $1 AND $2 ORDER BY id`,
      [start, end],
    );
    return rows.map((row) => dailyItem(row, readings));
  }
  const list = periods(start, end);
  const { gridIn, gridOut, house } = dailySql(readings);
  // One query, but each period summed by its own scan as anton's per-period queries were, so float sums add in the order they always have.
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
