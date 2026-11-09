import type { Client } from "pg";
import { afterAll, beforeAll, beforeEach, expect, test, vi } from "vitest";
import { MARCH_2026, ownDatabase, putInterval, seedIntervals, storeMeterDays, storeReads, storeRevision } from "@/test/true-up";
import { type DayGrid, minimumDelivery, priceDays, type Revision } from "./pricing";
import { generationCharges } from "./westlight";

let owner: Client;
let savings: typeof import("./savings");
let grid: typeof import("./grid");

beforeAll(async () => {
  owner = await ownDatabase("tsr_savings");
  savings = await import("./savings");
  grid = await import("./grid");
});

beforeEach(async () => {
  await owner.query("DELETE FROM meter_read; DELETE FROM energy_interval; DELETE FROM meter_day; DELETE FROM rate_revision; DELETE FROM data; DELETE FROM grid_outage; DELETE FROM site_state");
  for (const year of [2024, 2025, 2026]) await storeReads(owner, year);
});

afterAll(async () => {
  await owner.end();
  vi.unstubAllEnvs();
});

test("a sunny interval and an evening one, in each case", async () => {
  // The house used 300 Wh of 900 Wh of solar and the Powerwalls stored the rest; at 6 p.m. they ran the house.
  await putInterval(owner, "2026-06-10 12:00", { solar_generated_wh: 900, house_from_solar_wh: 300, battery_imported_from_solar_wh: 600 });
  await putInterval(owner, "2026-06-10 18:00", { house_from_battery_wh: 400, battery_exported_wh: 400 });

  const days = await savings.caseDays("2026-06-10", "2026-06-10");

  expect(days["2026-06-10"]).toEqual({
    solarOnly: { imported: 400, exported: 600, peak_net: 400 },
    noSystem: { imported: 700, exported: 0, peak_net: 400 },
    shortfall: 400, peakExported: 0, vpp: false, storm: false, powerwalls: { peak: 400, charged: 600, discharged: 400 },
  });
});

// Grid outages, from a site wall time, lasting so many seconds.
const outage = (start: string, seconds: number) =>
  owner.query("INSERT INTO grid_outage SELECT t, t + make_interval(secs => $2) FROM (SELECT ($1 || ' America/Los_Angeles')::timestamptz AS t) s", [start, seconds]);

test("an outage is dark without the Powerwalls: neither other case imports or exports through it", async () => {
  await putInterval(owner, "2026-06-10 18:00", { house_from_battery_wh: 400, battery_exported_wh: 400 });
  await putInterval(owner, "2026-06-10 12:00", { solar_generated_wh: 900, house_from_solar_wh: 300, battery_imported_from_solar_wh: 600 });
  await outage("2026-06-10 11:00:00", 3 * 3600);
  await outage("2026-06-10 17:30:00", 3600);

  expect((await savings.caseDays("2026-06-10", "2026-06-10"))["2026-06-10"]).toMatchObject({
    solarOnly: { imported: 0, exported: 0, peak_net: 0 },
    noSystem: { imported: 0, exported: 0, peak_net: 0 },
    shortfall: 0, peakExported: 0, powerwalls: { peak: 400, charged: 600, discharged: 400 },
  });
});

test("half an interval in an outage is half dark; a blip counts, a test doesn't", async () => {
  await putInterval(owner, "2026-06-10 09:00", { house_from_grid_wh: 300, grid_imported_wh: 300 });
  await putInterval(owner, "2026-06-10 10:00", { house_from_grid_wh: 300, grid_imported_wh: 300 });
  await putInterval(owner, "2026-06-10 14:00", { house_from_grid_wh: 200, grid_imported_wh: 200 });
  await outage("2026-06-10 09:02:30", 150);
  await outage("2026-06-10 10:00:00", 30);
  await outage("2026-06-10 14:00:00", 600);
  await owner.query("INSERT INTO site_state VALUES ('2026-06-10 13:59:00-07', '2026-06-10 14:11:00-07', 'off_grid_intentional', false)");

  const { solarOnly, noSystem } = (await savings.caseDays("2026-06-10", "2026-06-10"))["2026-06-10"];
  expect(solarOnly.imported).toBe(150 + 300 * 0.9 + 200);
  expect(noSystem.imported).toBe(150 + 300 * 0.9 + 200);
});

test("a day before the meter fix is scaled to PG&E's readings, period by period", async () => {
  // Tesla read 4 kWh imported in peak hours and 1 kWh exported off-peak; PG&E's meter recorded 8 and 3.
  await putInterval(owner, "2025-07-10 17:00", { grid_imported_wh: 2000, house_from_grid_wh: 2000 });
  await putInterval(owner, "2025-07-10 17:05", { grid_imported_wh: 2000, house_from_grid_wh: 2000 });
  await putInterval(owner, "2025-07-10 10:00", { solar_generated_wh: 1000, grid_exported_from_solar_wh: 1000 });
  await storeMeterDays(owner, "2025-07-10", "2025-07-10", { imported: 8, exported: 3, peakImported: 8, peakExported: 0 });

  const days = await savings.caseDays("2025-07-10", "2025-07-10");

  // The house's use grows by the 4 kWh more imported and shrinks by the 2 kWh more exported.
  expect(days["2025-07-10"]).toEqual({
    solarOnly: { imported: 8000, exported: 3000, peak_net: 8000 },
    noSystem: { imported: 6000, exported: 0, peak_net: 8000 },
    // The shortfall comes from the rebuilt house use, not Tesla's half-read grid.
    shortfall: 8000, peakExported: 0, vpp: false, storm: false, powerwalls: { peak: 0, charged: 0, discharged: 0 },
  });
});

test("solar exported from 4 to 9 p.m. is kept apart from the rest of the day's exports", async () => {
  await putInterval(owner, "2026-06-10 17:00", { solar_generated_wh: 1000, house_from_solar_wh: 200, grid_exported_from_solar_wh: 800 });
  await putInterval(owner, "2026-06-10 12:00", { solar_generated_wh: 500, grid_exported_from_solar_wh: 500 });

  const days = await savings.caseDays("2026-06-10", "2026-06-10");

  expect(days["2026-06-10"]).toMatchObject({ solarOnly: { exported: 1300 }, shortfall: 0, peakExported: 800 });
});

test("a rebuilt day's actual case is PG&E's", async () => {
  await putInterval(owner, "2025-07-10 17:00", { grid_imported_wh: 2000, house_from_grid_wh: 2000 });
  await storeMeterDays(owner, "2025-07-10", "2025-07-10", { imported: 8, exported: 3, peakImported: 5, peakExported: 1 });

  const { days } = await grid.dailyGrid("2025-07-10", "2025-07-10");

  expect(days["2025-07-10"]).toEqual({ imported: 8000, exported: 3000, peak_net: 4000 });
});

test("a period with nothing to scale gets PG&E's energy spread evenly", async () => {
  await putInterval(owner, "2025-07-11 16:00", { house_from_battery_wh: 500 });
  await putInterval(owner, "2025-07-11 16:05", { house_from_battery_wh: 500 });
  await storeMeterDays(owner, "2025-07-11", "2025-07-11", { imported: 2, exported: 0, peakImported: 2, peakExported: 0 });

  const days = await savings.caseDays("2025-07-11", "2025-07-11");

  expect(days["2025-07-11"].noSystem).toEqual({ imported: 3000, exported: 0, peak_net: 3000 });
});

test("a day before the fix without PG&E's reading, and a day after it, are used as stored", async () => {
  await putInterval(owner, "2025-07-12 17:00", { grid_imported_wh: 1000, house_from_grid_wh: 1000 });
  await putInterval(owner, "2026-06-11 17:00", { grid_imported_wh: 1000, house_from_grid_wh: 1000 });
  await storeMeterDays(owner, "2026-06-11", "2026-06-11", { imported: 50, exported: 0, peakImported: 50, peakExported: 0 });

  const days = await savings.caseDays("2025-07-12", "2026-06-11");

  for (const day of ["2025-07-12", "2026-06-11"])
    expect(days[day].noSystem).toEqual({ imported: 1000, exported: 0, peak_net: 1000 });
});

// --- A true-up year's savings ---------------------------------------------------------

const rates = (effective_date: string, minimum = 0) => [{ effective_date, ...MARCH_2026, minimum_delivery_daily: minimum } as Revision];

test("the three cases priced: both NEM cases in credit cost the minimum delivery charges", async () => {
  await storeRevision(owner, "2026-03-01", { minimum_delivery_daily: 0.39167 });
  // October 5 and 6, 2026: every 5 minutes 30 Wh of solar, 10 Wh of it to the house and 20 exported.
  await seedIntervals(owner, "2026-10-05", "2026-10-06", { solar_generated_wh: 30, house_from_solar_wh: 10, grid_exported_from_solar_wh: 20 });

  const result = (await savings.trueUpSavings("2026-10-01", "2027-09-30"))!;

  const noSystem = { imported: 2880, exported: 0, peak_net: 600 };
  const noSystemDays = { "2026-10-05": noSystem, "2026-10-06": noSystem };
  const minimum = minimumDelivery("2026-10-05", "2026-10-06", rates("2026-03-01", 0.39167));
  expect(minimum).toBe(0.78);
  expect([result.actual.pge, result.solar_only.pge]).toEqual([minimum, minimum]);
  expect(result.no_system.pge).toBe(priceDays("2026-10-05", "2026-10-06", noSystemDays, rates("2026-03-01", 0.39167)));
  expect(result.no_system.westlight).toBe(generationCharges("2026-10-05", "2026-10-06", noSystemDays)!.total);
  expect(result.no_system.total).toBe(Math.round((result.no_system.pge + result.no_system.westlight) * 100) / 100);
  expect(result.solar_saved).toBe(Math.round((result.no_system.total - result.solar_only.total) * 100) / 100);
  expect(result.powerwalls_added).toBe(0);
  expect(result).toMatchObject({ through: "2026-10-06", rebuilt_days: 0, uncorrected_days: 0, pge_rates: "2026-03-01", westlight_rates: "2026-07-01" });
});

test("an importing year's NEM charges stand above the minimum", async () => {
  await storeRevision(owner, "2026-03-01", { minimum_delivery_daily: 0.39167 });
  await seedIntervals(owner, "2026-10-05", "2026-10-06", { grid_imported_wh: 50, house_from_grid_wh: 50 });

  const result = (await savings.trueUpSavings("2026-10-01", "2027-09-30"))!;

  const actual = { imported: 14400, exported: 0, peak_net: 3000 };
  expect(result.actual.pge).toBe(priceDays("2026-10-05", "2026-10-06", { "2026-10-05": actual, "2026-10-06": actual }, rates("2026-03-01", 0.39167)));
  expect(result.actual.pge).toBeGreaterThan(0.78);
});

test("Powerwalls charged from the grid at peak cost money, and the figure says so", async () => {
  await storeRevision(owner, "2026-03-01");
  await putInterval(owner, "2026-10-05 18:00", { grid_imported_wh: 10000, battery_imported_from_grid_wh: 10000 });
  await putInterval(owner, "2026-10-06 01:00", { house_from_battery_wh: 9000, battery_exported_wh: 9000 });

  const result = (await savings.trueUpSavings("2026-10-01", "2027-09-30"))!;

  expect(result.powerwalls_added).toBeLessThan(0);
  expect(result.powerwalls_added).toBe(Math.round((result.solar_only.total - result.actual.total) * 100) / 100);
});

test("days before the fix count as rebuilt from PG&E's meter or used without it", async () => {
  await storeRevision(owner, "2025-09-01");
  await putInterval(owner, "2025-11-01 17:00", { grid_imported_wh: 1000, house_from_grid_wh: 1000 });
  await putInterval(owner, "2025-11-02 17:00", { grid_imported_wh: 1000, house_from_grid_wh: 1000 });
  await storeMeterDays(owner, "2025-11-01", "2025-11-01");

  const result = (await savings.trueUpSavings("2025-10-01", "2026-09-30"))!;

  // Uncorrected days are counted as the page's metering note counts them: every day so far without PG&E's reading,
  // October 3 to November 2 less November 1.
  expect([result.rebuilt_days, result.uncorrected_days, result.through]).toEqual([1, 30, "2025-11-02"]);
});

test("a day with PG&E's reading and no intervals counts in no case", async () => {
  await storeRevision(owner, "2025-09-01");
  await putInterval(owner, "2025-11-02 17:00", { grid_imported_wh: 1000, house_from_grid_wh: 1000 });
  await storeMeterDays(owner, "2025-11-02", "2025-11-02");
  const without = await savings.trueUpSavings("2025-10-01", "2026-09-30");
  // November 1: the meter's 40 kWh in, with no 5-minute data to rebuild the other cases from.
  await storeMeterDays(owner, "2025-11-01", "2025-11-01");

  const result = (await savings.trueUpSavings("2025-10-01", "2026-09-30"))!;

  expect(result.actual).toEqual(without!.actual);
  expect(result.powerwalls_added).toBe(without!.powerwalls_added);
  expect(result.rebuilt_days).toBe(1);
});

// October 5, 2026 the batteries covered the evening; October 6 they sat full while the house imported at 6 p.m.
async function usedAndHeld() {
  await storeRevision(owner, "2026-03-01", { minimum_delivery_daily: 0.39167 });
  await putInterval(owner, "2026-10-05 12:00", { solar_generated_wh: 10000, house_from_solar_wh: 1000, battery_imported_from_solar_wh: 6000, grid_exported_from_solar_wh: 3000 });
  await putInterval(owner, "2026-10-05 18:00", { house_from_battery_wh: 5400, battery_exported_wh: 5400 });
  await putInterval(owner, "2026-10-06 12:00", { solar_generated_wh: 8000, house_from_solar_wh: 1000, battery_imported_from_solar_wh: 7000 });
  await putInterval(owner, "2026-10-06 18:00", { grid_imported_wh: 4000, house_from_grid_wh: 4000 });
}

const price = (days: Record<string, DayGrid>, nem: boolean) => {
  const revisions = rates("2026-03-01", 0.39167);
  const pge = priceDays("2026-10-05", "2026-10-06", days, revisions)!;
  const floored = nem ? Math.max(pge, minimumDelivery("2026-10-05", "2026-10-06", revisions)) : pge;
  return Math.round((floored + generationCharges("2026-10-05", "2026-10-06", days)!.total) * 100) / 100;
};

test("used and held days split what the Powerwalls added, and peak-only reprices the used days", async () => {
  await usedAndHeld();

  const result = (await savings.trueUpSavings("2026-10-01", "2027-09-30"))!;
  const days = await savings.caseDays("2026-10-05", "2026-10-06");
  const { days: actual } = await grid.dailyGrid("2026-10-05", "2026-10-06");

  expect([result.used_days, result.held_days]).toEqual([1, 1]);
  // Measured on the used day alone: the held day's 7 kWh charge with nothing out is standby the held part already carries.
  expect(result.efficiency).toBeCloseTo(5400 / 6000, 6);
  // Held days as solar only, used days as they were.
  const heldAsSolarOnly = price({ "2026-10-05": actual["2026-10-05"], "2026-10-06": days["2026-10-06"].solarOnly }, true);
  expect(result.powerwalls_used).toBe(Math.round((result.solar_only.total - heldAsSolarOnly) * 100) / 100);
  expect(Math.round((result.powerwalls_held + result.powerwalls_used) * 100) / 100).toBe(result.powerwalls_added);
  // Peak-only: the held day as it was, the used day covering only its evening.
  const peakOnly = { "2026-10-05": savings.peakOnlyDay(days["2026-10-05"], 5400 / 6000), "2026-10-06": actual["2026-10-06"] };
  expect(result.peak_only!.total).toBe(price(peakOnly, true));
});

test("a VPP event day is its own part, kept as it was in peak-only and left out of the efficiency", async () => {
  await usedAndHeld();
  // October 7: the batteries charge from solar and export 10 kWh to the grid at 6 p.m. for a marked VPP event.
  await putInterval(owner, "2026-10-07 12:00", { solar_generated_wh: 12000, house_from_solar_wh: 1000, battery_imported_from_solar_wh: 11000 });
  await putInterval(owner, "2026-10-07 18:00", { battery_exported_wh: 10000, grid_exported_from_battery_wh: 10000 });
  await owner.query("INSERT INTO data (date, is_vpp) VALUES ('2026-10-07', true)");

  const result = (await savings.trueUpSavings("2026-10-01", "2027-09-30"))!;
  const days = await savings.caseDays("2026-10-05", "2026-10-07");
  const { days: actual } = await grid.dailyGrid("2026-10-05", "2026-10-07");
  const priceAll = (map: Record<string, DayGrid>) => {
    const revisions = rates("2026-03-01", 0.39167);
    const pge = Math.max(priceDays("2026-10-05", "2026-10-07", map, revisions)!, minimumDelivery("2026-10-05", "2026-10-07", revisions));
    return Math.round((pge + generationCharges("2026-10-05", "2026-10-07", map)!.total) * 100) / 100;
  };

  expect(days["2026-10-07"].vpp).toBe(true);
  expect([result.used_days, result.held_days, result.vpp_days]).toEqual([1, 1, 1]);
  expect(result.efficiency).toBeCloseTo(5400 / 6000, 6);
  const heldAs = priceAll({ ...actual, "2026-10-06": days["2026-10-06"].solarOnly });
  const heldAndVppAs = priceAll({ ...actual, "2026-10-06": days["2026-10-06"].solarOnly, "2026-10-07": days["2026-10-07"].solarOnly });
  expect(result.powerwalls_vpp).toBe(Math.round((heldAndVppAs - heldAs) * 100) / 100);
  expect(result.powerwalls_used).toBe(Math.round((result.solar_only.total - heldAndVppAs) * 100) / 100);
  expect(Math.round((result.powerwalls_held + result.powerwalls_vpp + result.powerwalls_used) * 100) / 100).toBe(result.powerwalls_added);
  expect(result.peak_only!.total).toBe(priceAll({ ...actual, "2026-10-05": savings.peakOnlyDay(days["2026-10-05"], 5400 / 6000) }));
});

test("a day overlapping storm watch is a storm watch day, unless it is a VPP day", async () => {
  for (const day of ["2026-10-05", "2026-10-06", "2026-10-07"]) await putInterval(owner, `${day} 12:00`, { house_from_grid_wh: 100, grid_imported_wh: 100 });
  await owner.query("INSERT INTO site_state VALUES ('2026-10-04 08:00-07', '2026-10-05 20:00-07', 'on_grid', false), ('2026-10-05 20:00-07', '2026-10-06 06:00-07', 'on_grid', true), ('2026-10-06 06:00-07', NULL, 'on_grid', false)");
  await owner.query("INSERT INTO data (date, is_vpp) VALUES ('2026-10-06', true)");
  const days = await savings.caseDays("2026-10-05", "2026-10-07");
  expect([days["2026-10-05"].storm, days["2026-10-06"].storm, days["2026-10-07"].storm]).toEqual([true, true, false]);

  await storeRevision(owner, "2026-03-01");
  const result = (await savings.trueUpSavings("2026-10-01", "2027-09-30"))!;
  expect([result.vpp_days, result.storm_days]).toEqual([1, 1]);
});

test("storm watch days are their own part of what the Powerwalls added, kept as they were in peak-only", async () => {
  await usedAndHeld();
  // October 7: storm watch charges the batteries 9 kWh from the grid overnight, and they sit full through the evening.
  await putInterval(owner, "2026-10-07 02:00", { grid_imported_wh: 9000, battery_imported_from_grid_wh: 9000 });
  await putInterval(owner, "2026-10-07 18:00", { grid_imported_wh: 2000, house_from_grid_wh: 2000 });
  await owner.query("INSERT INTO site_state VALUES ('2026-10-07 01:00-07', '2026-10-07 23:00-07', 'on_grid', true)");

  const result = (await savings.trueUpSavings("2026-10-01", "2027-09-30"))!;
  const days = await savings.caseDays("2026-10-05", "2026-10-07");
  const { days: actual } = await grid.dailyGrid("2026-10-05", "2026-10-07");
  const priceAll = (map: Record<string, DayGrid>) => {
    const revisions = rates("2026-03-01", 0.39167);
    const pge = Math.max(priceDays("2026-10-05", "2026-10-07", map, revisions)!, minimumDelivery("2026-10-05", "2026-10-07", revisions));
    return Math.round((pge + generationCharges("2026-10-05", "2026-10-07", map)!.total) * 100) / 100;
  };

  expect([result.used_days, result.held_days, result.vpp_days, result.storm_days]).toEqual([1, 1, 0, 1]);
  const heldAs = priceAll({ ...actual, "2026-10-06": days["2026-10-06"].solarOnly });
  const heldAndStormAs = priceAll({ ...actual, "2026-10-06": days["2026-10-06"].solarOnly, "2026-10-07": days["2026-10-07"].solarOnly });
  expect(result.powerwalls_vpp).toBe(0);
  expect(result.powerwalls_storm).toBe(Math.round((heldAndStormAs - heldAs) * 100) / 100);
  expect(result.powerwalls_used).toBe(Math.round((result.solar_only.total - heldAndStormAs) * 100) / 100);
  expect(Math.round((result.powerwalls_held + result.powerwalls_vpp + result.powerwalls_storm + result.powerwalls_used) * 100) / 100).toBe(result.powerwalls_added);
  expect(result.peak_only!.total).toBe(priceAll({ ...actual, "2026-10-05": savings.peakOnlyDay(days["2026-10-05"], 5400 / 6000) }));
});

test("a year with only held days has no peak-only case", async () => {
  await storeRevision(owner, "2026-03-01");
  await putInterval(owner, "2026-10-06 12:00", { solar_generated_wh: 8000, house_from_solar_wh: 1000, battery_imported_from_solar_wh: 7000 });
  await putInterval(owner, "2026-10-06 18:00", { grid_imported_wh: 4000, house_from_grid_wh: 4000 });

  const result = (await savings.trueUpSavings("2026-10-01", "2027-09-30"))!;

  expect([result.used_days, result.held_days, result.peak_only]).toEqual([0, 1, null]);
  expect(result.powerwalls_held).toBe(result.powerwalls_added);
});

test.each([
  ["'23 - '24", "2023-10-01", "2024-09-30"],
  ["a calendar year", "2025-01-01", "2025-12-31"],
  ["All time", "2021-10-01", "2027-09-30"],
])("%s has no savings", async (_, start, end) => {
  await storeRevision(owner, "2023-09-01");
  await seedIntervals(owner, "2023-10-05", "2023-10-06", { grid_imported_wh: 10, house_from_grid_wh: 10 });

  expect(await savings.trueUpSavings(start, end)).toBeNull();
});

test("a year with no days yet has no savings", async () => {
  await storeRevision(owner, "2026-03-01");

  expect(await savings.trueUpSavings("2026-10-01", "2027-09-30")).toBeNull();
});
