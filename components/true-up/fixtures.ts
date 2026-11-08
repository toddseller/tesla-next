// The current year on November 8, 2026 and '25 - '26, with mockup A's figures, as /api/cycles and /api/true-up-cost
// answer for them.
import type { TrueUpYear } from "@/lib/true-up/reads";
import type { Cost, Cycle } from "@/lib/true-up/text";

const row = (
  first_day: string, last_day: string, true_up: string, through: string | null,
  grid: [imported: number, exported: number, net: number, peak: number] | null, charges: Partial<Cycle> = {},
): Cycle => ({
  first_day, last_day, true_up, through,
  imported: grid && grid[0], exported: grid && grid[1], net: grid && grid[2],
  peak_net: grid && grid[3], off_peak_net: grid && Math.round((grid[2] - grid[3]) * 10) / 10,
  uncorrected_days: 0, nem_charges: null, nem_source: null, estimated_nem_charges: null, billed_net_kwh: null,
  ...charges,
});

const calculated = (nem_charges: number) => ({ nem_charges, nem_source: "calculated" as const });
const billed = (nem_charges: number, estimated_nem_charges: number, billed_net_kwh: number) =>
  ({ nem_charges, nem_source: "statement" as const, estimated_nem_charges, billed_net_kwh });

const CURRENT_SPANS = [
  ["2026-11-03", "2026-12-03"], ["2026-12-04", "2027-01-05"], ["2027-01-06", "2027-02-03"], ["2027-02-04", "2027-03-04"],
  ["2027-03-05", "2027-04-05"], ["2027-04-06", "2027-05-05"], ["2027-05-06", "2027-06-03"], ["2027-06-04", "2027-07-06"],
  ["2027-07-07", "2027-08-04"], ["2027-08-05", "2027-09-02"], ["2027-09-03", "2027-10-04"],
];

export const CURRENT: Cycle[] = [
  row("2026-10-05", "2026-11-02", "'26 - '27", "2026-11-02", [576.6, 206.7, 369.8, -12], calculated(97.22)),
  row("2026-11-03", "2026-12-03", "'26 - '27", "2026-11-08", [83.5, 44.7, 38.8, -3.8], calculated(9.24)),
  ...CURRENT_SPANS.slice(1).map(([first, last]) => row(first, last, "'26 - '27", null, null)),
];

const RUNNING_25_26 = [363.6, 912.4, 2037.5, 2579.2, 2932.6, 2930.5, 3178.4, 2779.3, 2375.2, 1972.5, 2071.1, 2422.7];

const nothing = {
  charges_so_far: null, amount_due: null, source: null, minimum_delivery: null, net_exported_kwh: null, unused_credit: null,
  nsc_rate: null, nsc_estimate: null, projections: null, kwh_projection: null, last_year: null, vpp: null, rates_effective: "2026-06-01",
};

export const CURRENT_COST: Cost = {
  ...nothing,
  charges_so_far: 106.46,
  projections: [{ label: "'24 - '25", amount: 592.92 }, { label: "'25 - '26", amount: 652.39 }],
  kwh_projection: {
    years: [{ label: "'24 - '25", net: 2031.9 }, { label: "'25 - '26", net: 2361.5 }],
    band: {
      low: [null, 520.4, 1041.2, 1305.1, 1580.6, 1580.9, 1735.3, 1400.2, 1170.4, 1100.1, 1350.8, 2031.9],
      high: [null, 560.2, 1301.6, 1601.1, 1902.4, 1890.2, 2090.7, 1820.8, 1600.9, 1550.3, 1830.4, 2361.5],
    },
  },
  last_year: { label: "'25 - '26", running_net: RUNNING_25_26 },
  vpp: { season: 2027, payout: null, paid_on: null, kwh: 0, estimate: 0 },
};

export const YEAR_25_26: Cycle[] = [
  row("2025-10-03", "2025-11-03", "'25 - '26", "2025-11-03", [885.7, 522.1, 363.6, 413.4], billed(113.41, 113.72, 364)),
  row("2025-11-04", "2025-12-04", "'25 - '26", "2025-12-04", [957.4, 408.6, 548.8, 0], billed(172.92, 173.25, 549)),
  row("2025-12-05", "2026-01-05", "'25 - '26", "2026-01-05", [1375.8, 250.7, 1125.1, 0], billed(366.48, 366.8, 1125)),
  row("2026-01-06", "2026-02-04", "'25 - '26", "2026-02-04", [913.1, 371.3, 541.7, 0], { ...billed(194.93, 193.03, 547), uncorrected_days: 1 }),
  row("2026-02-05", "2026-03-08", "'25 - '26", "2026-03-08", [659.5, 306.0, 353.4, 0], billed(126.35, 126.81, 353)),
  row("2026-03-09", "2026-04-06", "'25 - '26", "2026-04-06", [252.7, 254.8, -2.1, 0], billed(2.47, 2.58, -2)),
  row("2026-04-07", "2026-05-05", "'25 - '26", "2026-05-05", [495.3, 247.4, 247.9, 0], billed(60.96, 60.78, 249)),
  row("2026-05-06", "2026-06-04", "'25 - '26", "2026-06-04", [50.4, 449.5, -399.1, 0], billed(-101.36, -102.04, -397)),
  row("2026-06-05", "2026-07-05", "'25 - '26", "2026-07-05", [7.6, 411.8, -404.1, 0], billed(-118.15, -118.75, -402)),
  row("2026-07-06", "2026-08-03", "'25 - '26", "2026-08-03", [7.4, 410.0, -402.7, 0], billed(-118.81, -119.46, -401)),
  row("2026-08-04", "2026-09-02", "'25 - '26", "2026-09-02", [386.0, 287.4, 98.6, 0], billed(27.21, 26.92, 100)),
  row("2026-09-03", "2026-10-04", "'25 - '26", "2026-10-04", [539.8, 188.1, 351.6, 0], billed(101.41, 101.36, 352)),
];

export const COST_25_26: Cost = {
  ...nothing,
  charges_so_far: 827.82, amount_due: 767.73, source: "statement", minimum_delivery: 60.09,
  last_year: { label: "'24 - '25", running_net: [160.3, 607.1, 1417.4, 1830.2, 2424.5, 2519.3, 2583.4, 2033.1, 1664.2, 1478.0, 1591.1, 1869.6] },
  vpp: { season: 2026, payout: null, paid_on: null, kwh: 183.8, estimate: 367.6 },
};

export const NO_COST: Cost = nothing;

// As /api/true-up-years lists them on November 8, 2026.
export const YEARS: TrueUpYear[] = [2022, 2023, 2024, 2025, 2026, 2027].map((end) => ({
  label: `'${String(end - 1).slice(2)} - '${String(end).slice(2)}`,
  start_date: `${end - 1}-10-01`, end_date: `${end}-09-30`,
  last_read_date: end === 2026 ? "2026-10-05" : `${end}-10-06`, current: end === 2027,
}));

export const yearOf = (end: number) => YEARS.find((year) => year.end_date === `${end}-09-30`)!;
