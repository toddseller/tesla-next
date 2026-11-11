import { readFileSync } from "node:fs";

import { backupHistory } from "@/lib/backup";
import { db } from "@/lib/db";
import { type Kept, keptFor, refreshKept } from "@/lib/kept";
import { vppSeason } from "@/lib/true-up/cost";
import { trueUpYears } from "@/lib/true-up/reads";
import { refreshSavings, trueUpSavings } from "@/lib/true-up/savings";

// Whether the solar and the Powerwalls have paid for themselves. What they cost is private: it is read from a file on
// the server (SYSTEM_COSTS_FILE), never kept in this public repository, and only years leave the server.

export type Costs = { solar: number; powerwalls: number; sales_tax: number; credit_rate: number };

// The day the system was approved to run; payback counts from it.
export const PTO = "2021-10-22";
const WARRANTY_YEARS = 10;
const DAY = 86_400_000;

const isPositive = (value: unknown) => typeof value === "number" && Number.isFinite(value) && value > 0;

// Null when unset, unreadable or not the expected shape, logged without the file's contents.
export function readCosts(): Costs | null {
  const path = process.env.SYSTEM_COSTS_FILE;
  if (!path) return null;
  try {
    const text = readFileSync(path, "utf8");
    // Compose mounts /dev/null when the variable isn't set on the host: no costs, nothing wrong.
    if (!text.trim()) return null;
    const costs = JSON.parse(text);
    const valid = ["solar", "powerwalls", "sales_tax", "credit_rate"].every((key) => isPositive(costs?.[key])) && costs.credit_rate < 1;
    if (valid) return { solar: costs.solar, powerwalls: costs.powerwalls, sales_tax: costs.sales_tax, credit_rate: costs.credit_rate };
    console.error("system costs file is not the expected shape");
  } catch {
    console.error("system costs file can't be read");
  }
  return null;
}

// Each part's price plus its share of the sales tax, by price, less the federal credit on that total.
export function netCosts({ solar, powerwalls, sales_tax: tax, credit_rate: credit }: Costs) {
  const share = (price: number) => (price + (tax * price) / (solar + powerwalls)) * (1 - credit);
  return { solar: share(solar), powerwalls: share(powerwalls) };
}

// A year before PG&E's readings, scaled from the first priced year by solar output and by the average E-TOU-C cost.
export const earlyEstimate = (first: { saving: number; solarKwh: number; cost: number }, year: { solarKwh: number; cost: number }) =>
  first.saving * (year.solarKwh / first.solarKwh) * (year.cost / first.cost);

type Year = { start: string; end: string; saving: number; priced: boolean };

const time = (day: string) => Date.parse(`${day}T00:00:00Z`);
const day = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const days = (start: string, end: string) => (time(end) - time(start)) / DAY + 1;

// The day savings counted year by year from PTO reach the target, each year at an even rate through its days (the
// current one through its last counted day), or projected past the last at the average of the full priced years.
export function paybackDate(years: Year[], target: number) {
  let saved = 0;
  const estimated = years.some((y) => !y.priced);
  for (const year of years) {
    const start = year.start < PTO ? PTO : year.start;
    const saving = (year.saving * days(start, year.end)) / days(year.start, year.end);
    if (saved + saving >= target) {
      const offset = Math.ceil(((target - saved) / saving) * days(start, year.end)) - 1;
      return { date: day(time(start) + offset * DAY), projected: false, estimated };
    }
    saved += saving;
  }
  const full = years.filter((y) => y.priced && days(y.start, y.end) >= 365);
  const average = full.reduce((total, y) => total + y.saving, 0) / full.length;
  if (!full.length || average <= 0) return { date: null, projected: true, estimated };
  const last = years.at(-1)!.end;
  return { date: day(time(last) + Math.ceil(((target - saved) / average) * 365) * DAY), projected: true, estimated };
}

// The Powerwalls' net over the priced years (bill effect plus VPP credits) and the year it would cover their cost, or
// that it won't within their warranty.
export function powerwallsPayback(netCost: number, years: { added: number; vpp: number }[], today: string) {
  const net = years.reduce((total, y) => total + y.added + y.vpp, 0);
  const average = years.length ? net / years.length : 0;
  const needed = average > 0 ? (netCost - net) / average : Infinity;
  if (needed > WARRANTY_YEARS) return { year: null, wont: true };
  return { year: new Date(time(today) + needed * 365 * DAY).getUTCFullYear(), wont: false };
}

// E-TOU-C's average cost on ECO100 in PCE and PG&E's joint rate comparisons nearest each year (March 2021, January 2023,
// July 2023), by true-up end year: the years before PG&E's readings are scaled from '23 - '24 by them.
const COST_INDEX: Record<number, number> = { 2022: 0.30334, 2023: 0.35142, 2024: 0.35931 };
const FIRST_PRICED = "2023-10-01";

// '21 - '22 and '22 - '23, scaled from '23 - '24's saving and solar output. Output counts from PTO, so '21 - '22 starts
// there and paybackDate doesn't cut it to PTO again.
export function earlyYears(first: { saving: number; solarKwh: number }, kwh: (endYear: number) => number, years: { start_date: string; end_date: string }[]) {
  return years.filter((y) => y.start_date < FIRST_PRICED).map((y) => {
    const endYear = Number(y.end_date.slice(0, 4));
    const saving = earlyEstimate({ ...first, cost: COST_INDEX[2024] }, { solarKwh: kwh(endYear), cost: COST_INDEX[endYear] });
    return { start: y.start_date < PTO ? PTO : y.start_date, end: y.end_date, saving, priced: false };
  });
}

// The savings are kept (savings.ts), a settled year's until a rewrite; the VPP season is one small query.
async function priceYear(start: string, end: string) {
  const [savings, season] = await Promise.all([trueUpSavings(start, end), vppSeason(Number(end.slice(0, 4)))]);
  return { savings, vpp: season ? season.payout ?? season.estimate : 0 };
}

// The month solar paid back, the one finer figure the owner chose to show; a projected month would be false precision.
export const monthOf = (payback: ReturnType<typeof paybackDate>) => (payback.projected || !payback.date ? null : payback.date.slice(0, 7));

const yearOf = (payback: ReturnType<typeof paybackDate>) => ({
  year: payback.date ? Number(payback.date.slice(0, 4)) : null, projected: payback.projected, estimated: payback.estimated,
});

// The Payback card's years, or null without the costs file. Only years, estimate markers and the outage record leave.
async function workOut(today: string) {
  const costs = readCosts();
  if (!costs) return null;
  const net = netCosts(costs);
  const years = await trueUpYears(today);
  const [{ rows: output }, priced, { summary: outages }] = await Promise.all([
    // Solar output from PTO by true-up end year: October to December count toward the next year.
    db.query<{ end_year: number; kwh: number }>(
      "SELECT extract(year FROM date::date + interval '3 months')::int AS end_year, sum(solar_generated) AS kwh FROM data WHERE date >= $1 GROUP BY 1",
      [PTO],
    ),
    Promise.all(years.filter((y) => y.start_date >= FIRST_PRICED).map(async (y) => ({ ...y, ...(await priceYear(y.start_date, y.end_date)) }))),
    backupHistory({ start: "2021-10-01", end: today }),
  ]);
  const kwh = (endYear: number) => Number(output.find((row) => row.end_year === endYear)?.kwh ?? 0);

  const counted = priced.filter((y) => y.savings !== null);
  const first = counted.find((y) => y.start_date === FIRST_PRICED);
  const early = first ? earlyYears({ saving: first.savings!.solar_saved, solarKwh: kwh(2024) }, kwh, years) : [];
  const solarYears = [
    ...early,
    // The current year counts through its last day priced.
    ...counted.map((y) => ({ start: y.start_date, end: y.current ? y.savings!.through : y.end_date, saving: y.savings!.solar_saved, priced: true })),
  ];
  const finished = counted.filter((y) => !y.current).map((y) => ({ added: y.savings!.powerwalls_added, vpp: y.vpp }));
  const solarPaid = paybackDate(solarYears, net.solar);
  return {
    solar: { ...yearOf(solarPaid), month: monthOf(solarPaid) },
    system: yearOf(paybackDate(solarYears, net.solar + net.powerwalls)),
    powerwalls: powerwallsPayback(net.powerwalls, finished, today),
    outages: {
      count: outages.outages, seconds: Math.floor(outages.seconds),
      longest_seconds: outages.longest ? Math.floor(outages.longest.seconds) : null,
    },
  };
}

declare global {
  var paybackKept: Kept<Awaited<ReturnType<typeof workOut>>> | undefined;
}
const kept = () => (globalThis.paybackKept ??= new Map());

// Only today's or yesterday's totals and a rewrite change the answer: instrumentation refreshes it on the one and empties
// it on the other, so a visit almost never waits for it.
export const payback = (today: string) => keptFor(kept(), "payback", today, () => workOut(today));

export function refreshPayback(today: string) {
  // The unsettled years' savings first, or the payback would be worked out from the kept ones.
  void refreshSavings(today);
  return refreshKept(kept(), "payback", today, () => workOut(today), "payback");
}

export type Payback = NonNullable<Awaited<ReturnType<typeof payback>>>;
