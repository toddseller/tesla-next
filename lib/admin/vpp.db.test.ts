import type { Client } from "pg";
import { afterAll, beforeAll, beforeEach, expect, test, vi } from "vitest";
import { ownDatabase } from "@/test/true-up";

let owner: Client;
let vpp: typeof import("./vpp");
let writer: typeof import("./writer");

beforeAll(async () => {
  owner = await ownDatabase("admin_vpp");
  vpp = await import("./vpp");
  writer = await import("./writer");
});

const TODAY = "2026-11-14";

beforeEach(async () => {
  await owner.query("DELETE FROM data; DELETE FROM vpp_payout");
  for (const [date, kwh, isVpp] of [
    ["2025-08-01", 15.2, true], ["2026-04-30", 3, false], ["2026-08-12", 21.4, true], ["2026-09-03", 18.9, true], ["2026-09-18", 12.6, false],
  ] as const) {
    await owner.query("INSERT INTO data (date, powerwall_to_grid, is_vpp) VALUES ($1, $2, $3)", [date, kwh, isVpp]);
  }
});

afterAll(async () => {
  await writer.writer.end();
  await (await import("@/lib/db")).db.end();
  await owner.end();
  vi.unstubAllEnvs();
});

const marked = async () => (await owner.query("SELECT date FROM data WHERE is_vpp ORDER BY date")).rows.map((row) => row.date);
const saved = (work: (client: import("pg").PoolClient) => Promise<unknown>) => writer.save(work);

test.each([["2026-11-14", 2026], ["2027-03-02", 2026], ["2027-04-30", 2026], ["2027-05-01", 2027]])("on %s the season is %i's", (today, season) => {
  expect(vpp.currentSeason(today)).toBe(season);
});

test("a season's marked days, oldest first, with the Powerwalls' export", async () => {
  expect(await vpp.vppDays(2026)).toEqual([{ date: "2026-08-12", kwh: 21.4 }, { date: "2026-09-03", kwh: 18.9 }]);
  expect(await vpp.vppDays(2024)).toEqual([]);
});

test("marking a day of the season makes it a VPP day", async () => {
  await saved((client) => vpp.mark(client, "2026-09-18", TODAY));
  expect(await marked()).toEqual(["2025-08-01", "2026-08-12", "2026-09-03", "2026-09-18"]);
});

test.each([
  ["2026-11-15", "November 15, 2026 has no data yet"],
  ["2026-10-02", "October 2, 2026 has no data yet"],
  ["2026-04-30", "April 30, 2026 isn't in the 2026 season, May 1 to October 31"],
  ["2025-09-18", "September 18, 2025 isn't in the 2026 season, May 1 to October 31"],
  ["18/09/2026", "pick a day"],
])("marking %s is refused", async (day, reason) => {
  await expect(saved((client) => vpp.mark(client, day, TODAY))).rejects.toThrow(reason);
  expect(await marked()).toEqual(["2025-08-01", "2026-08-12", "2026-09-03"]);
});

test("a day after today is refused even with a row for it", async () => {
  await owner.query("INSERT INTO data (date, powerwall_to_grid) VALUES ('2027-06-01', 0)");
  await expect(saved((client) => vpp.mark(client, "2027-06-01", "2027-05-20"))).rejects.toThrow("June 1, 2027 has no data yet");
});

test("unmarking clears the day", async () => {
  await saved((client) => vpp.unmark(client, "2026-09-03"));
  expect(await marked()).toEqual(["2025-08-01", "2026-08-12"]);
});

// --- Payouts, with anton-tesla-api-ws's record_vpp_payout's checks ------------------------

const payouts = async () => (await owner.query("SELECT season, amount, paid_on::text AS paid_on FROM vpp_payout ORDER BY season")).rows;
const record = (season: string, amount: string, paidOn: string) => saved((client) => vpp.recordPayout(client, season, amount, paidOn, TODAY));

test("seasons' payouts are recorded with their dates, and the latest is shown", async () => {
  expect(await vpp.latestPayout()).toBeNull();
  await record("2024", "512.40", "2025-04-14");
  await record("2025", "728.26", "2026-04-15");
  expect(await payouts()).toEqual([
    { season: 2024, amount: 512.4, paid_on: "2025-04-14" }, { season: 2025, amount: 728.26, paid_on: "2026-04-15" },
  ]);
  expect(await vpp.latestPayout()).toEqual({ season: 2025, amount: 728.26, paid_on: "2026-04-15" });
});

test("recording a season again replaces it", async () => {
  await record("2025", "728.26", "2026-04-15");
  await record("2025", "730.00", "2026-04-15");
  expect(await payouts()).toEqual([{ season: 2025, amount: 730, paid_on: "2026-04-15" }]);
});

test.each([
  ["2025", "0", "2026-04-15", "the amount must be positive"],
  ["2025", "-12.50", "2026-04-15", "the amount must be positive"],
  ["2025", "seven", "2026-04-15", "the amount must be positive"],
  ["2025", "1e999", "2026-04-15", "the amount must be positive"],
  ["2025", "728.26", "", "pick the date it was paid"],
  ["2025", "728.26", "2026-02-30", "pick the date it was paid"],
  ["2026", "512.40", "2026-09-01", "the 2026 season hadn't ended by September 1, 2026"],
  ["2025", "728.26", "2025-10-31", "the 2025 season hadn't ended by October 31, 2025"],
  ["2023", "100", "2024-04-15", "pick a season from 2024 to 2026"],
  ["2027", "100", "2028-04-15", "pick a season from 2024 to 2026"],
])("season %s, $%s paid %s is refused", async (season, amount, paidOn, reason) => {
  await expect(record(season, amount, paidOn)).rejects.toThrow(reason);
  expect(await payouts()).toEqual([]);
});
