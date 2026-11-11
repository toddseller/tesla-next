import { cache } from "react";

import { db } from "@/lib/db";
import { pyRound } from "@/lib/intervals/python";
import { METER_FIX_DATE } from "@/lib/meter";
import { shiftDay, siteToday } from "@/lib/scene/replay";
import type { DayGrid } from "@/lib/true-up/pricing";
import { billingCycles, endYearOf, OCTOBER, readsFor, trueUpLabel } from "@/lib/true-up/reads";

export type Grid = { days: Record<string, DayGrid>; meter: Set<string> };

// Each day's grid energy in Wh for the days with data, and the days that use PG&E's readings. Exported includes the
// Powerwall's exports on VPP days, as PG&E's meter counts them. Peak is intervals starting 4 p.m. to 8:55 p.m. site time.
export async function dailyGrid(first: string, last: string): Promise<Grid> {
  const [meterRows, intervalRows] = await Promise.all([
    db.query<{ day: string; imported: number; exported: number; peak_net: number }>(
      `SELECT date AS day, imported_wh AS imported, exported_wh AS exported, peak_imported_wh - peak_exported_wh AS peak_net
       FROM meter_day WHERE date BETWEEN $1 AND $2 AND date < $3`,
      [first, last, METER_FIX_DATE],
    ),
    // Sums of integers come back as bigint strings.
    db.query<{ day: string; imported: string; exported: string; peak_net: string }>(
      `SELECT day::text AS day, sum(grid_imported_wh) AS imported, sum(grid_exported_from_solar_wh + grid_exported_from_battery_wh) AS exported,
         sum(CASE WHEN extract(hour FROM timezone('America/Los_Angeles', start_at)) >= 16
                   AND extract(hour FROM timezone('America/Los_Angeles', start_at)) < 21
              THEN grid_imported_wh - grid_exported_from_solar_wh - grid_exported_from_battery_wh ELSE 0 END) AS peak_net
       FROM energy_interval WHERE day BETWEEN $1 AND $2 GROUP BY day`,
      [first, last],
    ),
  ]);
  const days: Record<string, DayGrid> = {};
  for (const { day, imported, exported, peak_net } of meterRows.rows) days[day] = { imported, exported, peak_net };
  const meter = new Set(Object.keys(days));
  for (const row of intervalRows.rows)
    if (!meter.has(row.day)) days[row.day] = { imported: Number(row.imported), exported: Number(row.exported), peak_net: Number(row.peak_net) };
  return { days, meter };
}

export const within = ({ days, meter }: Grid, first: string, last: string): Grid => ({
  days: Object.fromEntries(Object.entries(days).filter(([day]) => first <= day && day <= last)),
  meter: new Set([...meter].filter((day) => first <= day && day <= last)),
});

const kwh = (wh: number) => pyRound(wh / 1000, 1);

// Grid energy over a billing cycle, in kWh, from its days.
export function cycleRow(first: string, last: string, trueUp: string, { days, meter }: Grid) {
  const row = {
    first_day: first, last_day: last, true_up: trueUp,
    through: null as string | null, imported: null as number | null, exported: null as number | null, net: null as number | null,
    peak_net: null as number | null, off_peak_net: null as number | null, uncorrected_days: 0,
  };
  const totals = Object.values(days);
  if (!totals.length) return row;
  const sum = (pick: (d: DayGrid) => number) => totals.reduce((s, d) => s + pick(d), 0);
  const [imported, exported, peak] = [sum((d) => d.imported), sum((d) => d.exported), sum((d) => d.peak_net)];
  const through = Object.keys(days).sort().at(-1)!;
  // Days so far that still carry Tesla's faulty grid readings.
  let uncorrected = 0;
  for (let day = first; day <= through && day < METER_FIX_DATE; day = shiftDay(day, 1)) if (!meter.has(day)) uncorrected += 1;
  return {
    ...row, through, imported: kwh(imported), exported: kwh(exported), net: kwh(imported - exported),
    peak_net: kwh(peak), off_peak_net: kwh(imported - exported - peak), uncorrected_days: uncorrected,
  };
}

export type CycleRow = ReturnType<typeof cycleRow>;

type CycleGrid = { grid: Grid; row: CycleRow };

async function loadGrids(start: string, end: string): Promise<CycleGrid[]> {
  const spans = await billingCycles(start, end);
  if (!spans.length) return [];
  const all = await dailyGrid(spans[0][0], spans.at(-1)![1]);
  // A cycle belongs to the true-up year of its last day; each year's October read is looked up once.
  const years = [...new Set(spans.map(([, last]) => Number(last.slice(0, 4))))];
  const october = new Map(await Promise.all(years.map(async (year) => [year, (await readsFor(year))[OCTOBER]] as const)));
  return spans.map(([first, last]) => {
    const grid = within(all, first, last);
    return { grid, row: cycleRow(first, last, trueUpLabel(endYearOf(last, october.get(Number(last.slice(0, 4)))!)), grid) };
  });
}

// By a month after a range ends, PG&E's October read is in and the meter days anton's scheduler adds a day and a half
// late (with no rewrite notice) have arrived.
const KEPT_AFTER_DAYS = 31;

declare global {
  var trueUpGrids: Map<string, CycleGrid[]> | undefined;
}
// A finished range's days change only when anton rewrites stored data, which empties this (instrumentation.ts).
const keptRanges = (globalThis.trueUpGrids ??= new Map<string, CycleGrid[]>());

// One row per PG&E billing cycle starting in the range, with each cycle's days for pricing it. The True-Up Tracker's
// cycles, cost and savings each ask for the same year, so one page render shares one load.
export const cycleGrids = cache(async (start: string, end: string) => {
  const key = `${start}..${end}`;
  const kept = keptRanges.get(key);
  if (kept) return kept;
  const grids = await loadGrids(start, end);
  // Only whole true-up years, as the cost comparison and Payback ask for: a range from an address could be anything, and
  // keeping each would let anyone grow the memory without end. (cost.ts' isTrueUpYear can't be imported here: it imports this.)
  const trueUpYear = start.slice(5) === "10-01" && end === `${Number(start.slice(0, 4)) + 1}-09-30`;
  if (trueUpYear && end < shiftDay(siteToday(), -KEPT_AFTER_DAYS)) keptRanges.set(key, grids);
  return grids;
});

export const cycles = async (start: string, end: string) => (await cycleGrids(start, end)).map(({ row }) => row);
