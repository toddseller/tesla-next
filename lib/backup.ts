import { type BatteryInterval, blipsPerYear, type OutageBattery, outageBattery, weatherLabel } from "@/lib/backup-figures";
import { db } from "@/lib/db";

export type BackupKind = "commissioning" | "test" | "blip" | "outage";
export type BackupEvent = { start: string; end: string; kind: BackupKind };

// Tesla's backup events with their kind, checked in order: on or before the day of the site's permission to operate, a
// Go Off-Grid test (over an off_grid_intentional stretch the worker recorded, an open one reaching now), under a minute,
// else an outage. One query, so every page and the savings math agree on what counts.
export const EVENTS = `SELECT o.start_at, o.end_at, CASE
    WHEN o.start_at < timestamp '2021-10-23' AT TIME ZONE 'America/Los_Angeles' THEN 'commissioning'
    WHEN EXISTS (SELECT 1 FROM site_state s WHERE s.island_status = 'off_grid_intentional'
      AND s.start_at < o.end_at AND coalesce(s.end_at, now()) > o.start_at) THEN 'test'
    WHEN o.end_at - o.start_at < interval '1 minute' THEN 'blip'
    ELSE 'outage' END AS kind
  FROM grid_outage o`;

type Range = { start: string; end: string };
type EventRow = { start_at: Date; end_at: Date; kind: BackupKind };
const toEvent = (row: EventRow): BackupEvent => ({ start: row.start_at.toISOString(), end: row.end_at.toISOString(), kind: row.kind });

// An event belongs to the days its start falls in, in the site's time.
const IN_RANGE = "timezone('America/Los_Angeles', start_at)::date BETWEEN $1 AND $2";

// The events that began in the range, newest first, and a summary of its outages: their number, time and longest, and
// the house's energy through them, each 5-minute interval counted by its part inside an outage.
export async function backupHistory({ start, end }: Range) {
  const outagesIn = `SELECT * FROM (${EVENTS}) e WHERE kind = 'outage' AND ${IN_RANGE}`;
  const [events, energy, flows, samples] = await Promise.all([
    db.query<EventRow>(`SELECT * FROM (${EVENTS}) e WHERE ${IN_RANGE} ORDER BY start_at DESC`, [start, end]),
    db.query<Record<"house" | "powerwalls" | "solar", string | null>>(
      `SELECT sum(f * (house_from_grid_wh + house_from_solar_wh + house_from_battery_wh)) AS house,
         sum(f * house_from_battery_wh) AS powerwalls, sum(f * house_from_solar_wh) AS solar
       FROM (${outagesIn}) o
       -- Bounded on both sides by start_at, so the primary key reads only the intervals inside each outage.
       JOIN energy_interval i ON i.start_at > o.start_at - interval '5 minutes' AND i.start_at < o.end_at,
       LATERAL (SELECT extract(epoch FROM least(o.end_at, i.start_at + interval '5 minutes') - greatest(o.start_at, i.start_at)) / 300 AS f) w`,
      [start, end],
    ),
    // Each outage's intervals from 12 hours before it, where the batteries' full signal is looked for, to its end.
    db.query<{ outage: Date; start_at: Date } & Record<"out" | "in" | "solar_exported" | "house", number>>(
      `SELECT o.start_at AS outage, i.start_at, battery_exported_wh AS out,
         battery_imported_from_solar_wh + battery_imported_from_grid_wh AS in, grid_exported_from_solar_wh AS solar_exported,
         house_from_grid_wh + house_from_solar_wh + house_from_battery_wh AS house
       FROM (${outagesIn}) o
       JOIN energy_interval i ON i.start_at >= o.start_at - interval '12 hours' AND i.start_at < o.end_at
       ORDER BY o.start_at, i.start_at`,
      [start, end],
    ),
    db.query<{ outage: Date; code: number; wind: number | null }>(
      `SELECT o.start_at AS outage, w.weather_code AS code, w.wind_speed AS wind
       FROM (${outagesIn}) o
       JOIN weather_sample w ON w.sampled_at BETWEEN o.start_at - interval '3 hours' AND o.start_at + interval '1 hour'`,
      [start, end],
    ),
  ]);
  const byOutage = <R extends { outage: Date }>(rows: R[]) =>
    Map.groupBy(rows, (row) => row.outage.getTime());
  const intervals = byOutage(flows.rows);
  const weather = byOutage(samples.rows);
  const listed = events.rows.map((row) => {
    const isOutage = row.kind === "outage";
    const own: BatteryInterval[] = (intervals.get(row.start_at.getTime()) ?? []).map((i) => ({
      start: i.start_at.getTime(), out: i.out, in: i.in, solarExported: i.solar_exported, house: i.house,
    }));
    return {
      ...toEvent(row),
      battery: isOutage ? outageBattery(own, { start: row.start_at.getTime(), end: row.end_at.getTime() }) : null,
      weather: isOutage ? weatherLabel(weather.get(row.start_at.getTime()) ?? []) : null,
    };
  });
  const outages = events.rows.filter((row) => row.kind === "outage").map((row) => ({
    start: row.start_at.toISOString(), seconds: (row.end_at.getTime() - row.start_at.getTime()) / 1000,
  }));
  const closest = listed.reduce<OutageBattery | null>((low, e) =>
    e.battery?.low_percent != null && (low === null || e.battery.low_percent < low.low_percent!) ? e.battery : low, null);
  const kwh = (wh: string | null) => Number(wh ?? 0) / 1000;
  const [{ house, powerwalls, solar }] = energy.rows;
  return {
    summary: {
      outages: outages.length,
      seconds: outages.reduce((total, { seconds }) => total + seconds, 0),
      // The newer of equal lengths, as Top Ten breaks ties.
      longest: outages.reduce<(typeof outages)[number] | null>((best, o) => (!best || o.seconds > best.seconds ? o : best), null),
      house_kwh: kwh(house), powerwalls_kwh: kwh(powerwalls), solar_kwh: kwh(solar),
      closest: closest && { percent: closest.low_percent!, at: closest.low_at },
      blips: blipsPerYear(listed, { start, end }),
    },
    events: listed,
  };
}

export type BackupHistory = Awaited<ReturnType<typeof backupHistory>>;
