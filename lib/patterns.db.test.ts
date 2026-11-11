// patterns() (patterns-page spec): the always-on load by month, the Powerwalls' energy by year and the house's use by month and hour, against a database of its own.
import type { Client } from "pg";
import { afterAll, beforeAll, beforeEach, expect, test, vi } from "vitest";

import { ownDatabase, putInterval } from "@/test/true-up";

let owner: Client;
let patterns: typeof import("./patterns").patterns;
const TODAY = "2026-11-10";

// `count` intervals from 1:00 AM site time on `date`, the house using `wh` in each but `lowest` at 3:00 AM.
async function night(date: string, lowest: number, { count = 48, wh = 100 } = {}) {
  await owner.query(
    `INSERT INTO energy_interval (start_at, day, solar_generated_wh, grid_imported_wh, grid_exported_from_solar_wh,
       grid_exported_from_battery_wh, battery_exported_wh, battery_imported_from_grid_wh, battery_imported_from_solar_wh,
       house_from_grid_wh, house_from_solar_wh, house_from_battery_wh)
     SELECT t, $1::date, 0, 0, 0, 0, 0, 0, 0,
       CASE WHEN t = ($1 || ' 03:00')::timestamp AT TIME ZONE 'America/Los_Angeles' THEN $2 - $2 / 2 ELSE $4 END,
       0,
       CASE WHEN t = ($1 || ' 03:00')::timestamp AT TIME ZONE 'America/Los_Angeles' THEN $2 / 2 ELSE 0 END
     FROM generate_series(($1 || ' 01:00')::timestamp AT TIME ZONE 'America/Los_Angeles', ($1 || ' 01:00')::timestamp AT TIME ZONE 'America/Los_Angeles' + ($3 - 1) * interval '5 minutes', interval '5 minutes') AS t`,
    [date, lowest, count, wh],
  );
}

beforeAll(async () => {
  owner = await ownDatabase("tsr_patterns");
  ({ patterns } = await import("./patterns"));
});

// Each test changes stored days the last one's kept months would otherwise still hold.
beforeEach(() => globalThis.patternsMonths?.clear());

afterAll(async () => {
  await owner.end();
  vi.unstubAllEnvs();
});

test("a month's always-on load is the lower middle of its counted nights' lowest 5 minutes, in watts", async () => {
  await night("2026-09-01", 25);
  await night("2026-09-02", 70);
  // A car charging from 2 AM doesn't move the night's lowest.
  await owner.query(
    `UPDATE energy_interval SET house_from_grid_wh = 800 WHERE day = '2026-09-02'
     AND start_at >= '2026-09-02 02:00'::timestamp AT TIME ZONE 'America/Los_Angeles' AND start_at < '2026-09-02 03:00'::timestamp AT TIME ZONE 'America/Los_Angeles'`,
  );
  await night("2026-09-03", 72);
  // Lower draws just outside 1 to 5 AM don't count.
  await putInterval(owner, "2026-09-03 00:55", { house_from_grid_wh: 1 });
  await putInterval(owner, "2026-09-03 05:00", { house_from_grid_wh: 1 });
  await night("2026-09-04", 75);
  // 40 intervals is enough; 36, as when the clocks go forward, isn't.
  await night("2026-10-01", 50, { count: 40 });
  await night("2026-08-05", 10, { count: 36 });

  expect((await patterns(TODAY)).months).toEqual([
    { month: "2026-09", watts: 840 },
    { month: "2026-10", watts: 600 },
  ]);
});

test("each calendar year gives the energy out of and into the Powerwalls, and its first day", async () => {
  await putInterval(owner, "2025-01-03 18:00", { battery_exported_wh: 3000, battery_imported_from_solar_wh: 3000, battery_imported_from_grid_wh: 662 });
  await putInterval(owner, "2025-12-31 23:55", { battery_exported_wh: 30 });
  await putInterval(owner, "2026-02-01 18:00", { battery_exported_wh: 4416 });

  expect((await patterns(TODAY)).years).toEqual([
    { year: 2025, out_wh: 3030, in_wh: 3662, first_day: "2025-01-03" },
    { year: 2026, out_wh: 4416, in_wh: 0, first_day: "2026-02-01" },
  ]);
});

test("each month's house use by site-time hour, from every source, over this month and the 23 before", async () => {
  await owner.query("DELETE FROM energy_interval");
  // Before the first of the month 23 months back, so left out.
  await putInterval(owner, "2024-11-30 23:00", { house_from_grid_wh: 500 });
  await putInterval(owner, "2024-12-01 00:10", { house_from_grid_wh: 50 });
  // 100 and 300 Wh in September's midnight hour average 200 Wh, 2,400 W, whatever the source.
  await putInterval(owner, "2026-09-01 00:00", { house_from_grid_wh: 100 });
  await putInterval(owner, "2026-09-02 00:55", { house_from_solar_wh: 300 });
  await putInterval(owner, "2026-09-01 13:00", { house_from_battery_wh: 150 });

  expect((await patterns(TODAY)).hours).toEqual([
    { month: "2024-12", hour: 0, watts: 600 },
    { month: "2026-09", hour: 0, watts: 2400 },
    { month: "2026-09", hour: 13, watts: 1800 },
  ]);
});

// November 10's split is November 1, the month holding yesterday: October is kept, November worked out each visit.
test("figures on both sides of the split come out as one history, the split year's energy added up", async () => {
  await owner.query("DELETE FROM energy_interval");
  await night("2026-10-30", 60);
  await night("2026-10-31", 70);
  await night("2026-11-02", 80);
  await putInterval(owner, "2026-02-01 18:00", { battery_exported_wh: 1000, battery_imported_from_solar_wh: 1200 });
  await putInterval(owner, "2026-10-15 18:00", { battery_exported_wh: 2000, battery_imported_from_grid_wh: 300 });
  await putInterval(owner, "2026-11-05 18:00", { battery_exported_wh: 500, battery_imported_from_solar_wh: 700, house_from_grid_wh: 50 });

  const { months, years, hours } = await patterns(TODAY);
  expect(months).toEqual([{ month: "2026-10", watts: 720 }, { month: "2026-11", watts: 960 }]);
  expect(years).toEqual([{ year: 2026, out_wh: 3500, in_wh: 2200, first_day: "2026-02-01" }]);
  expect(hours).toContainEqual({ month: "2026-11", hour: 18, watts: 600 });
  expect(hours.filter((h) => h.month === "2026-10").map((h) => h.hour)).toEqual([1, 2, 3, 4, 18]);
});

test("on the 1st, the month just ended is still worked out with its last day", async () => {
  await owner.query("DELETE FROM energy_interval");
  await night("2026-10-31", 70);
  await patterns("2026-11-01");
  // anton finishes October 31 after midnight: its lowest interval moves.
  await owner.query("UPDATE energy_interval SET house_from_grid_wh = 10, house_from_battery_wh = 0 WHERE day = '2026-10-31' AND house_from_battery_wh > 0");
  expect((await patterns("2026-11-01")).months).toEqual([{ month: "2026-10", watts: 120 }]);
});

test("finished months are kept, so a later change to one shows only once they're forgotten, while this month's always does", async () => {
  await owner.query("DELETE FROM energy_interval");
  await night("2026-10-30", 60);
  await night("2026-11-02", 80);
  await patterns(TODAY);
  await owner.query("UPDATE energy_interval SET house_from_battery_wh = 0, house_from_grid_wh = 5 WHERE house_from_battery_wh > 0");
  expect((await patterns(TODAY)).months).toEqual([{ month: "2026-10", watts: 720 }, { month: "2026-11", watts: 60 }]);
  globalThis.patternsMonths!.clear();
  expect((await patterns(TODAY)).months).toEqual([{ month: "2026-10", watts: 60 }, { month: "2026-11", watts: 60 }]);
});

test("a new month's split replaces the kept months rather than adding to them", async () => {
  await patterns(TODAY);
  await patterns("2026-12-10");
  expect([...globalThis.patternsMonths!.keys()]).toEqual(["2025-01-01..2026-12-01"]);
});

test("on the 1st the hour grid's window moves on though the split doesn't, so the kept months don't carry its oldest month", async () => {
  await owner.query("DELETE FROM energy_interval");
  await putInterval(owner, "2024-12-15 12:00", { house_from_grid_wh: 100 });
  await patterns("2026-11-30");
  expect((await patterns("2026-12-01")).hours.map((h) => h.month)).not.toContain("2024-12");
});

test("an empty table gives no months, no years and no hours", async () => {
  await owner.query("DELETE FROM energy_interval");
  expect(await patterns(TODAY)).toEqual({ months: [], years: [], hours: [] });
});
