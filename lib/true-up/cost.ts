import { cache } from "react";

import { db } from "@/lib/db";
import { pyRound } from "@/lib/intervals/python";
import { shiftDay } from "@/lib/scene/replay";
import { type CycleRow, cycleGrids, cycles } from "@/lib/true-up/grid";
import { amountDue, type DayGrid, minimumDelivery, priceDays, project, projectNet, type Revision, surplus, trueUpMonth } from "@/lib/true-up/pricing";
import { FIRST_TRUE_UP_END_YEAR, OCTOBER, readsFor, trueUpLabel } from "@/lib/true-up/reads";

type Billed = { nem_charges: number; net_kwh: number };
type Pricing = { revisions: Revision[]; billed: Map<string, Billed> };

// Flask looks rates and PG&E's figures up for every cycle; loading them once per request gives the same answers, since
// only Flask's refreshes and imports change them. A page render shares one load among the cost, the cycles and the savings.
export const loadPricing = cache(async (): Promise<Pricing> => {
  const [revisions, billed] = await Promise.all([
    db.query<{ revision: Revision }>("SELECT row_to_json(r) AS revision FROM rate_revision r"),
    db.query<Billed & { end_read: string }>("SELECT end_read::text AS end_read, nem_charges, net_kwh FROM true_up_statement_cycle"),
  ]);
  return {
    revisions: revisions.rows.map((row) => row.revision),
    billed: new Map(billed.rows.map(({ end_read, ...cycle }) => [end_read, cycle])),
  };
});

// A cycle's NEM charges and their source: PG&E's statement or bill when one covers it, otherwise calculated over its days
// with data so far, otherwise none. A cycle with PG&E's figure also gets the calculated estimate and PG&E's net kWh.
type Charges = { nem_charges: number | null; nem_source: "statement" | "calculated" | null; estimated_nem_charges: number | null; billed_net_kwh: number | null };

export function cycleCharges(first: string, last: string, days: Record<string, DayGrid>, { revisions, billed }: Pricing): Charges {
  const through = Object.keys(days).sort().at(-1);
  const estimate = through ? priceDays(first, through, days, revisions) : null;
  const printed = billed.get(shiftDay(last, 1));
  if (printed) return { nem_charges: printed.nem_charges, nem_source: "statement", estimated_nem_charges: estimate, billed_net_kwh: printed.net_kwh };
  return { nem_charges: estimate, nem_source: estimate === null ? null : "calculated", estimated_nem_charges: null, billed_net_kwh: null };
}

// Flask's /api/v2/sheet rows: each billing cycle's grid energy and NEM charges.
export async function cycleRows(start: string, end: string, pricing?: Pricing) {
  const [cycles, prices] = await Promise.all([cycleGrids(start, end), pricing ?? loadPricing()]);
  return cycles.map(({ row, grid }) => ({ ...row, ...cycleCharges(row.first_day, row.last_day, grid.days, prices) }));
}

// Tesla's credit for the Powerwalls' exports during PG&E virtual power plant events: $2.00 a kWh delivered on the days
// marked as VPP days from May to October, paid about six months later.
const VPP_RATE = 2;
const FIRST_SEASON = 2024;

export async function vppSeason(year: number) {
  if (year < FIRST_SEASON) return null;
  const [{ rows: [exported] }, { rows: [payout] }] = await Promise.all([
    db.query<{ kwh: number | null }>(
      "SELECT sum(powerwall_to_grid) AS kwh FROM data WHERE is_vpp AND date BETWEEN $1 AND $2",
      [`${year}-05-01`, `${year}-10-31`],
    ),
    db.query<{ amount: number; paid_on: string }>("SELECT amount, paid_on::text AS paid_on FROM vpp_payout WHERE season = $1", [year]),
  ]);
  const paid = payout as typeof payout | undefined;
  const kwh = pyRound(exported.kwh ?? 0, 1);
  return { season: year, payout: paid?.amount ?? null, paid_on: paid?.paid_on ?? null, kwh, estimate: pyRound(kwh * VPP_RATE, 2) };
}

// Years from the household's second EV on are comparable for projections: '24 - '25 onward.
const COMPARABLE_FROM_END_YEAR = 2025;

type Comparable = { label: string; rows: CycleRow[]; days: Record<string, DayGrid>[] };

// The finished true-up years since the second EV with a net for each of their cycles; the days are kept to reprice them.
async function comparableYears(endYear: number, cycles: number): Promise<Comparable[]> {
  const years = await Promise.all(
    Array.from({ length: Math.max(0, endYear - COMPARABLE_FROM_END_YEAR) }, async (_, i) => {
      const year = COMPARABLE_FROM_END_YEAR + i;
      const past = await cycleGrids(`${year - 1}-10-01`, `${year}-09-30`);
      return { label: trueUpLabel(year), rows: past.map(({ row }) => row), days: past.map(({ grid }) => grid.days) };
    }),
  );
  return years.filter(({ rows }) => rows.length === cycles && rows.every((row) => row.net !== null));
}

// The previous true-up year's running net at the end of each cycle, a cycle without a net keeping its place.
async function lastYear(endYear: number, comparable: Comparable[]) {
  if (endYear - 1 < FIRST_TRUE_UP_END_YEAR) return null;
  const label = trueUpLabel(endYear - 1);
  const past = comparable.find((year) => year.label === label)?.rows ?? (await cycles(`${endYear - 2}-10-01`, `${endYear - 1}-09-30`));
  let total = 0;
  return { label, running_net: past.map(({ net }) => (net === null ? null : pyRound((total += net), 1))) };
}

const daysFrom = (first: string, last: string) => (Date.parse(last) - Date.parse(first)) / 86_400_000;

// The share of the open cycle's days still to come.
const left = (cycle: CycleRow) => daysFrom(cycle.through ?? cycle.last_day, cycle.last_day) / (daysFrom(cycle.first_day, cycle.last_day) + 1);

export const isTrueUpYear = (start: string, end: string) => start.slice(5) === "10-01" && end === `${Number(start.slice(0, 4)) + 1}-09-30`;

// A true-up year's dollars, as Flask's /api/v2/true_up_cost answers them: all null but the newest rates' date unless the
// range is a true-up year.
export async function trueUpCost(start: string, end: string, today: string) {
  const pricing = await loadPricing();
  const newest = pricing.revisions.toSorted((a, b) => b.effective_date.localeCompare(a.effective_date))[0];
  const result = {
    charges_so_far: null as number | null, amount_due: null as number | null, source: null as string | null,
    minimum_delivery: null as number | null, net_exported_kwh: null as number | null, unused_credit: null as number | null,
    nsc_rate: null as number | null, nsc_estimate: null as number | null,
    projections: null as { label: string; amount: number }[] | null,
    kwh_projection: null as ReturnType<typeof projectNet>, last_year: null as Awaited<ReturnType<typeof lastYear>>,
    vpp: null as Awaited<ReturnType<typeof vppSeason>>, rates_effective: newest?.effective_date ?? null,
  };
  const endYear = Number(end.slice(0, 4));
  if (!isTrueUpYear(start, end)) return result;
  result.vpp = await vppSeason(endYear);
  const rows = await cycleRows(start, end, pricing);
  const finished = today >= (await readsFor(endYear))[OCTOBER];
  const comparable = finished ? [] : await comparableYears(endYear, rows.length);
  result.last_year = await lastYear(endYear, comparable);
  const opened = rows.filter((row) => row.net !== null);
  if (comparable.length && opened.length)
    result.kwh_projection = projectNet(rows.map((row) => row.net), left(opened.at(-1)!), comparable.map(({ label, rows: past }) => [label, past.map((row) => row.net!)]));

  const started = rows.filter((row) => row.net !== null || row.nem_source === "statement");
  if (!started.length || started.some((row) => row.nem_charges === null)) return result;
  const soFar = pyRound(started.reduce((sum, row) => sum + row.nem_charges!, 0), 2);
  const net = started.reduce((sum, row) => sum + (row.net ?? 0), 0);
  Object.assign(result, { charges_so_far: soFar, net_exported_kwh: net < 0 ? pyRound(-net, 1) : null });

  const { rows: [statement] } = await db.query<{ amount_due: number; minimum_delivery: number }>(
    "SELECT amount_due, minimum_delivery FROM true_up_statement WHERE true_up_end_year = $1", [endYear],
  );
  if (statement) {
    Object.assign(result, { amount_due: statement.amount_due, source: "statement", minimum_delivery: statement.minimum_delivery });
  } else if (finished && started.length === rows.length) {
    const lastDay = rows.at(-1)!.last_day;
    const minimum = minimumDelivery(rows[0].first_day, lastDay, pricing.revisions);
    Object.assign(result, { amount_due: amountDue(soFar, minimum), source: "calculated", minimum_delivery: minimum });
    if (result.net_exported_kwh) {
      const { rows: [stored] } = await db.query<{ rate: number }>("SELECT rate FROM nsc_rate WHERE month = $1", [trueUpMonth(lastDay)]);
      result.nsc_rate = stored?.rate ?? null;
    }
    Object.assign(result, surplus(soFar, result.net_exported_kwh, result.nsc_rate));
  } else if (!finished && newest) {
    const priced: [string, number[]][] = comparable.map(({ label, rows: past, days }) =>
      [label, past.map((row, i) => priceDays(row.first_day, row.last_day, days[i], [], newest)!)]);
    const projections = project(soFar, started.length - 1, left(started.at(-1)!), priced);
    result.projections = projections.length ? projections : null;
  }
  return result;
}
