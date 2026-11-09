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
  const [events, energy] = await Promise.all([
    db.query<EventRow>(`SELECT * FROM (${EVENTS}) e WHERE ${IN_RANGE} ORDER BY start_at DESC`, [start, end]),
    db.query<Record<"house" | "powerwalls" | "solar", string | null>>(
      `SELECT sum(f * (house_from_grid_wh + house_from_solar_wh + house_from_battery_wh)) AS house,
         sum(f * house_from_battery_wh) AS powerwalls, sum(f * house_from_solar_wh) AS solar
       FROM (SELECT * FROM (${EVENTS}) e WHERE kind = 'outage' AND ${IN_RANGE}) o
       -- Bounded on both sides by start_at, so the primary key reads only the intervals inside each outage.
       JOIN energy_interval i ON i.start_at > o.start_at - interval '5 minutes' AND i.start_at < o.end_at,
       LATERAL (SELECT extract(epoch FROM least(o.end_at, i.start_at + interval '5 minutes') - greatest(o.start_at, i.start_at)) / 300 AS f) w`,
      [start, end],
    ),
  ]);
  const outages = events.rows.filter((row) => row.kind === "outage").map((row) => ({
    start: row.start_at.toISOString(), seconds: (row.end_at.getTime() - row.start_at.getTime()) / 1000,
  }));
  const kwh = (wh: string | null) => Number(wh ?? 0) / 1000;
  const [{ house, powerwalls, solar }] = energy.rows;
  return {
    summary: {
      outages: outages.length,
      seconds: outages.reduce((total, { seconds }) => total + seconds, 0),
      // The newer of equal lengths, as Top Ten breaks ties.
      longest: outages.reduce<(typeof outages)[number] | null>((best, o) => (!best || o.seconds > best.seconds ? o : best), null),
      house_kwh: kwh(house), powerwalls_kwh: kwh(powerwalls), solar_kwh: kwh(solar),
    },
    events: events.rows.map(toEvent),
  };
}

export type BackupHistory = Awaited<ReturnType<typeof backupHistory>>;
