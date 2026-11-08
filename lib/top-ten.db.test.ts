// Ported from anton-tesla-api-ws tests/test_reports_top_ten.py and test_meter_corrections.py's top-ten test, with the
// tie rule and NULL handling of the top-ten spec, against a database of its own.
import type { Client } from "pg";
import { afterAll, beforeAll, beforeEach, expect, test, vi } from "vitest";

import { ownDatabase } from "@/test/true-up";

let owner: Client;
let topTen: typeof import("./top-ten").topTen;

type Day = Partial<{ solar_generated: number | null; from_grid: number | null; to_grid: number; powerwall_to_grid: number; is_vpp: boolean }>;

// anton's energy(): 20.9 kWh of solar, 10.1 in, 0.7 out.
const PLAIN = { solar_generated: 20.9, from_grid: 10.1, to_grid: 0.7, powerwall_to_grid: 0, is_vpp: false };

async function seed(day: string, overrides: Day = {}) {
  const v = { ...PLAIN, ...overrides };
  await owner.query(
    "INSERT INTO data (date, solar_generated, from_grid, to_grid, powerwall_to_grid, is_vpp) VALUES ($1, $2, $3, $4, $5, $6)",
    [day, v.solar_generated, v.from_grid, v.to_grid, v.powerwall_to_grid, v.is_vpp],
  );
}

const storeMeter = (day: string, importedKwh: number, exportedKwh: number) =>
  owner.query("INSERT INTO meter_day VALUES ($1, $2, $3, 0, 0)", [day, importedKwh * 1000, exportedKwh * 1000]);

async function rankings() {
  const [{ solar }, { net_grid }, { to_grid_months }] = await topTen();
  return { solar, days: net_grid, months: to_grid_months };
}

beforeAll(async () => {
  owner = await ownDatabase("tsr_top_ten");
  ({ topTen } = await import("./top-ten"));
});

beforeEach(async () => {
  await owner.query("DELETE FROM data; DELETE FROM meter_day");
});

afterAll(async () => {
  await owner.end();
  vi.unstubAllEnvs();
});

test("an empty database gives three empty rankings", async () => {
  expect(await topTen()).toEqual([{ solar: [] }, { net_grid: [] }, { to_grid_months: [] }]);
});

test("solar days by the stored figure, ten of them, with Flask's labels and each row's day", async () => {
  for (let d = 1; d <= 12; d++) await seed(`2026-01-${String(d).padStart(2, "0")}`, { solar_generated: d + 0.25 });
  const { solar } = await rankings();
  expect(solar.map((s) => s.solar)).toEqual([12.25, 11.25, 10.25, 9.25, 8.25, 7.25, 6.25, 5.25, 4.25, 3.25]);
  expect(solar[0]).toEqual({ date: "Jan 12, 2026", solar: 12.25, day: "2026-01-12" });
});

test("days without a solar figure are left out", async () => {
  await seed("2022-06-13", { solar_generated: 80.9 });
  await seed("2022-06-14", { solar_generated: null });
  expect((await rankings()).solar.map((s) => s.day)).toEqual(["2022-06-13"]);
});

test("export days by net grid, negative, most exported first", async () => {
  await seed("2024-05-30", { from_grid: 1.0, to_grid: 61.0 });
  await seed("2024-05-31", { from_grid: 1.0, to_grid: 31.0 });
  await seed("2024-06-01", { from_grid: 10.0, to_grid: 1.0 });
  const { days } = await rankings();
  expect(days).toEqual([
    { date: "May 30, 2024", net_grid: -60.0, day: "2024-05-30" },
    { date: "May 31, 2024", net_grid: -30.0, day: "2024-05-31" },
    { date: "Jun 1, 2024", net_grid: 9.0, day: "2024-06-01" },
  ]);
});

test("a day before April 27, 2026 with PG&E's readings ranks by them; a day from the fix keeps Tesla's", async () => {
  await seed("2026-04-20", { from_grid: 0, to_grid: 10 });
  await storeMeter("2026-04-20", 2, 40);
  await seed("2026-05-10", { from_grid: 0, to_grid: 20 });
  await storeMeter("2026-05-10", 0, 99);
  const { days, months } = await rankings();
  expect(days.map((d) => [d.day, d.net_grid])).toEqual([["2026-04-20", -38.0], ["2026-05-10", -20.0]]);
  expect(months.map((m) => [m.date, m.net_grid])).toEqual([["Apr 2026", -38.0], ["May 2026", -20.0]]);
});

test("a VPP day leaves out the Powerwall's exports; other days count them", async () => {
  await seed("2026-07-01", { from_grid: 0, to_grid: 3, powerwall_to_grid: 20, is_vpp: true });
  await seed("2026-07-02", { from_grid: 0, to_grid: 3, powerwall_to_grid: 2 });
  expect((await rankings()).days.map((d) => [d.day, d.net_grid])).toEqual([["2026-07-02", -5], ["2026-07-01", -3]]);
});

test("a day with no imports recorded counts them as 0", async () => {
  await seed("2026-07-01", { from_grid: null, to_grid: 12.3 });
  expect((await rankings()).days).toEqual([{ date: "Jul 1, 2026", net_grid: -12.3, day: "2026-07-01" }]);
});

test("export months are summed over their days, with Flask's labels and each row's month", async () => {
  await seed("2024-05-01", { from_grid: 1, to_grid: 30 });
  await seed("2024-05-02", { from_grid: 1, to_grid: 30 });
  await seed("2024-06-01", { from_grid: 1, to_grid: 40 });
  expect((await rankings()).months).toEqual([
    { date: "May 2024", net_grid: -58.0, month: "2024-05" },
    { date: "Jun 2024", net_grid: -39.0, month: "2024-06" },
  ]);
});

test("figures that read the same to a tenth rank the newer date first", async () => {
  await seed("2022-05-20", { solar_generated: 78.61 });
  await seed("2024-06-16", { solar_generated: 78.58 });
  await seed("2022-06-13", { solar_generated: 80.9 });
  expect((await rankings()).solar.map((s) => s.day)).toEqual(["2022-06-13", "2024-06-16", "2022-05-20"]);
});

test("a tie for 10th place is won by the newer 11th day", async () => {
  for (let d = 1; d <= 9; d++) await seed(`2023-06-0${d}`, { from_grid: 0, to_grid: 50 + d });
  // Flask's ORDER BY puts the older day 10th: it exported a little more, but both read 42.1.
  await seed("2023-07-01", { from_grid: 0, to_grid: 42.14 });
  await seed("2026-07-01", { from_grid: 0, to_grid: 42.06 });
  const { days } = await rankings();
  expect(days).toHaveLength(10);
  expect(days.at(-1)).toEqual({ date: "Jul 1, 2026", net_grid: -42.1, day: "2026-07-01" });
});

test("a tie at 10th place among months is won by the newer month", async () => {
  for (let m = 1; m <= 9; m++) await seed(`2023-0${m}-01`, { from_grid: 0, to_grid: 500 + m });
  await seed("2023-10-01", { from_grid: 0, to_grid: 400.14 });
  await seed("2024-10-01", { from_grid: 0, to_grid: 400.06 });
  const { months } = await rankings();
  expect(months).toHaveLength(10);
  expect(months.at(-1)!.month).toBe("2024-10");
});

test("fewer than ten days rank those there are", async () => {
  await seed("2026-01-01", { solar_generated: 5 });
  await seed("2026-01-02", { solar_generated: 6 });
  const { solar, days, months } = await rankings();
  expect([solar.length, days.length, months.length]).toEqual([2, 2, 1]);
});
