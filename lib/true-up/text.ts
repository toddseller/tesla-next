// The True-Up Tracker's figures and wording, from /api/cycles rows and /api/true-up-cost, ported from anton-tesla-api-ws's
// utils/trueUp.js with mockup A's wording. Client-safe: the types are imported for their shape only.
import type { cycleRows, trueUpCost } from "@/lib/true-up/cost";
import type { Savings } from "@/lib/true-up/savings";

export type Cycle = Awaited<ReturnType<typeof cycleRows>>[number];
export type Cost = Awaited<ReturnType<typeof trueUpCost>>;
export type Started = Cycle & { [K in "through" | "imported" | "exported" | "net" | "peak_net" | "off_peak_net"]: NonNullable<Cycle[K]> };
// What a tile shows: its big figure, the word beside it and the line under it.
export type TileText = { value: string | null; unit: string | null; line: string };

type Charges = Pick<Cycle, "nem_charges" | "nem_source">;
type Billed = Charges & Pick<Cycle, "estimated_nem_charges" | "billed_net_kwh">;

// Cycles after the one in progress come back with null totals.
export const startedCycles = <C extends Pick<Cycle, "net">>(rows: C[]) => rows.filter((row) => row.net !== null) as (C & Started)[];

const sum = <C>(cycles: C[], pick: (cycle: C) => number) => cycles.reduce((total, cycle) => total + pick(cycle), 0);

export const totals = (cycles: Pick<Started, "imported" | "exported" | "net" | "peak_net" | "off_peak_net">[]) => ({
  imported: sum(cycles, (c) => c.imported),
  exported: sum(cycles, (c) => c.exported),
  net: sum(cycles, (c) => c.net),
  peak: sum(cycles, (c) => c.peak_net),
  offPeak: sum(cycles, (c) => c.off_peak_net),
});

// The net at the end of each cycle, from the start of its true-up year; a cycle without a net keeps its place, empty.
export const runningNet = (cycles: Pick<Cycle, "true_up" | "net">[]) => {
  let running = 0;
  return cycles.map((cycle, i) => {
    if (i > 0 && cycle.true_up !== cycles[i - 1].true_up) running = 0;
    return cycle.net === null ? null : Math.round((running += cycle.net) * 10) / 10;
  });
};

// Days before Tesla's metering fix without PG&E's own readings keep Tesla's grid figures, about half of PG&E's meter.
export const uncorrectedDays = (cycles: Pick<Cycle, "uncorrected_days">[]) => sum(cycles, (c) => c.uncorrected_days);

// A true-up year's name ("'24 - '25") with non-breaking spaces, so a phone never splits it.
export const yearName = (label: string) => label.replace(/ /g, " ");

// As the Grid day view: a net that shows as 0.0 reads "Exported".
export const netLabel = (value: number) => (Math.round(value * 10) / 10 > 0 ? "Imported" : "Exported");

export const kwh = (value: number) => Math.abs(value).toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

const wholeKwh = (value: number) => Math.abs(value).toLocaleString("en-US", { maximumFractionDigits: 0 });
const dollars = (value: number) => `$${Math.abs(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const wholeDollars = (value: number) => `$${Math.abs(value).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
const credit = (value: number) => (value < 0 ? `${dollars(value)} credit` : dollars(value));
const listText = (labels: string[]) => (labels.length < 2 ? labels[0] : `${labels.slice(0, -1).join(", ")} or ${labels.at(-1)}`);
const like = (labels: string[]) => `if the rest of the year goes like ${listText(labels.map(yearName))}`;

const date = (iso: string, options: Intl.DateTimeFormatOptions) => new Date(`${iso}T00:00:00Z`).toLocaleString("en-US", { ...options, timeZone: "UTC" });
const day = (iso: string) => date(iso, { month: "short", day: "numeric" });

export const cycleDates = ({ first_day, last_day, through }: Pick<Cycle, "first_day" | "last_day" | "through">) =>
  through && through < last_day ? `${day(first_day)} to ${day(through)} (so far)` : `${day(first_day)} to ${day(last_day)}`;

// A cycle's NEM charges: PG&E's figure as printed, a calculated one marked as an estimate.
export const chargesText = ({ nem_charges: charges, nem_source: source }: Charges) =>
  charges === null ? null : source === "calculated" ? `${credit(charges)} est.` : credit(charges);

// Under a cycle with PG&E's charge: what the site would have estimated, and PG&E's own net.
export const estimateText = ({ estimated_nem_charges: estimate, billed_net_kwh: net }: Billed) => {
  if (net === null) return null;
  const pgeNet = `PG&E net ${wholeKwh(net)} kWh${netLabel(net) === "Exported" ? " exported" : ""}`;
  return estimate === null ? pgeNet : `est. ${credit(estimate)} · ${pgeNet}`;
};

// PG&E's charges for the cycles it has billed beside the estimate for those same cycles.
export function billedText(cycles: Billed[]): TileText | null {
  const billed = cycles.filter((c) => c.nem_source === "statement" && c.estimated_nem_charges !== null);
  if (!billed.length) return null;
  const total = (pick: (c: Billed) => number) => Math.round(sum(billed, pick) * 100) / 100;
  const [actual, estimate] = [total((c) => c.nem_charges!), total((c) => c.estimated_nem_charges!)];
  const amount = (value: number) => (value < 0 ? `a credit of ${dollars(value)}` : dollars(value));
  const gap = Math.round((estimate - actual) * 100) / 100;
  const [count, it] = billed.length === 1 ? ["1 cycle", "it"] : [`${billed.length} cycles`, "them"];
  return {
    value: gap === 0 ? "Exact" : dollars(gap),
    unit: gap === 0 ? null : gap < 0 ? "under" : "over",
    line: `PG&E billed ${amount(actual)} for ${count}; the estimate for ${it} was ${amount(estimate)}.`,
  };
}

// The projected true-up: dollars when the year has them, and the year-end net, naming the years they come from.
export function projectionText({ years }: NonNullable<Cost["kwh_projection"]>, projections: Cost["projections"]): TileText {
  const nets = years.map((y) => y.net);
  const [low, high] = [Math.min(...nets), Math.max(...nets)];
  let range: string;
  if (low < 0 && high > 0) range = `between ${wholeKwh(low)} kWh exported and ${wholeKwh(high)} kWh imported`;
  else {
    const [a, b] = [Math.abs(low), Math.abs(high)].sort((x, y) => x - y);
    range = `${a === b ? "" : `${wholeKwh(a)} to `}${wholeKwh(b)} kWh ${netLabel(high).toLowerCase()}`;
  }
  const amounts = projections?.map((p) => Math.round(p.amount)) ?? [];
  const [lowest, highest] = [Math.min(...amounts), Math.max(...amounts)];
  return {
    value: !amounts.length ? null : lowest === highest ? wholeDollars(lowest) : `${wholeDollars(lowest)}–${wholeDollars(highest)}`,
    unit: null,
    line: `Year-end ${range}, ${like(years.map((y) => y.label))}`,
  };
}

type Dollars = Pick<Cost, "charges_so_far" | "amount_due" | "source" | "minimum_delivery" | "net_exported_kwh" | "unused_credit" | "nsc_estimate">;

export const chargesSoFarText = ({ charges_so_far: soFar }: Dollars, cycles: Pick<Cycle, "nem_source">[]): TileText => {
  const count = cycles.length === 1 ? "1 cycle" : `${cycles.length} cycles`;
  const billed = cycles.some((c) => c.nem_source === "statement");
  return {
    value: dollars(soFar!),
    unit: cycles.some((c) => c.nem_source === "calculated") ? "estimate" : null,
    line: `NEM charges for ${count}, before taxes.${billed ? "" : " No PG&E bill in yet."}`,
  };
};

// A finished year's true-up: what's due, from PG&E's statement or calculated, or why there are no dollars.
export function trueUpText(cost: Dollars): TileText {
  const { amount_due: due, source, minimum_delivery: minimum, net_exported_kwh: exported, unused_credit: unused, nsc_estimate: nsc } = cost;
  if (due === null)
    return { value: "Not shown", unit: null, line: "PG&E's statement for this year isn't available, and the rates it was billed at aren't stored." };
  const unit = source === "calculated" ? "estimate" : null;
  if (due === 0) {
    const kept = unused ? `${dollars(unused)} of unused credit isn't paid out` : "Unused credit isn't paid out";
    const surplus = exported ? `; PG&E pays ${nsc !== null ? `about ${wholeDollars(nsc)} of ` : ""}Net Surplus Compensation on the ${exported.toLocaleString("en-US")} kWh exported` : "";
    return { value: "Nothing due", unit, line: `${source === "statement" ? "From PG&E's statement. " : ""}${kept}${surplus}.` };
  }
  const from = source === "statement" ? "From PG&E's statement" : "Calculated from PG&E's published rates";
  return { value: dollars(due), unit, line: `${from}: NEM charges of ${dollars(cost.charges_so_far!)}, less ${dollars(minimum!)} of minimum delivery charges already paid.` };
}

// Tesla's VPP credit for the season (May to October) a true-up year ends in, paid about six months after it.
export function vppText(season: Cost["vpp"], today: string): TileText | null {
  if (!season) return null;
  const apart = "Tesla pays it, apart from PG&E's true-up.";
  if (season.payout !== null)
    return { value: dollars(season.payout), unit: `${season.season} season`, line: `Paid ${date(season.paid_on!, { month: "long", year: "numeric" })}. ${apart}` };
  if (!season.estimate)
    return { value: "$0", unit: `${season.season} season`, line: `No events marked yet; the season runs May 1 to October 31. ${apart}` };
  const soFar = today <= `${season.season}-10-31` ? " so far" : "";
  return {
    value: wholeDollars(season.estimate),
    unit: "estimate",
    line: `${season.season} season${soFar}: ${kwh(season.kwh)} kWh in VPP events at $2.00. Paid by Tesla around spring ${season.season + 1}, apart from PG&E's true-up.`,
  };
}

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;
const wholeCredit = (value: number) => `${wholeDollars(value)}${Math.round(value) < 0 ? " credit" : ""}`;
const yearAfter = (iso: string) => `${Number(iso.slice(0, 4)) + 1}${iso.slice(4)}`;

// The savings card: what the system saved of the no-system bill, the bar's parts, and the key. The Powerwalls' effect on
// the bill sits beside the VPP credit they earn, since under NEM2 the bill alone barely credits them.
export function savingsText(savings: Savings, season: Cost["vpp"], current: boolean) {
  const { actual, no_system: noSystem, solar_saved: solar, powerwalls_added: powerwalls } = savings;
  const saved = Math.round((noSystem.total - actual.total) * 100) / 100;
  const bar: [string, number][] = powerwalls < 0 ? [["paid", actual.total], ["saved", saved]] : [["paid", actual.total], ["powerwalls", powerwalls], ["solar", solar]];
  const spoken = powerwalls < 0
    ? `${wholeDollars(saved)} saved`
    : `${wholeDollars(powerwalls)} saved by the Powerwalls, ${wholeDollars(solar)} saved by solar`;

  const vpp = season && (season.payout ?? (season.estimate || null));
  const vppText = season && vpp
    ? `${wholeDollars(vpp)} VPP credit, ${season.payout !== null ? `the ${season.season} season's payout` : `an estimate for the ${season.season} season`}.`
    : null;
  const effect = (dollars: number) => `${wholeDollars(dollars)} ${dollars < 0 ? "cost" : "saved"}`;
  const parts: [string, string][] = [];
  if (savings.held_days) parts.push([`Keeping charge, ${plural(savings.held_days, "day")}`, effect(savings.powerwalls_held)]);
  if (savings.used_days) parts.push([`Storing solar, ${plural(savings.used_days, "day")}`, effect(savings.powerwalls_used)]);
  if (savings.vpp_days) parts.push([`VPP events, ${plural(savings.vpp_days, "day")}`, effect(savings.powerwalls_vpp)]);
  if (savings.storm_days) parts.push([`Storm watch, ${plural(savings.storm_days, "day")}`, effect(savings.powerwalls_storm)]);
  const less = savings.peak_only && Math.round((actual.total - savings.peak_only.total) * 100) / 100;
  const whatIf = savings.peak_only && savings.used_days
    ? {
      value: Math.round(Math.abs(less!)) === 0 ? "About the same" : `About ${wholeDollars(less!)} ${less! > 0 ? "less" : "more"}`,
      line: `Covering only 4 to 9 p.m. on ${savings.used_days === 1 ? "that day" : `those ${savings.used_days} days`}.`,
    }
    : null;
  const nem2 = powerwalls < 0 ? "Under NEM2, exporting solar earns about what importing it later costs, so storing it pays only between 4 and 9 p.m." : null;

  const { rebuilt_days: rebuilt, uncorrected_days: uncorrected } = savings;
  const days = rebuilt && uncorrected
    ? `${plural(rebuilt, "day")} before April 27, 2026 rebuilt from PG&E's meter, ${uncorrected} as Tesla read it.`
    : rebuilt ? `${plural(rebuilt, "day")} before April 27, 2026 rebuilt from PG&E's meter.`
      : uncorrected ? `${plural(uncorrected, "day")} before April 27, 2026 as Tesla read it.` : null;
  const stale = savings.through > yearAfter(savings.westlight_rates)
    ? `WestLight's rates are from ${date(savings.westlight_rates, { month: "long", year: "numeric" })}.`
    : null;

  return {
    saved: wholeDollars(saved),
    unit: `estimate${current ? " so far" : ""}, of ${wholeDollars(noSystem.total)} without solar or Powerwalls`,
    bar: { parts: bar, label: `Of ${wholeDollars(noSystem.total)}: ${wholeDollars(actual.total)} paid, ${spoken}` },
    paid: wholeCredit(actual.total),
    paidSplit: `PG&E ${wholeCredit(actual.pge)} · WestLight ${wholeCredit(actual.westlight)}`,
    solar: wholeDollars(solar),
    powerwalls: { bill: `${effect(powerwalls)} on the bill`, vpp: vppText, parts, whatIf, nem2 },
    estimates: ["Estimates of PG&E's and WestLight Energy's charges.", days, stale].filter(Boolean).join(" "),
  };
}
