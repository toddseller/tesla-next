import { expect, test } from "vitest";
import { MARCH_2026 } from "@/test/true-up";
import { amountDue, cents, minimumDelivery, priceDays, project, projectNet, type Revision, segmentCharges, segments, surplus, trueUpMonth } from "./pricing";

// The E-TOU-C revision behind the 2025 statement's line items.
const SEPTEMBER_2025 = { // Advice Letter 7684-E, with 7469-E's vintaged PCIA
  summer_peak_total: 0.61457, summer_off_peak_total: 0.49157, winter_peak_total: 0.48974, winter_off_peak_total: 0.45974,
  summer_peak_generation: 0.25797, summer_off_peak_generation: 0.15497,
  winter_peak_generation: 0.18725, winter_off_peak_generation: 0.16057,
  baseline_credit: 0.10084, bundled_pcia: -0.02327, vintage_pcia: 0.0111, nbc: 0.03143,
  summer_baseline_kwh: 6.5, winter_baseline_kwh: 7.5, minimum_delivery_daily: 0,
};

const revision = (effective_date: string, rates: typeof MARCH_2026, minimum = 0): Revision =>
  ({ effective_date, ...rates, minimum_delivery_daily: minimum });
const march = revision("2026-03-01", MARCH_2026);

test.each([
  [0.125, 0.13], // Decimal("0.125") is a tie, rounded up, where round() would go to even
  [2.675, 2.68], // the double is a little below 2.675, but str() reads "2.675"
  [1.005, 1.01],
  [-0.125, -0.13],
  [-30.7834, -30.78],
  [136.0050, 136.01],
  [1e-7, 0],
  [0, 0],
])("cents(%s) is %s, as Python's Decimal(str(x)) half up", (value, expected) => {
  expect(cents(value)).toBe(expected);
});

test("September 3 to 30, 2026, as billed", () => {
  // Imports chosen so the non-bypassable charge is the bill's $5.75.
  const lines = segmentCharges(march, "summer", 28, -58.9291, 340.5411, 467.48);

  expect(lines).toMatchObject({ peak: -30.78, off_peak: 136.01, baseline_credit: -14.81, generation_credit: -20.6, pcia: 10.38, nbc: 5.75 });
  // The bill's net usage adjustment is -$3.45, a cent PG&E's published rates don't explain.
  expect(Math.abs(lines.nbc_net_usage_adjustment + 3.45)).toBeLessThanOrEqual(0.011);
  expect(Math.abs(lines.total - 82.5)).toBeLessThanOrEqual(0.011);
});

test("October 1 to 4, 2026, as billed", () => {
  const lines = segmentCharges(march, "winter", 4, -0.0372, 70.1781, 70.73);

  expect(lines).toMatchObject({ peak: -0.01, off_peak: 25.8, baseline_credit: -2.44, generation_credit: -7.04, pcia: 2.59, nbc: 0.87 });
  expect(Math.abs(lines.total - 18.91)).toBeLessThanOrEqual(0.011);
});

test("September 4 to 30, 2025, as billed", () => {
  const lines = segmentCharges(revision("2025-09-01", SEPTEMBER_2025), "summer", 27, -60.6379, 323.4515, 763.6);

  expect(lines).toMatchObject({ peak: -37.27, off_peak: 159, baseline_credit: -17.7, generation_credit: -28.37, pcia: 2.92, nbc: 24 });
  expect(Math.abs(lines.total - 94.33)).toBeLessThanOrEqual(0.011);
});

test.each([
  ["above the allowance, credited on the allowance", "summer", 28, 100, 181.6, -14.81], // 281.6 kWh net, 182 allowance
  ["exported beyond the allowance, charged back on it", "summer", 31, -109, -293, 16.4], // 402 exported, 201.5 allowance
  ["exported within the allowance, charged back in full", "summer", 29, -75, -111, 15.14], // 186 exported, 188.5 allowance
  ["below the allowance, credited on the net", "winter", 30, 20, 80, -8.14], // 100 net, 225 allowance
] as const)("baseline credit: net %s", (_, season, days, peak, offPeak, credit) => {
  expect(segmentCharges(march, season, days, peak, offPeak, 10).baseline_credit).toBe(credit);
});

test("a cycle across October 1 splits by season", () => {
  const parts = segments("2026-09-03", "2026-10-04", [march])!;

  expect(parts.map((s) => [s.first, s.last, s.season, s.days, s.revision.effective_date, s.allowance])).toEqual([
    ["2026-09-03", "2026-09-30", "summer", 28, "2026-03-01", 182],
    ["2026-10-01", "2026-10-04", "winter", 4, "2026-03-01", 30],
  ]);
});

test("a cycle splits where new rates take effect", () => {
  const parts = segments("2025-12-05", "2026-01-05", [revision("2025-09-01", SEPTEMBER_2025), revision("2026-01-01", MARCH_2026)])!;

  expect(parts.map((s) => [s.first, s.last, s.revision.effective_date])).toEqual([
    ["2025-12-05", "2025-12-31", "2025-09-01"],
    ["2026-01-01", "2026-01-05", "2026-01-01"],
  ]);
});

test("a fixed revision prices every day at it", () => {
  const parts = segments("2025-12-05", "2026-01-05", [revision("2026-06-01", MARCH_2026)], march)!;

  expect(parts.map((s) => s.revision)).toEqual([march]);
});

test("days without rates leave the cycle unpriced", () => {
  expect(segments("2025-12-05", "2026-01-05", [revision("2026-01-01", MARCH_2026)])).toBeNull();
  expect(priceDays("2025-12-05", "2026-01-05", {}, [])).toBeNull();
});

test("days are priced by segment from their Wh", () => {
  const days = {
    "2026-09-30": { imported: 10000, exported: 2000, peak_net: 1000 },
    "2026-10-01": { imported: 12000, exported: 1000, peak_net: -500 },
  };
  const summer = segmentCharges(march, "summer", 1, 1, 7, 10).total;
  const winter = segmentCharges(march, "winter", 1, -0.5, 11.5, 12).total;

  expect(priceDays("2026-09-30", "2026-10-01", days, [march])).toBe(Number((summer + winter).toFixed(2)));
});

test("a year's minimum delivery runs at each day's rate", () => {
  const revisions = [revision("2023-09-01", MARCH_2026, 0.37612), revision("2024-03-01", MARCH_2026, 0.39167)];

  // '23 - '24: 147 days at $0.37612, then 217 at $0.39167.
  expect(minimumDelivery("2023-10-06", "2024-10-03", revisions)).toBe(140.28);
  expect(amountDue(600, 140.28)).toBe(459.72);
  // The 2025 statement's cycle ending at the November 4, 2024 read.
  expect(minimumDelivery("2024-10-04", "2024-11-03", revisions)).toBe(12.14);
  expect(minimumDelivery("2026-10-05", "2026-11-03", [revision("2026-03-01", MARCH_2026, 0)])).toBe(0);
});

test("the amount due is never below zero", () => {
  expect(amountDue(-58.03, 0)).toBe(0);
});

test("a year trues up in the month of its October read", () => {
  // '23 - '24's last cycle ends October 3, 2024, the day before the October 4 read.
  expect(trueUpMonth("2024-10-03")).toBe("2024-10-01");
});

test("credit left over and Net Surplus Compensation", () => {
  expect(surplus(-58.03, 412.3, 0.03656)).toEqual({ unused_credit: 58.03, nsc_estimate: 15.07 });
  expect(surplus(-58.03, 412.3, null)).toEqual({ unused_credit: 58.03, nsc_estimate: null });
  expect(surplus(12, null, 0.03656)).toEqual({ unused_credit: null, nsc_estimate: null });
});

test("the amount due once per comparable year", () => {
  const comparable: [string, number[]][] = [["'24 - '25", [50, 700, ...Array(10).fill(0)]], ["'25 - '26", [60, 780, ...Array(10).fill(0)]]];

  // $20 so far with the open cycle half over.
  expect(project(20, 0, 0.5, comparable)).toEqual([{ label: "'24 - '25", amount: 745 }, { label: "'25 - '26", amount: 830 }]);
});

// This year: 100 kWh so far, the open cycle half over.
const CURRENT_NETS = [100, ...Array(11).fill(null)];
const COMPARABLE_NETS: [string, number[]][] = [["'24 - '25", [100, 1500, ...Array(10).fill(0)]], ["'25 - '26", [200, 1800, ...Array(10).fill(0)]]];

test("the year-end net: so far, plus the rest of the open cycle prorated, plus every later cycle", () => {
  expect(projectNet(CURRENT_NETS, 0.5, COMPARABLE_NETS)!.years).toEqual([{ label: "'24 - '25", net: 1650 }, { label: "'25 - '26", net: 2000 }]);
});

test("the band runs from the open cycle between the lowest and highest running net", () => {
  const { band } = projectNet(CURRENT_NETS, 0.5, COMPARABLE_NETS)!;

  expect(band.low).toEqual([150, 1650, ...Array(10).fill(1650)]);
  expect(band.high).toEqual([200, 2000, ...Array(10).fill(2000)]);
});

test("cycles before the open one have no band", () => {
  const { band } = projectNet([100, 50, 25, 10, ...Array(8).fill(null)], 0.5, COMPARABLE_NETS)!;

  expect(band.low.slice(0, 4)).toEqual([null, null, null, 185]);
});

test("no comparable year or nothing started gives no projection", () => {
  expect(projectNet(CURRENT_NETS, 0.5, [])).toBeNull();
  expect(projectNet(Array(12).fill(null), 0.5, COMPARABLE_NETS)).toBeNull();
});
