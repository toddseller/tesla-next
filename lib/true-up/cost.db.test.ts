// Ported from anton-tesla-api-ws tests/test_true_up_cost_api.py, test_true_up_cost.py's cycle charges and
// test_vpp_credit.py's season, against the tests' throwaway PostgreSQL.
import type { Client } from "pg";
import { afterAll, beforeAll, beforeEach, expect, test, vi } from "vitest";
import { pyRound } from "@/lib/intervals/python";
import { MARCH_2026, ownDatabase, seedIntervals, storeMeterDays, storeReads, storeRevision, storeStatement2026 } from "@/test/true-up";
import { cents, priceDays, segmentCharges, type Revision } from "./pricing";

let owner: Client;
let cost: typeof import("./cost");
let grid: typeof import("./grid");

beforeAll(async () => {
  owner = await ownDatabase("tsr_cost");
  cost = await import("./cost");
  grid = await import("./grid");
});

beforeEach(async () => {
  await owner.query(`DELETE FROM meter_read; DELETE FROM energy_interval; DELETE FROM meter_day; DELETE FROM rate_revision;
    DELETE FROM true_up_statement; DELETE FROM true_up_statement_cycle; DELETE FROM nsc_rate; DELETE FROM vpp_payout; DELETE FROM data`);
  for (const year of [2024, 2025, 2026]) await storeReads(owner, year);
});

afterAll(async () => {
  await owner.end();
  vi.unstubAllEnvs();
});

const march = { effective_date: "2026-03-01", ...MARCH_2026 } as Revision;

// --- Each cycle's charges ----------------------------------------------------------

test("statement cycles show PG&E's figures", async () => {
  await storeStatement2026(owner);

  const cycles = await cost.cycleRows("2025-10-01", "2026-09-30");

  expect([cycles[0], cycles.at(-1)].map((c) => [c!.first_day, c!.nem_charges, c!.nem_source])).toEqual([
    ["2025-10-03", 113.41, "statement"], ["2026-09-03", 101.41, "statement"],
  ]);
});

test("the open cycle is calculated from its days so far", async () => {
  await storeRevision(owner, "2026-03-01");
  // 10 Wh in every 5 minutes, October 5 to 21: 48.96 kWh, 10.2 of it at peak.
  await seedIntervals(owner, "2026-10-05", "2026-10-21", { grid_imported_wh: 10 });

  const [cycle] = await cost.cycleRows("2026-10-01", "2027-09-30");

  expect([cycle.nem_charges, cycle.nem_source]).toEqual([segmentCharges(march, "winter", 17, 10.2, 38.76, 48.96).total, "calculated"]);
  expect([cycle.estimated_nem_charges, cycle.billed_net_kwh]).toEqual([null, null]);
});

test("billed cycles give their estimate and PG&E's net", async () => {
  await storeRevision(owner, "2025-09-01");
  await seedIntervals(owner, "2025-10-03", "2025-11-03", { grid_imported_wh: 10 });
  await storeStatement2026(owner);

  const [first, second] = await cost.cycleRows("2025-10-01", "2026-09-30");

  const { days } = await grid.dailyGrid("2025-10-03", "2025-11-03");
  const estimate = priceDays("2025-10-03", "2025-11-03", days, [{ ...march, effective_date: "2025-09-01" }]);
  expect([first.nem_charges, first.billed_net_kwh, first.estimated_nem_charges]).toEqual([113.41, 364, estimate]);
  expect(estimate).not.toBeNull();
  // No energy data for the second cycle's days: PG&E's figure and net, no estimate.
  expect([second.nem_charges, second.estimated_nem_charges, second.billed_net_kwh]).toEqual([172.92, null, 549]);
});

test("a billed cycle without rates has PG&E's figure and net, no estimate", async () => {
  await seedIntervals(owner, "2025-10-03", "2025-10-04", { grid_imported_wh: 10 });
  await storeStatement2026(owner);

  const [first] = await cost.cycleRows("2025-10-01", "2026-09-30");

  expect([first.nem_charges, first.nem_source, first.estimated_nem_charges, first.billed_net_kwh]).toEqual([113.41, "statement", null, 364]);
});

test("cycles without rates or a statement have no charges", async () => {
  await seedIntervals(owner, "2022-10-07", "2022-10-08", { grid_imported_wh: 10 });

  const [cycle] = await cost.cycleRows("2022-10-01", "2023-09-30");

  expect([cycle.nem_charges, cycle.nem_source]).toEqual([null, null]);
});

// --- The year's true-up ------------------------------------------------------------

const TRUE_UP_25_26 = ["2025-10-01", "2026-09-30"] as const;
const TRUE_UP_26_27 = ["2026-10-01", "2027-09-30"] as const;
const AFTER_THE_OCTOBER_READ = "2026-11-08";

test("a finished year with a statement", async () => {
  await storeStatement2026(owner);

  const data = await cost.trueUpCost(...TRUE_UP_25_26, AFTER_THE_OCTOBER_READ);

  expect(data).toMatchObject({ amount_due: 767.73, source: "statement", minimum_delivery: 60.09, charges_so_far: 827.82 });
  expect(data).toMatchObject({ unused_credit: null, nsc_rate: null, nsc_estimate: null, projections: null, kwh_projection: null });
});

test("a year without dollars", async () => {
  const data = await cost.trueUpCost("2022-10-01", "2023-09-30", AFTER_THE_OCTOBER_READ);

  expect(data).toMatchObject({ charges_so_far: null, amount_due: null, source: null, projections: null, vpp: null });
});

test("a range that isn't a true-up year has every field null but the newest rates' date", async () => {
  await storeRevision(owner, "2026-03-01");

  const data = await cost.trueUpCost("2026-01-01", "2026-03-31", AFTER_THE_OCTOBER_READ);

  expect(Object.entries(data).filter(([, value]) => value !== null)).toEqual([["rates_effective", "2026-03-01"]]);
});

test("a finished year without a statement is priced less its minimum delivery", async () => {
  await storeRevision(owner, "2023-09-01", { minimum_delivery_daily: 0.37612 });
  await storeRevision(owner, "2024-03-01", { minimum_delivery_daily: 0.39167 });
  await storeMeterDays(owner, "2023-10-06", "2024-10-03");

  const data = await cost.trueUpCost("2023-10-01", "2024-09-30", AFTER_THE_OCTOBER_READ);

  expect([data.source, data.minimum_delivery, data.amount_due]).toEqual(["calculated", 140.28, pyRound(data.charges_so_far! - 140.28, 2)]);
  const cycles = await cost.cycleRows("2023-10-01", "2024-09-30");
  expect(cycles.map((c) => c.nem_source)).toEqual(Array(12).fill("calculated"));
});

async function exporting2324(nscMonths: Record<string, number>) {
  await storeRevision(owner, "2023-09-01");
  for (const [month, rate] of Object.entries(nscMonths)) await owner.query("INSERT INTO nsc_rate VALUES ($1, $2)", [month, rate]);
  // 32 kWh a day exported on balance.
  await storeMeterDays(owner, "2023-10-06", "2024-10-03", { imported: 8, exported: 40, peakImported: 2, peakExported: 10 });
}

test("a calculated year ending in credit estimates Net Surplus Compensation", async () => {
  await exporting2324({ "2024-10-01": 0.03656 });

  const data = await cost.trueUpCost("2023-10-01", "2024-09-30", AFTER_THE_OCTOBER_READ);

  expect(data.amount_due).toBe(0);
  expect(data.charges_so_far).toBeLessThan(0);
  expect([data.unused_credit, data.nsc_rate, data.nsc_estimate]).toEqual([-data.charges_so_far!, 0.03656, cents(data.net_exported_kwh! * 0.03656)]);
});

test("a true-up month without a rate gives the kWh only", async () => {
  await exporting2324({ "2024-09-01": 0.03781 });

  const data = await cost.trueUpCost("2023-10-01", "2024-09-30", AFTER_THE_OCTOBER_READ);

  expect(data.net_exported_kwh).toBeGreaterThan(0);
  expect([data.nsc_rate, data.nsc_estimate]).toEqual([null, null]);
});

// --- The current year's projections ---------------------------------------------------

// One day of intervals at the start of each of the year's cycles: 0.288 kWh per Wh, so every cycle has a net.
async function seedEachCycle(start: string, end: string, wh: number, skip: number[] = []) {
  for (const [i, cycle] of (await grid.cycles(start, end)).entries())
    if (!skip.includes(i)) await seedIntervals(owner, cycle.first_day, cycle.first_day, { grid_imported_wh: wh });
}

async function comparableYears() {
  await seedEachCycle("2024-10-01", "2025-09-30", 10);
  await seedEachCycle(...TRUE_UP_25_26, 20);
  // The current year: October 5 to 21 so far, 49.0 kWh.
  await seedIntervals(owner, "2026-10-05", "2026-10-21", { grid_imported_wh: 10 });
}

const currentCost = () => cost.trueUpCost(...TRUE_UP_26_27, "2026-10-23");

test("the current year projects its year-end net from each comparable year", async () => {
  await comparableYears();

  const projection = (await currentCost()).kwh_projection!;

  // 49.0 so far (October 5 to 21 of a cycle running to November 2), plus 12 of its 29 days at 2.9 or 5.8 kWh a cycle,
  // plus the 11 cycles after it.
  expect(projection.years).toEqual([{ label: "'24 - '25", net: 82.1 }, { label: "'25 - '26", net: 115.2 }]);
  expect([projection.band.low.length, projection.band.high.length]).toEqual([12, 12]);
  expect([projection.band.low.at(-1), projection.band.high.at(-1)]).toEqual([82.1, 115.2]);
});

test("a comparable year missing a cycle's net is left out", async () => {
  await seedEachCycle("2024-10-01", "2025-09-30", 10);
  await seedEachCycle(...TRUE_UP_25_26, 20, [11]);
  await seedIntervals(owner, "2026-10-05", "2026-10-21", { grid_imported_wh: 10 });

  expect((await currentCost()).kwh_projection!.years.map((y) => y.label)).toEqual(["'24 - '25"]);
});

test("the kWh projection doesn't need rates", async () => {
  await comparableYears();

  const data = await currentCost();

  expect([data.charges_so_far, data.projections]).toEqual([null, null]);
  expect(data.kwh_projection).not.toBeNull();
});

test("finished years and other ranges have no kWh projection", async () => {
  await comparableYears();
  await storeStatement2026(owner);

  for (const [start, end] of [TRUE_UP_25_26, ["2022-10-01", "2023-09-30"], ["2026-01-01", "2026-03-31"]])
    expect((await cost.trueUpCost(start, end, "2026-10-23")).kwh_projection).toBeNull();
});

test("the dollar projections use the same comparable years, repriced at the newest rates", async () => {
  await comparableYears();
  await storeRevision(owner, "2026-03-01");

  const data = await currentCost();

  expect(data.charges_so_far).not.toBeNull();
  expect(data.projections!.map((p) => p.label)).toEqual(data.kwh_projection!.years.map((y) => y.label));
});

// --- Last year's running net -------------------------------------------------------

const running = (perCycle: number) => Array.from({ length: 12 }, (_, i) => pyRound(perCycle * (i + 1), 1));

test("a finished year gives last year's running net", async () => {
  await comparableYears();
  await storeStatement2026(owner);

  expect((await cost.trueUpCost(...TRUE_UP_25_26, AFTER_THE_OCTOBER_READ)).last_year).toEqual({ label: "'24 - '25", running_net: running(2.9) });
});

test("a year without dollars still gives last year", async () => {
  await seedEachCycle("2021-10-01", "2022-09-30", 10);

  expect((await cost.trueUpCost("2022-10-01", "2023-09-30", AFTER_THE_OCTOBER_READ)).last_year).toEqual({ label: "'21 - '22", running_net: running(2.9) });
});

test("the current year gives all of last year's cycles", async () => {
  await comparableYears();

  expect((await currentCost()).last_year).toEqual({ label: "'25 - '26", running_net: running(5.8) });
});

test("a cycle without a net keeps its place", async () => {
  await seedEachCycle("2024-10-01", "2025-09-30", 10, [5]);

  const { running_net } = (await cost.trueUpCost(...TRUE_UP_25_26, AFTER_THE_OCTOBER_READ)).last_year!;

  expect(running_net.slice(4, 7)).toEqual([14.5, null, 17.4]);
});

test("the first year and other ranges have no last year", async () => {
  expect((await cost.trueUpCost("2021-10-01", "2022-09-30", AFTER_THE_OCTOBER_READ)).last_year).toBeNull();
  expect((await cost.trueUpCost("2026-01-01", "2026-03-31", AFTER_THE_OCTOBER_READ)).last_year).toBeNull();
});

// --- The VPP season ------------------------------------------------------------------

const vppDay = (date: string, powerwallToGrid: number, isVpp: boolean) =>
  owner.query("INSERT INTO data (date, powerwall_to_grid, is_vpp) VALUES ($1, $2, $3)", [date, powerwallToGrid, isVpp]);

test("the estimate counts marked days at $2 a kWh", async () => {
  for (const [date, kwh] of [["2026-08-03", 26.8], ["2026-08-25", 25.9], ["2026-08-26", 26.4], ["2026-09-09", 26.1],
    ["2026-09-10", 26.5], ["2026-10-05", 25.9], ["2026-10-06", 26.2]] as const) await vppDay(date, kwh, true);
  await vppDay("2026-06-02", 15.7, false); // an export before dawn, not an event
  await vppDay("2026-11-12", 20, true); // after the season

  expect(await cost.vppSeason(2026)).toEqual({ season: 2026, payout: null, paid_on: null, kwh: 183.8, estimate: 367.6 });
});

test("a paid season keeps its estimate for comparison", async () => {
  await owner.query("INSERT INTO vpp_payout VALUES (2025, 728.26, '2026-04-02')");
  await vppDay("2025-10-22", 13.2, true);

  expect(await cost.vppSeason(2025)).toMatchObject({ payout: 728.26, paid_on: "2026-04-02", estimate: 26.4 });
});

test("the true-up year shows the season it ends in", async () => {
  await owner.query("INSERT INTO vpp_payout VALUES (2025, 728.26, '2026-04-02')");

  expect((await cost.trueUpCost("2024-10-01", "2025-09-30", AFTER_THE_OCTOBER_READ)).vpp).toMatchObject({ season: 2025, payout: 728.26, paid_on: "2026-04-02" });
});

test("the current year starts with nothing to estimate", async () => {
  expect((await cost.trueUpCost(...TRUE_UP_26_27, AFTER_THE_OCTOBER_READ)).vpp).toMatchObject({ season: 2027, payout: null, estimate: 0 });
});

test("no season before the first", async () => {
  expect(await cost.vppSeason(2023)).toBeNull();
});
