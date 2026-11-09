import { db } from "@/lib/db";
import { pyRound } from "@/lib/intervals/python";
import { isTrueUpYear, loadPricing } from "@/lib/true-up/cost";
import { cycleGrids, METER_FIX_DATE } from "@/lib/true-up/grid";
import { type DayGrid, inEffect, minimumDelivery, newestFirst, priceDays } from "@/lib/true-up/pricing";
import { generationCharges, westlightIn } from "@/lib/true-up/westlight";

// Beside the two cases, each day's shortfall from 4 to 9 p.m. (the solar-only case's imports then), its solar-only exports
// then, and what the Powerwalls did, all in Wh, and whether it is marked as a VPP event day.
export type CaseDay = {
  solarOnly: DayGrid; noSystem: DayGrid; shortfall: number; peakExported: number; vpp: boolean;
  powerwalls: { peak: number; charged: number; discharged: number };
};
export type CaseDays = Record<string, CaseDay>;

// Each day's grid in Wh as it would have been with solar and no Powerwalls, and with neither. The house's use includes
// car charging. Before the meter fix, Tesla's grid readings were about half of PG&E's, so on days with PG&E's reading
// each period's imports and exports are scaled to the meter and the house's use moves with them; a period Tesla saw
// no flow in gets the meter's energy spread evenly over its intervals. The query returns days, not intervals, since a
// true-up year holds about 105,000 of them.
export async function caseDays(first: string, last: string): Promise<CaseDays> {
  type Row = Record<"day" | "no_imported" | "no_peak" | "so_imported" | "so_exported" | "so_peak" | "shortfall" | "peak_exported" | "pw_peak" | "charged" | "discharged", string> & { vpp: boolean };
  const { rows } = await db.query<Row>(
    `WITH interval AS (
       SELECT day, solar_generated_wh AS solar, grid_imported_wh AS grid_in,
         grid_exported_from_solar_wh + grid_exported_from_battery_wh AS grid_out,
         house_from_grid_wh + house_from_solar_wh + house_from_battery_wh AS house,
         battery_exported_wh AS discharged, battery_imported_from_solar_wh + battery_imported_from_grid_wh AS charged,
         extract(hour FROM timezone('America/Los_Angeles', start_at)) BETWEEN 16 AND 20 AS peak
       FROM energy_interval WHERE day BETWEEN $1 AND $2
     ), period AS (
       SELECT i.*, count(*) OVER w AS n, sum(grid_in) OVER w AS tesla_in, sum(grid_out) OVER w AS tesla_out,
         CASE WHEN peak THEN m.peak_imported_wh ELSE m.imported_wh - m.peak_imported_wh END AS meter_in,
         CASE WHEN peak THEN m.peak_exported_wh ELSE m.exported_wh - m.peak_exported_wh END AS meter_out
       FROM interval i LEFT JOIN meter_day m ON m.date = i.day::text AND i.day < $3
       WINDOW w AS (PARTITION BY i.day, i.peak)
     ), scaled AS (
       SELECT day, peak, solar, discharged, charged, house
         + CASE WHEN meter_in IS NULL THEN grid_in WHEN tesla_in > 0 THEN grid_in * meter_in::numeric / tesla_in ELSE meter_in::numeric / n END - grid_in
         - (CASE WHEN meter_out IS NULL THEN grid_out WHEN tesla_out > 0 THEN grid_out * meter_out::numeric / tesla_out ELSE meter_out::numeric / n END - grid_out)
         AS house
       FROM period
     )
     SELECT day::text AS day, sum(house) AS no_imported, sum(house) FILTER (WHERE peak) AS no_peak,
       sum(greatest(house - solar, 0)) AS so_imported, sum(greatest(solar - house, 0)) AS so_exported,
       sum(house - solar) FILTER (WHERE peak) AS so_peak,
       sum(greatest(house - solar, 0)) FILTER (WHERE peak) AS shortfall, sum(greatest(solar - house, 0)) FILTER (WHERE peak) AS peak_exported,
       sum(discharged) FILTER (WHERE peak) AS pw_peak, sum(charged) AS charged, sum(discharged) AS discharged,
       coalesce(bool_or(data.is_vpp), false) AS vpp
     FROM scaled LEFT JOIN data ON data.date = scaled.day::text GROUP BY day`,
    [first, last, METER_FIX_DATE],
  );
  return Object.fromEntries(rows.map((row) => [row.day, {
    solarOnly: { imported: Number(row.so_imported), exported: Number(row.so_exported), peak_net: Number(row.so_peak ?? 0) },
    noSystem: { imported: Number(row.no_imported), exported: 0, peak_net: Number(row.no_peak ?? 0) },
    shortfall: Number(row.shortfall ?? 0), peakExported: Number(row.peak_exported ?? 0), vpp: row.vpp,
    powerwalls: { peak: Number(row.pw_peak ?? 0), charged: Number(row.charged), discharged: Number(row.discharged) },
  }]));
}

// A day the Powerwalls sat out the 4 to 9 p.m. peak with a shortfall to cover: the owner switches to Savings mode before
// poor solar and holds 100% in winter, by hand, and Tesla keeps no mode history, so what the batteries did is the record.
const HELD_WH = 1000;
export const isHeld = ({ shortfall, powerwalls }: CaseDay) => powerwalls.peak < HELD_WH && shortfall > HELD_WH;

// The solar-only day with the Powerwalls covering only 4 to 9 p.m.: the shortfall comes off the peak imports, and
// refilling it, with the batteries' losses, comes off the day's exports outside those hours, or is imported then.
// shortcut: assumes the bank holds one evening's shortfall (about 32 kWh above a 20% reserve against at most 26 kWh
// through '25 - '26); simulate a state of charge if a day's shortfall ever nears that.
export function peakOnlyDay({ solarOnly, shortfall, peakExported }: CaseDay, efficiency: number): DayGrid {
  const refill = shortfall / efficiency;
  const fromExports = Math.min(refill, solarOnly.exported - peakExported);
  return {
    imported: solarOnly.imported - shortfall + refill - fromExports,
    exported: solarOnly.exported - fromExports,
    peak_net: solarOnly.peak_net - shortfall,
  };
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
  // NEM. WestLight cashes its credit out, so its charges count in full. The pricers take each cycle's days by date.
  const cost = (days: Record<string, DayGrid>, nem: boolean) => {
    let [pge, westlight] = [0, 0];
    for (const { row } of started) {
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
  // A day with PG&E's reading but no 5-minute data has nothing to rebuild the other cases from, so it counts in none.
  const actualDays: Record<string, DayGrid> = Object.fromEntries(
    started.flatMap(({ grid }) => Object.entries(grid.days)).filter(([day]) => day in others),
  );
  const each = (dayOf: (day: string, cases: CaseDay) => DayGrid) => Object.fromEntries(Object.entries(others).map(([day, cases]) => [day, dayOf(day, cases)]));
  const actual = cost(actualDays, true);
  const solarOnly = cost(each((_, cases) => cases.solarOnly), true);
  const noSystem = cost(each((_, cases) => cases.noSystem), false);
  // VPP event days come first: the owner takes part in every mode, and an event's peak export earns NEM credit of its own.
  const kind = (cases: CaseDay) => (cases.vpp ? "vpp" : isHeld(cases) ? "held" : "used");
  // Pricing held days, then held and VPP event days, without the Powerwalls attributes what they added to each kind.
  const asSolarOnly = (kinds: string[]) => cost(each((day, cases) => (kinds.includes(kind(cases)) ? cases.solarOnly : actualDays[day])), true);
  const heldAs = asSolarOnly(["held"]);
  const heldAndVppAs = asSolarOnly(["held", "vpp"]);
  if (!actual || !solarOnly || !noSystem || !heldAs || !heldAndVppAs) return null;

  const days = Object.values(others);
  const usedDays = days.filter((day) => kind(day) === "used");
  const vppDays = days.filter((day) => kind(day) === "vpp").length;
  const charged = usedDays.reduce((total, day) => total + day.powerwalls.charged, 0);
  // Discharge over charge on used days folds their standby draw in with the round-trip loss; held days' top-ups are
  // already the held part's cost, and VPP events aren't the cycling peak-only models.
  const efficiency = charged ? usedDays.reduce((total, day) => total + day.powerwalls.discharged, 0) / charged : null;
  const peakOnly = efficiency && usedDays.length
    ? cost(each((day, cases) => (kind(cases) === "used" ? peakOnlyDay(cases, efficiency) : actualDays[day])), true)
    : null;
  const powerwalls = pyRound(solarOnly.total - actual.total, 2);
  const used = pyRound(solarOnly.total - heldAndVppAs.total, 2);
  const vpp = pyRound(heldAndVppAs.total - heldAs.total, 2);
  return {
    actual, solar_only: solarOnly, no_system: noSystem,
    solar_saved: pyRound(noSystem.total - solarOnly.total, 2),
    powerwalls_added: powerwalls,
    powerwalls_held: pyRound(powerwalls - used - vpp, 2), powerwalls_vpp: vpp, powerwalls_used: used,
    held_days: days.length - usedDays.length - vppDays, vpp_days: vppDays, used_days: usedDays.length,
    peak_only: peakOnly, efficiency,
    rebuilt_days: started.reduce((count, { grid }) => count + [...grid.meter].filter((day) => day in others).length, 0),
    uncorrected_days: started.reduce((count, { row }) => count + row.uncorrected_days, 0),
    through,
    pge_rates: inEffect(through, newestFirst(revisions))!.effective_date,
    westlight_rates: westlightIn(through)!.effective_date,
  };
}

export type Savings = NonNullable<Awaited<ReturnType<typeof trueUpSavings>>>;
