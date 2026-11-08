// Seeds the throwaway database the way anton-tesla-api-ws's true-up tests seed theirs.
import { Client } from "pg";
import { inject, vi } from "vitest";

// The true-up tests all need the same years of meter reads, so each test file gets a database of its own instead of
// clearing tables other files are reading. The app's modules are imported after this, so they connect to it.
export async function ownDatabase(name: string) {
  const pg = inject("pg");
  const admin = new Client({ ...pg });
  await admin.connect();
  await admin.query(`CREATE DATABASE ${name} TEMPLATE tsr_template`);
  await admin.end();
  vi.stubEnv("DATABASE_URL", `postgresql://${pg.user}:${pg.password}@/${name}?host=${pg.host}`);
  vi.resetModules();
  const owner = new Client({ ...pg, database: name });
  await owner.connect();
  return owner;
}

// Serial M in PG&E's published schedules.
const PUBLISHED: Record<number, string> = {
  2024: "1/6 2/6 3/7 4/8 5/7 6/6 7/8 8/6 9/5 10/4 11/4 12/5",
  2025: "1/6 2/4 3/6 4/4 5/5 6/4 7/7 8/5 9/4 10/3 11/4 12/5",
  2026: "1/6 2/5 3/9 4/7 5/6 6/5 7/6 8/4 9/3 10/5 11/3 12/4",
};

export const publishedReads = (year: number) =>
  PUBLISHED[year].split(" ").map((md) => {
    const [m, d] = md.split("/");
    return `${year}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  });

export async function storeReads(owner: Client, year: number, dates = publishedReads(year)) {
  await owner.query("INSERT INTO meter_read (read_date, year) SELECT unnest($1::date[]), $2", [dates, year]);
}

type Wh = Partial<Record<"grid_imported_wh" | "grid_exported_from_solar_wh" | "grid_exported_from_battery_wh", number>>;

const values = (wh: Wh) => [wh.grid_imported_wh ?? 0, wh.grid_exported_from_solar_wh ?? 0, wh.grid_exported_from_battery_wh ?? 0];

// Every 5-minute interval of the site days first to last.
export async function seedIntervals(owner: Client, first: string, last: string, wh: Wh) {
  await owner.query(
    `INSERT INTO energy_interval
     SELECT t, (t AT TIME ZONE 'America/Los_Angeles')::date, 0, $3, $4, $5, 0, 0, 0, 0, 0, 0
     FROM generate_series($1::timestamp AT TIME ZONE 'America/Los_Angeles',
       ($2::date + 1)::timestamp AT TIME ZONE 'America/Los_Angeles' - interval '5 minutes', interval '5 minutes') AS t`,
    [first, last, ...values(wh)],
  );
}

// One interval starting at a site wall time "2026-06-10 16:00".
export async function putInterval(owner: Client, at: string, wh: Wh) {
  await owner.query(
    `INSERT INTO energy_interval
     SELECT t, (t AT TIME ZONE 'America/Los_Angeles')::date, 0, $2, $3, $4, 0, 0, 0, 0, 0, 0
     FROM (SELECT $1::timestamp AT TIME ZONE 'America/Los_Angeles' AS t) AS s`,
    [at, ...values(wh)],
  );
}

// PG&E's readings for each day first to last, in kWh.
export async function storeMeterDays(owner: Client, first: string, last: string, kwh = { imported: 40, exported: 8, peakImported: 10, peakExported: 2 }) {
  await owner.query(
    `INSERT INTO meter_day SELECT d::date::text, $3, $4, $5, $6 FROM generate_series($1::date, $2::date, interval '1 day') AS d`,
    [first, last, kwh.imported * 1000, kwh.exported * 1000, kwh.peakImported * 1000, kwh.peakExported * 1000],
  );
}

// The E-TOU-C revision behind the 2026 true-up statement's line items: Advice Letter 7846-E, unchanged by the June 1,
// 2026 sheet.
export const MARCH_2026 = {
  summer_peak_total: 0.5224, summer_off_peak_total: 0.3994, winter_peak_total: 0.39757, winter_off_peak_total: 0.36757,
  summer_peak_generation: 0.20782, summer_off_peak_generation: 0.10482,
  winter_peak_generation: 0.1371, winter_off_peak_generation: 0.11042,
  baseline_credit: 0.0814, bundled_pcia: -0.01011, vintage_pcia: 0.03687, nbc: 0.0123,
  summer_baseline_kwh: 6.5, winter_baseline_kwh: 7.5, minimum_delivery_daily: 0,
};

export async function storeRevision(owner: Client, effective: string, rates: Partial<typeof MARCH_2026> = {}) {
  const row = { effective_date: effective, ...MARCH_2026, ...rates };
  const columns = Object.keys(row);
  await owner.query(`INSERT INTO rate_revision (${columns}) VALUES (${columns.map((_, i) => `$${i + 1}`)})`, Object.values(row));
}

// The figures typed from PG&E's 2026 true-up statement (anton's tests/fixtures/true-up-2026.csv): end read, net kWh at
// peak, off-peak and in all, NEM charges and minimum delivery.
const STATEMENT_2026: [string, number, number, number, number, number][] = [
  ["2025-11-04", 64, 300, 364, 113.41, 12.9], ["2025-12-05", 247, 302, 549, 172.92, 12.5],
  ["2026-01-06", 306, 819, 1125, 366.48, 12.91], ["2026-02-05", 206, 341, 547, 194.93, 12.1],
  ["2026-03-09", 107, 247, 353, 126.35, 9.68], ["2026-04-07", -29, 28, -2, 2.47, 0],
  ["2026-05-06", 16, 233, 249, 60.96, 0], ["2026-06-05", -104, -293, -397, -101.36, 0],
  ["2026-07-06", -109, -294, -402, -118.15, 0], ["2026-08-04", -114, -286, -401, -118.81, 0],
  ["2026-09-03", -112, 212, 100, 27.21, 0], ["2026-10-05", -59, 411, 352, 101.41, 0],
];

export async function storeStatement2026(owner: Client) {
  await owner.query("INSERT INTO true_up_statement VALUES (2026, 827.82, 60.09, 767.73)");
  for (const cycle of STATEMENT_2026) await owner.query("INSERT INTO true_up_statement_cycle VALUES ($1, 2026, $2, $3, $4, $5, $6)", cycle);
}
