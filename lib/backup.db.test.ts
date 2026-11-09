// Backup events and their kinds (backup-history spec), against a database of its own.
import type { Client } from "pg";
import { afterAll, beforeAll, beforeEach, expect, test, vi } from "vitest";

import { ownDatabase, putInterval } from "@/test/true-up";

let owner: Client;
let backup: typeof import("./backup");

// Times are site wall times, like "2024-02-04 14:51:38".
const site = (at: string) => `${at} America/Los_Angeles`;
const outage = (start: string, seconds: number) =>
  owner.query("INSERT INTO grid_outage VALUES ($1::timestamptz, $1::timestamptz + make_interval(secs => $2))", [site(start), seconds]);
const stretch = (start: string, end: string | null, island: string, storm = false) =>
  owner.query("INSERT INTO site_state VALUES ($1, $2, $3, $4)", [site(start), end && site(end), island, storm]);

beforeAll(async () => {
  owner = await ownDatabase("tsr_backup");
  backup = await import("./backup");
});

beforeEach(async () => {
  await owner.query("DELETE FROM grid_outage; DELETE FROM site_state; DELETE FROM energy_interval; DELETE FROM weather_sample");
});

afterAll(async () => {
  await owner.end();
  vi.unstubAllEnvs();
});

const ALL = { start: "2021-10-01", end: "2027-09-30" };
const allEvents = async () => (await backup.backupHistory(ALL)).events;
const kinds = async () => (await allEvents()).map(({ kind }) => kind);

test("an event on or before PTO day, October 22, 2021, is commissioning, however long; the next day's is not", async () => {
  await outage("2021-10-12 06:25:52", 52.35 * 3600);
  await outage("2021-10-22 23:59:00", 11.3 * 3600);
  await outage("2021-10-23 00:00:30", 3600);
  expect(await kinds()).toEqual(["outage", "commissioning", "commissioning"]);
});

test("an event over an off_grid_intentional stretch is a test", async () => {
  await outage("2026-11-09 08:36:41", 64.216);
  await stretch("2026-11-09 08:36:41", "2026-11-09 08:37:45.216", "off_grid_intentional");
  expect(await kinds()).toEqual(["test"]);
});

test("a stretch still open counts as reaching now", async () => {
  await outage("2026-11-09 08:36:41", 30);
  await stretch("2026-11-09 08:36:00", null, "off_grid_intentional");
  expect(await kinds()).toEqual(["test"]);
});

test("a stretch that only touches the event's end doesn't make it a test", async () => {
  await outage("2026-11-09 08:00:00", 600);
  await stretch("2026-11-09 08:10:00", null, "off_grid_intentional");
  expect(await kinds()).toEqual(["outage"]);
});

test("under a minute after PTO is a blip, a minute or more is an outage", async () => {
  await outage("2025-02-17 21:03:00", 59.9);
  await outage("2025-02-17 21:12:00", 60);
  expect(await kinds()).toEqual(["outage", "blip"]);
});

test("a short test is a test, not a blip; a commissioning test is commissioning", async () => {
  await outage("2026-11-09 08:36:41", 20);
  await stretch("2026-11-09 08:36:30", "2026-11-09 08:37:30", "off_grid_intentional");
  await outage("2021-10-15 10:00:00", 20);
  await stretch("2021-10-15 09:59:00", "2021-10-15 10:01:00", "off_grid_intentional");
  expect(await kinds()).toEqual(["test", "commissioning"]);
});

test("an event with no stretch over it, from before site state was kept, is an outage", async () => {
  await outage("2024-02-04 14:51:38", 52.27 * 3600);
  await stretch("2026-11-09 09:15:21", null, "on_grid");
  expect(await allEvents()).toMatchObject([
    { start: "2024-02-04T22:51:38.000Z", end: new Date(Date.parse("2024-02-04T22:51:38Z") + 52.27 * 3600_000).toISOString(), kind: "outage" },
  ]);
});

test("events come newest first", async () => {
  await outage("2024-02-04 14:51:38", 3600);
  await outage("2026-03-22 19:40:41", 3581.758);
  await outage("2024-12-14 05:55:41", 3600);
  expect((await allEvents()).map(({ start }) => start.slice(0, 10))).toEqual(["2026-03-23", "2024-12-14", "2024-02-04"]);
});

const YEAR_23_24 = { start: "2023-10-01", end: "2024-09-30" };

test("a year's summary counts its outages only: their number, time, longest and its start", async () => {
  await outage("2024-02-04 14:51:38", 188_172);
  await outage("2023-12-01 09:00:00", 3600);
  await outage("2023-12-01 12:00:00", 20);
  await outage("2024-03-01 10:00:00", 600);
  await stretch("2024-03-01 09:59:00", "2024-03-01 10:20:00", "off_grid_intentional");
  const { summary, events } = await backup.backupHistory(YEAR_23_24);
  expect(summary).toMatchObject({ outages: 2, seconds: 188_172 + 3600, longest: { start: "2024-02-04T22:51:38.000Z", seconds: 188_172 } });
  expect(events.map(({ kind }) => kind)).toEqual(["test", "outage", "blip", "outage"]);
});

test("an event belongs to the true-up year it began in, in the site's time", async () => {
  await outage("2024-09-30 23:30:00", 3600);
  await outage("2024-10-01 00:30:00", 3600);
  expect((await backup.backupHistory(YEAR_23_24)).events.map(({ start }) => start)).toEqual(["2024-10-01T06:30:00.000Z"]);
  expect((await backup.backupHistory(ALL)).events).toHaveLength(2);
});

test("the house's energy during outages counts each interval by its part inside one, from the Powerwalls and from solar", async () => {
  await outage("2024-02-04 14:52:30", 150);
  await putInterval(owner, "2024-02-04 14:50", { house_from_battery_wh: 100, house_from_solar_wh: 20 });
  await putInterval(owner, "2024-02-04 14:55", { house_from_battery_wh: 500 });
  // A blip's energy isn't an outage's.
  await outage("2024-02-05 10:00:00", 30);
  await putInterval(owner, "2024-02-05 10:00", { house_from_battery_wh: 400 });
  const { summary } = await backup.backupHistory(YEAR_23_24);
  expect(summary).toMatchObject({ house_kwh: 0.06, powerwalls_kwh: 0.05, solar_kwh: 0.01 });
});

test("a year without events has no outages, no longest and an empty list", async () => {
  expect(await backup.backupHistory(YEAR_23_24)).toEqual({
    summary: { outages: 0, seconds: 0, longest: null, house_kwh: 0, powerwalls_kwh: 0, solar_kwh: 0, closest: null, blips: [{ label: "'23 - '24", count: 0 }] },
    events: [],
  });
});

// Five-minute intervals from a site wall time, each with the same flows, as test/true-up's putInterval stores one.
// Wall-clock arithmetic, as no test crosses a daylight saving change.
async function intervals(from: string, count: number, wh: Parameters<typeof putInterval>[2]) {
  const start = Date.parse(`${from.replace(" ", "T")}:00Z`);
  for (let i = 0; i < count; i++) await putInterval(owner, new Date(start + i * 300_000).toISOString().slice(0, 16).replace("T", " "), wh);
}
const weather = (at: string, code: number, wind: number) =>
  owner.query("INSERT INTO weather_sample (sampled_at, weather_code, cloud_cover, wind_speed) VALUES ($1, $2, 100, $3)", [site(at), code, wind]);

test("an outage that started full carries its rebuilt battery figures and weather, and is the year's closest call", async () => {
  await intervals("2024-02-04 14:40", 2, { grid_exported_from_solar_wh: 300 });
  await intervals("2024-02-04 14:50", 24, { battery_exported_wh: 500, house_from_battery_wh: 500 });
  await outage("2024-02-04 14:50:00", 2 * 3600);
  await weather("2024-02-04 13:00:00", 65, 45);
  await weather("2024-02-04 15:00:00", 61, 30);
  await weather("2024-02-04 16:00:00", 95, 60);
  const { summary, events } = await backup.backupHistory(YEAR_23_24);
  expect(events[0].battery).toMatchObject({ drop_kwh: 12, full: true, complete: true, refilled: false });
  expect(events[0].battery!.low_percent).toBeCloseTo(100 - 12 / 0.36, 6);
  expect(events[0].weather).toBe("Heavy rain, high wind");
  expect(summary.closest).toEqual({ percent: events[0].battery!.low_percent, at: events[0].battery!.low_at });
});

test("an outage with no full signal before it gives its drop only; one with gaps is incomplete", async () => {
  await intervals("2024-03-01 10:00", 12, { battery_exported_wh: 100 });
  await outage("2024-03-01 10:00:00", 3600);
  await intervals("2024-04-01 09:50", 2, { grid_exported_from_solar_wh: 300 });
  await intervals("2024-04-01 10:00", 6, { battery_exported_wh: 100 });
  await outage("2024-04-01 10:00:00", 3600);
  const { summary, events } = await backup.backupHistory(YEAR_23_24);
  expect(events.map((e) => [e.battery!.full, e.battery!.complete, e.battery!.low_percent])).toEqual([[true, false, null], [false, true, null]]);
  expect(events[1].battery!.drop_kwh).toBeCloseTo(1.2, 6);
  expect(events.map((e) => e.weather)).toEqual([null, null]);
  expect(summary.closest).toBeNull();
});

test("only outages carry battery figures and weather, and the summary counts blips per true-up year", async () => {
  await outage("2023-12-01 12:00:00", 20);
  await outage("2024-03-01 10:00:00", 600);
  await stretch("2024-03-01 09:59:00", "2024-03-01 10:20:00", "off_grid_intentional");
  const { summary, events } = await backup.backupHistory(YEAR_23_24);
  expect(events.map((e) => [e.kind, e.battery, e.weather])).toEqual([["test", null, null], ["blip", null, null]]);
  expect(summary.blips).toEqual([{ label: "'23 - '24", count: 1 }]);
});
