import { db } from "@/lib/db";
import { pyRound } from "@/lib/intervals/python";
import { isTrueUpYear, loadPricing } from "@/lib/true-up/cost";
import { cycleGrids, METER_FIX_DATE } from "@/lib/true-up/grid";
import { type DayGrid, inEffect, minimumDelivery, newestFirst, priceDays } from "@/lib/true-up/pricing";
import { generationCharges, westlightIn } from "@/lib/true-up/westlight";

export type CaseDays = Record<string, { solarOnly: DayGrid; noSystem: DayGrid }>;

// Each day's grid in Wh as it would have been with solar and no Powerwalls, and with neither. The house's use includes
// car charging. Before the meter fix, Tesla's grid readings were about half of PG&E's, so on days with PG&E's reading
// each period's imports and exports are scaled to the meter and the house's use moves with them; a period Tesla saw
// no flow in gets the meter's energy spread evenly over its intervals. The query returns days, not intervals, since a
// true-up year holds about 105,000 of them.
export async function caseDays(first: string, last: string): Promise<CaseDays> {
  const { rows } = await db.query<Record<"day" | "no_imported" | "no_peak" | "so_imported" | "so_exported" | "so_peak", string>>(
    `WITH interval AS (
       SELECT day, solar_generated_wh AS solar, grid_imported_wh AS grid_in,
         grid_exported_from_solar_wh + grid_exported_from_battery_wh AS grid_out,
         house_from_grid_wh + house_from_solar_wh + house_from_battery_wh AS house,
         extract(hour FROM timezone('America/Los_Angeles', start_at)) BETWEEN 16 AND 20 AS peak
       FROM energy_interval WHERE day BETWEEN $1 AND $2
     ), period AS (
       SELECT i.*, count(*) OVER w AS n, sum(grid_in) OVER w AS tesla_in, sum(grid_out) OVER w AS tesla_out,
         CASE WHEN peak THEN m.peak_imported_wh ELSE m.imported_wh - m.peak_imported_wh END AS meter_in,
         CASE WHEN peak THEN m.peak_exported_wh ELSE m.exported_wh - m.peak_exported_wh END AS meter_out
       FROM interval i LEFT JOIN meter_day m ON m.date = i.day::text AND i.day < $3
       WINDOW w AS (PARTITION BY i.day, i.peak)
     ), scaled AS (
       SELECT day, peak, solar, house
         + CASE WHEN meter_in IS NULL THEN grid_in WHEN tesla_in > 0 THEN grid_in * meter_in::numeric / tesla_in ELSE meter_in::numeric / n END - grid_in
         - (CASE WHEN meter_out IS NULL THEN grid_out WHEN tesla_out > 0 THEN grid_out * meter_out::numeric / tesla_out ELSE meter_out::numeric / n END - grid_out)
         AS house
       FROM period
     )
     SELECT day::text AS day, sum(house) AS no_imported, sum(house) FILTER (WHERE peak) AS no_peak,
       sum(greatest(house - solar, 0)) AS so_imported, sum(greatest(solar - house, 0)) AS so_exported,
       sum(house - solar) FILTER (WHERE peak) AS so_peak
     FROM scaled GROUP BY day`,
    [first, last, METER_FIX_DATE],
  );
  return Object.fromEntries(rows.map((row) => [row.day, {
    solarOnly: { imported: Number(row.so_imported), exported: Number(row.so_exported), peak_net: Number(row.so_peak ?? 0) },
    noSystem: { imported: Number(row.no_imported), exported: 0, peak_net: Number(row.no_peak ?? 0) },
  }]));
}

// WestLight's rates are known from August 2024, so '24 - '25 is the first true-up year that can be priced in full.
const FIRST_YEAR = "2024-10-01";

// A true-up year's cost to the house so far in three cases, each PG&E's NEM charges plus WestLight's generation, all
// calculated from the same days so their differences come from the energy alone: actual, solar with no Powerwalls, and
// no system. Null for any other range, or before a day with data.
export async function trueUpSavings(start: string, end: string) {
  if (!isTrueUpYear(start, end) || start < FIRST_YEAR) return null;
  const [cycles, { revisions }] = await Promise.all([cycleGrids(start, end), loadPricing()]);
  const started = cycles.filter(({ row }) => row.through !== null);
  if (!started.length) return null;
  const first = started[0].row.first_day;
  const through = started.at(-1)!.row.through!;
  const others = await caseDays(first, through);
  const minimum = minimumDelivery(first, through, revisions);

  // PG&E keeps unused NEM credit, so a NEM case costs at least the minimum delivery charges; without solar there is no
  // NEM. WestLight cashes its credit out, so its charges count in full.
  const cost = (daysOf: (grid: (typeof started)[number]["grid"]) => Record<string, DayGrid>, nem: boolean) => {
    let [pge, westlight] = [0, 0];
    for (const { row, grid } of started) {
      const days = daysOf(grid);
      const charges = priceDays(row.first_day, row.through!, days, revisions);
      const generation = generationCharges(row.first_day, row.through!, days);
      if (charges === null || generation === null) return null;
      pge += charges;
      westlight += generation.total;
    }
    pge = pyRound(nem ? Math.max(pge, minimum) : pge, 2);
    westlight = pyRound(westlight, 2);
    return { pge, westlight, total: pyRound(pge + westlight, 2) };
  };
  const pick = (name: "solarOnly" | "noSystem") => Object.fromEntries(Object.entries(others).map(([day, cases]) => [day, cases[name]]));
  // A day with PG&E's reading but no 5-minute data has nothing to rebuild the other cases from, so it counts in none.
  const actual = cost((grid) => Object.fromEntries(Object.entries(grid.days).filter(([day]) => day in others)), true);
  const solarOnly = cost(() => pick("solarOnly"), true);
  const noSystem = cost(() => pick("noSystem"), false);
  if (!actual || !solarOnly || !noSystem) return null;
  return {
    actual, solar_only: solarOnly, no_system: noSystem,
    solar_saved: pyRound(noSystem.total - solarOnly.total, 2),
    powerwalls_added: pyRound(solarOnly.total - actual.total, 2),
    rebuilt_days: started.reduce((count, { grid }) => count + [...grid.meter].filter((day) => day in others).length, 0),
    uncorrected_days: started.reduce((count, { row }) => count + row.uncorrected_days, 0),
    through,
    pge_rates: inEffect(through, newestFirst(revisions))!.effective_date,
    westlight_rates: westlightIn(through)!.effective_date,
  };
}

export type Savings = NonNullable<Awaited<ReturnType<typeof trueUpSavings>>>;
