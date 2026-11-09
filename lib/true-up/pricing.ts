import { pyRound } from "@/lib/intervals/python";
import { shiftDay } from "@/lib/scene/replay";

// The house's NEM true-up priced as PG&E bills it: NEM2 on E-TOU-C, generation from WestLight Energy (a CCA). PG&E's
// NEM charges are the total rates less generation, plus the 2016-vintage PCIA and the non-bypassable charges.

type Season = "summer" | "winter";
type Rates = Record<`${Season}_${"peak_total" | "off_peak_total" | "peak_generation" | "off_peak_generation" | "baseline_kwh"}`, number>;

export type Revision = Rates & {
  effective_date: string;
  baseline_credit: number;
  bundled_pcia: number;
  vintage_pcia: number;
  nbc: number;
  minimum_delivery_daily: number;
};

export type DayGrid = { imported: number; exported: number; peak_net: number };

// Python's float(Decimal(str(x)).quantize(Decimal("0.01"), ROUND_HALF_UP)), the rounding of each line on PG&E's bill.
// String(x) gives the same shortest digits as Python's str(x).
export function cents(amount: number): number {
  const sign = amount < 0 || Object.is(amount, -0) ? -1 : 1;
  const digits = String(Math.abs(amount));
  // shortcut: exponent notation is taken as below a cent, which holds for the small end; amounts past 1e21 aren't money here.
  if (digits.includes("e")) return sign * 0;
  const [whole, fraction = ""] = digits.split(".");
  const kept = Number(whole + fraction.padEnd(2, "0").slice(0, 2)) + (fraction[2] >= "5" ? 1 : 0);
  return (sign * kept) / 100;
}

export const seasonOf = (day: string): Season => (day.slice(5, 7) >= "06" && day.slice(5, 7) <= "09" ? "summer" : "winter");

type Dated = { effective_date: string };
export const inEffect = <R extends Dated>(day: string, newestFirst: R[]) => newestFirst.find((r) => r.effective_date <= day);
export const newestFirst = <R extends Dated>(revisions: R[]) => [...revisions].sort((a, b) => b.effective_date.localeCompare(a.effective_date));

export type Segment = { first: string; last: string; season: Season; revision: Revision; days: number; allowance: number };

// The cycle's days split at season changes and rate revisions; null if any day has no rates. With `fixed`, every day is
// priced at it: a past cycle repriced at today's rates.
export function segments(first: string, last: string, revisions: Revision[], fixed?: Revision): Segment[] | null {
  const ordered = newestFirst(revisions);
  const result: Segment[] = [];
  for (let day = first; day <= last; day = shiftDay(day, 1)) {
    const revision = fixed ?? inEffect(day, ordered);
    if (!revision) return null;
    const current = result.at(-1);
    if (current && current.season === seasonOf(day) && current.revision.effective_date === revision.effective_date) {
      current.last = day;
      current.days += 1;
    } else {
      result.push({ first: day, last: day, season: seasonOf(day), revision, days: 1, allowance: 0 });
    }
  }
  for (const part of result) part.allowance = part.days * part.revision[`${part.season}_baseline_kwh`];
  return result;
}

// A segment's NEM charge lines and their total, in dollars, from its kWh.
export function segmentCharges(revision: Revision, season: Season, days: number, netPeak: number, netOffPeak: number, imported: number) {
  const rate = (name: string) => revision[`${season}_${name}` as keyof Rates];
  const net = netPeak + netOffPeak;
  const allowance = days * rate("baseline_kwh");
  const lines = {
    peak: cents(netPeak * rate("peak_total")),
    off_peak: cents(netOffPeak * rate("off_peak_total")),
    // Net exports offset baseline usage first, so up to the allowance they're charged back at the credit, as both
    // true-up statements bill.
    baseline_credit: -cents(Math.max(-allowance, Math.min(allowance, net)) * revision.baseline_credit),
    // Non-bypassable charges apply to every kWh imported, not the net, so the net's share comes back out.
    nbc_net_usage_adjustment: -cents(net * revision.nbc),
    nbc: cents(imported * revision.nbc),
    // A CCA customer doesn't buy PG&E's generation; each period's share is taken back on its own.
    generation_credit: -pyRound(cents(netPeak * (rate("peak_generation") + revision.bundled_pcia))
      + cents(netOffPeak * (rate("off_peak_generation") + revision.bundled_pcia)), 2),
    pcia: cents(net * revision.vintage_pcia),
  };
  return { ...lines, total: pyRound(Object.values(lines).reduce((sum, line) => sum + line, 0), 2) };
}

// NEM charges for first to last from dailyGrid's days (Wh), or null without rates for every day.
export function priceDays(first: string, last: string, days: Record<string, DayGrid>, revisions: Revision[], fixed?: Revision): number | null {
  const parts = segments(first, last, revisions, fixed);
  if (!parts) return null;
  let total = 0;
  for (const part of parts) {
    const inside = Object.entries(days).filter(([day]) => part.first <= day && day <= part.last).map(([, totals]) => totals);
    const sum = (pick: (d: DayGrid) => number) => inside.reduce((s, d) => s + pick(d), 0);
    const net = sum((d) => d.imported - d.exported) / 1000;
    const peak = sum((d) => d.peak_net) / 1000;
    total += segmentCharges(part.revision, part.season, part.days, peak, net - peak, sum((d) => d.imported) / 1000).total;
  }
  return pyRound(total, 2);
}

// The minimum delivery charges billed from first to last: each day at its revision's daily rate, each run of days at one
// rate rounded to the cent, as PG&E's bills show them.
export function minimumDelivery(first: string, last: string, revisions: Revision[]): number {
  const ordered = newestFirst(revisions);
  const runs: [rate: number, days: number][] = [];
  for (let day = first; day <= last; day = shiftDay(day, 1)) {
    const rate = inEffect(day, ordered)?.minimum_delivery_daily ?? 0;
    const run = runs.at(-1);
    if (run && run[0] === rate) run[1] += 1;
    else runs.push([rate, 1]);
  }
  return pyRound(runs.reduce((total, [rate, days]) => total + cents(rate * days), 0), 2);
}

// A year trues up in the month of the read the day after its last day.
export const trueUpMonth = (lastDay: string) => `${shiftDay(lastDay, 1).slice(0, 8)}01`;

// A finished year's credit PG&E zeroes at the true-up, and its Net Surplus Compensation for the kWh exported on balance.
export const surplus = (nemCharges: number, netExportedKwh: number | null, nscRate: number | null) => ({
  unused_credit: nemCharges < 0 ? pyRound(-nemCharges, 2) : null,
  nsc_estimate: netExportedKwh && nscRate !== null ? cents(netExportedKwh * nscRate) : null,
});

// PG&E keeps unused credit, so the true-up never pays out.
export const amountDue = (nemCharges: number, minimumDelivery: number) => Math.max(0, pyRound(nemCharges - minimumDelivery, 2));

type Comparable = [label: string, perCycle: number[]][];

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);

// The amount due once per comparable year: the charges so far, plus that year's repriced charges for the rest of the
// open cycle (`left` of it) and every cycle after.
export const project = (soFar: number, openIndex: number, left: number, comparable: Comparable) =>
  comparable.map(([label, charges]) => ({ label, amount: amountDue(soFar + charges[openIndex] * left + sum(charges.slice(openIndex + 1)), 0) }));

// The year-end net in kWh once per comparable year, as `project` does for dollars, and the band between the lowest and
// highest projected running net from the open cycle on.
export function projectNet(nets: (number | null)[], left: number, comparable: Comparable) {
  const openIndex = nets.findLastIndex((net) => net !== null);
  if (openIndex < 0 || !comparable.length) return null;
  const soFar = sum(nets.slice(0, openIndex + 1).filter((net) => net !== null));
  const paths = comparable.map(([label, past]) => {
    const running = [soFar + past[openIndex] * left];
    for (const net of past.slice(openIndex + 1)) running.push(running.at(-1)! + net);
    return { label, path: [...Array(openIndex).fill(null), ...running] as number[] };
  });
  const band = (pick: (...values: number[]) => number) =>
    nets.map((_, i) => (i < openIndex ? null : pyRound(pick(...paths.map(({ path }) => path[i])), 1)));
  return {
    years: paths.map(({ label, path }) => ({ label, net: pyRound(path.at(-1)!, 1) })),
    band: { low: band(Math.min), high: band(Math.max) },
  };
}
