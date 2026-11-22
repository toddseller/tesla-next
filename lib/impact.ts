import { db } from "@/lib/db";
import { pyRound } from "@/lib/intervals/python";
import type { Readings } from "@/lib/meter";
import { dailySql } from "@/lib/range";

export type ImpactFigures = {
  from_solar_percentage: number; from_powerwall_percentage: number; from_grid_percentage: number;
  self_powered_percentage: number; total_solar_percentage: number;
  total_solar: number; from_solar: number; from_powerwall: number; from_grid: number; total_house: number;
};

type Sums = { total_solar: number | null; from_powerwall: number | null; from_solar: number | null; from_grid: number | null; total_house: number | null };

// Ported from anton-tesla-api-ws's get_impact_data (models/data.py).
export async function impactFigures(start: string, end: string, readings: Readings): Promise<ImpactFigures> {
  const { house, houseGrid, houseSolar } = dailySql(readings);
  const { rows: [sums] } = await db.query<Sums>(
    `SELECT sum(data.solar_generated) AS total_solar, sum(data.house_from_powerwall) AS from_powerwall,
       sum(${houseSolar}) AS from_solar, sum(${houseGrid}) AS from_grid, sum(${house}) AS total_house
     FROM data WHERE data.date BETWEEN $1 AND $2`,
    [start, end],
  );
  // A range with no saved days sums to null.
  const [totalSolar, fromPowerwall, fromSolar, fromGrid, totalHouse] =
    [sums.total_solar, sums.from_powerwall, sums.from_solar, sums.from_grid, sums.total_house].map((value) => value || 0);
  const percentage = (part: number) => (totalHouse ? pyRound((100 * part) / totalHouse) : 0);
  const [solarShare, powerwallShare] = [percentage(fromSolar), percentage(fromPowerwall)];
  return {
    from_solar_percentage: solarShare,
    from_powerwall_percentage: powerwallShare,
    from_grid_percentage: percentage(fromGrid),
    self_powered_percentage: solarShare + powerwallShare,
    total_solar_percentage: percentage(totalSolar),
    total_solar: pyRound(totalSolar, 1),
    from_solar: pyRound(fromSolar, 1),
    from_powerwall: pyRound(fromPowerwall, 1),
    from_grid: pyRound(fromGrid, 1),
    total_house: pyRound(totalHouse, 1),
  };
}

// The same sums by month, unrounded, so running totals add up to Impact's figure for the whole span.
export async function impactByMonth(start: string, end: string, readings: Readings) {
  const { house } = dailySql(readings);
  const { rows } = await db.query<{ month: string; solar: number | null; house: number | null }>(
    `SELECT substr(data.date, 1, 7) AS month, sum(data.solar_generated)::float8 AS solar, sum(${house})::float8 AS house
     FROM data WHERE data.date BETWEEN $1 AND $2 GROUP BY month ORDER BY month`,
    [start, end],
  );
  return rows.map((r) => ({ month: r.month, solar: r.solar ?? 0, house: r.house ?? 0 }));
}
