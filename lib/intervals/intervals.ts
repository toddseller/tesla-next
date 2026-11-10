// Ported from anton-tesla-api-ws resources/intervals.py: a day's 5 minute records, totals and weather, for the
// Distribution page's replay. It answered exactly as anton's /api/v2/intervals did until that was retired, and keeps
// that code's order of work, including summing the day's intervals in the order the database returns them.
import { db } from "@/lib/db";
import { expectedHours } from "@/lib/forecast";
import { fill, placeSessions, SESSION_HORIZON, STEP } from "./gap-estimates";
import { shiftDay } from "@/lib/scene/replay";
import { localIso, localMidnight, pyRound } from "./python";
import { type BackupKind, EVENTS } from "@/lib/backup";
import { quarterKw, reference, share, slot } from "./sunshine";
import { type Car, carName, loadCars, sessionVin } from "./vehicles";
import { rainFrom, skyFrom, windAcross, windsAloft } from "./weather";

const MINUTE = 60_000;
// Neighbors up to this far outside the day can bound a gap that crosses midnight.
const ESTIMATE_MARGIN = (2 * 60 + 5) * MINUTE;
// Weather readings past the day's edges, so the replay can blend into its first and last hour.
const WEATHER_MARGIN = 60 * MINUTE;
const WH_TO_KW = 12 / 1000;

const FLOWS = {
  solar_to_home: "house_from_solar_wh",
  solar_to_powerwall: "battery_imported_from_solar_wh",
  solar_to_grid: "grid_exported_from_solar_wh",
  powerwall_to_home: "house_from_battery_wh",
  powerwall_to_grid: "grid_exported_from_battery_wh",
  grid_to_home: "house_from_grid_wh",
  grid_to_powerwall: "battery_imported_from_grid_wh",
} as const;

// Tesla's home flows include car charging; measured charging moves out of each home flow into the matching vehicle flow.
const HOME_TO_VEHICLE = { solar_to_home: "solar_to_vehicle", powerwall_to_home: "powerwall_to_vehicle", grid_to_home: "grid_to_vehicle" } as const;

const ALL_FLOWS = [...Object.keys(FLOWS), ...Object.values(HOME_TO_VEHICLE)];

type EnergyRow = { start_at: Date; solar_generated_wh: number } & Record<(typeof FLOWS)[keyof typeof FLOWS], number>;
type Row = Record<string, number | string | boolean | null>;

export function intervalWh(interval: EnergyRow, vehicleWh?: number) {
  const wh: Record<string, number> = {};
  for (const [flow, column] of Object.entries(FLOWS)) wh[flow] = interval[column];
  for (const vehicleFlow of Object.values(HOME_TO_VEHICLE)) wh[vehicleFlow] = 0;
  const home = Object.keys(HOME_TO_VEHICLE).reduce((sum, flow) => sum + wh[flow], 0);
  if (vehicleWh && home > 0) {
    const part = Math.min(vehicleWh, home) / home;
    for (const [homeFlow, vehicleFlow] of Object.entries(HOME_TO_VEHICLE)) {
      const moved = wh[homeFlow] * part;
      wh[vehicleFlow] = moved;
      wh[homeFlow] -= moved;
    }
  }
  return wh;
}

// Through the end of the latest session's stretch, where its energy may still be placed.
async function sessionCoverage(): Promise<[number, number] | null> {
  const { rows } = await db.query<{ start_at: Date; duration_s: number }>(
    "(SELECT start_at, duration_s FROM charge_session ORDER BY start_at LIMIT 1) UNION ALL (SELECT start_at, duration_s FROM charge_session ORDER BY start_at DESC LIMIT 1)",
  );
  if (rows.length === 0) return null;
  const [first, last] = rows;
  return [first.start_at.getTime(), last.start_at.getTime() + Math.max(last.duration_s * 1000, SESSION_HORIZON)];
}

async function homeExcess(days: string[]) {
  const excess = new Map<number, number>();
  for (const day of days) {
    const { rows } = await db.query<{ start_at: Date; home: number }>(
      "SELECT start_at, house_from_grid_wh + house_from_solar_wh + house_from_battery_wh AS home FROM energy_interval WHERE day = $1",
      [day],
    );
    if (rows.length === 0) continue;
    const twentyFifthPercentile = rows.map((row) => row.home).sort((a, b) => a - b)[Math.floor(rows.length / 4)];
    for (const row of rows) excess.set(row.start_at.getTime(), row.home - twentyFifthPercentile);
  }
  return excess;
}

async function sessionEstimates(day: string, stretchStart: number, start: number, end: number, known: Map<number, number>, knownVins: Map<number, string | null>, cars: Car[]) {
  const coverage = await sessionCoverage();
  const estimates = new Map<number, number>();
  if (coverage === null) return { estimates, cars: new Map<number, string | null>() };
  // shortcut: sessions from two days before are left out, so a stretch on this day can be chosen differently from the
  // day before's when one of those sessions took load first; the totals then differ by that overlap only.
  const { rows } = await db.query<{ start_at: Date; duration_s: number; energy_wh: number }>(
    "SELECT start_at, duration_s, energy_wh FROM charge_session WHERE start_at >= $1 AND start_at < $2 ORDER BY start_at",
    // Through the next day, whose first session ends this day's last one's stretch.
    [new Date(stretchStart), new Date(localMidnight(shiftDay(day, 2)))],
  );
  const [placed, placedCars] = placeSessions(
    rows.map((s) => [s.start_at.getTime(), s.duration_s, s.energy_wh, sessionVin(cars, s.energy_wh, s.duration_s)]),
    await homeExcess([shiftDay(day, -1), day, shiftDay(day, 1)]),
    known,
    knownVins,
  );
  for (let instant = start; instant < end; instant += STEP) {
    if (instant + STEP > coverage[0] && instant < coverage[1] && !known.has(instant)) estimates.set(instant, placed.get(instant) ?? 0);
  }
  return { estimates, cars: new Map([...placedCars].filter(([t]) => estimates.has(t))) };
}

// A gap names a car only when the same one is plugged in on both sides of it.
function gapVins(vins: Map<number, string | null>, estimated: Map<number, number>) {
  const named = new Map<number, string>();
  const times = [...vins.keys()].sort((a, b) => a - b);
  for (let i = 0; i + 1 < times.length; i++) {
    const vin = vins.get(times[i]);
    if (!vin || vin !== vins.get(times[i + 1])) continue;
    for (const t of estimated.keys()) if (times[i] < t && t < times[i + 1]) named.set(t, vin);
  }
  return named;
}

const inDayOf = (start: number, end: number) => <V>(values: Map<number, V>) => new Map([...values].filter(([t]) => start <= t && t < end));

// The day's charging per 5 minutes, measured, gap-filled or placed from charge sessions, with the day's energy
// intervals it is split across. measuredVins names only the cars the Wall Connector measured, alone or on both sides of
// a gap; vins adds the cars sessions are credited to by their power, for the replay.
export async function dayCharging(day: string) {
  const start = localMidnight(day);
  const end = localMidnight(shiftDay(day, 1));
  const inDay = inDayOf(start, end);

  // From the day before, for charge sessions whose stretch crosses midnight.
  const stretchStart = localMidnight(shiftDay(day, -1));
  const cars = await loadCars();
  const vehicleRows = (
    await db.query<{ start_at: Date; energy_wh: number; vin: string | null }>(
      "SELECT start_at, energy_wh, vin FROM vehicle_interval WHERE start_at >= $1 AND start_at < $2",
      // Through the next day too, where a session's stretch can reach.
      [new Date(stretchStart - ESTIMATE_MARGIN), new Date(localMidnight(shiftDay(day, 2)) + ESTIMATE_MARGIN)],
    )
  ).rows;
  const measuredVehicle = new Map(vehicleRows.map((v) => [v.start_at.getTime(), v.energy_wh]));
  const measuredVin = new Map(vehicleRows.map((v) => [v.start_at.getTime(), v.vin]));

  const vehicleWh = inDay(measuredVehicle);
  const allEstimated = fill(measuredVehicle);
  const estimatedVehicle = inDay(allEstimated);
  const sessions = await sessionEstimates(day, stretchStart, start, end, new Map([...allEstimated, ...measuredVehicle]), measuredVin, cars);
  const sessionVehicle = sessions.estimates;
  const charging = new Map([...sessionVehicle, ...estimatedVehicle, ...vehicleWh]);
  const measuredVins = new Map<number, string | null>([...inDay(gapVins(measuredVin, estimatedVehicle)), ...inDay(measuredVin)]);
  const vins = new Map<number, string | null>([...sessions.cars, ...measuredVins]);
  const intervals = await db.query<EnergyRow>(
    `SELECT start_at, solar_generated_wh, ${Object.values(FLOWS).join(", ")} FROM energy_interval WHERE day = $1`,
    [day],
  );
  return { cars, vehicleWh, estimatedVehicle, sessionVehicle, charging, measuredVins, vins, intervals: intervals.rows };
}

export async function dayIntervals(day: string) {
  const start = localMidnight(day);
  const end = localMidnight(shiftDay(day, 1));
  const inDay = inDayOf(start, end);
  const [{ cars, vehicleWh, estimatedVehicle, sessionVehicle, charging, vins, intervals }, expected] = await Promise.all([dayCharging(day), expectedHours(day)]);
  const realBattery = new Map(
    (
      await db.query<{ sampled_at: Date; percentage: number }>(
        "SELECT sampled_at, percentage FROM battery_sample WHERE sampled_at >= $1 AND sampled_at < $2",
        [new Date(start - ESTIMATE_MARGIN), new Date(end + ESTIMATE_MARGIN)],
      )
    ).rows.map((s) => [s.sampled_at.getTime(), s.percentage]),
  );

  const battery = new Map<number, [number, boolean]>([...inDay(realBattery)].map(([t, pct]) => [t, [pct, false]]));
  for (const [t, pct] of inDay(fill(realBattery))) battery.set(t, [pyRound(pct), true]);

  const records = new Map<number, Row>();
  const recordAt = (instant: number) => {
    if (!records.has(instant)) {
      records.set(instant, {
        ...Object.fromEntries(ALL_FLOWS.flatMap((flow) => [[`${flow}_kw`, null], [`${flow}_wh`, null]])),
        battery_percentage: null,
        battery_estimated: false,
        vehicle_estimated: false,
        vehicle: null,
      });
    }
    return records.get(instant)!;
  };

  const solarWh = new Map<number, number>();
  const totalWh: Record<string, number> = Object.fromEntries(ALL_FLOWS.map((flow) => [flow, 0]));
  let includesEstimates = false;
  let includesSessionEstimates = false;
  for (const interval of intervals) {
    const instant = interval.start_at.getTime();
    solarWh.set(instant, interval.solar_generated_wh);
    const estimated = estimatedVehicle.has(instant);
    const fromSessions = sessionVehicle.has(instant);
    const wh = intervalWh(interval, charging.get(instant));
    const record = recordAt(instant);
    // The Wh unrounded, so a span of records adds up to exactly what the day's totals do.
    for (const [flow, value] of Object.entries(wh)) Object.assign(record, { [`${flow}_kw`]: pyRound(value * WH_TO_KW, 2), [`${flow}_wh`]: value });
    record.vehicle_estimated = estimated || fromSessions;
    includesEstimates = includesEstimates || (estimated && estimatedVehicle.get(instant)! > 0);
    includesSessionEstimates = includesSessionEstimates || (fromSessions && sessionVehicle.get(instant)! > 0);
    for (const [flow, value] of Object.entries(wh)) totalWh[flow] += value;
  }

  for (const [instant, [pct, estimated]] of battery) Object.assign(recordAt(instant), { battery_percentage: pct, battery_estimated: estimated });

  // Charging measured or estimated before Tesla publishes that interval's energy: no flows yet.
  for (const instant of vehicleWh.keys()) recordAt(instant);
  for (const instant of new Set([...estimatedVehicle.keys(), ...sessionVehicle.keys()])) recordAt(instant).vehicle_estimated = true;

  // By name only: VINs and colors stay private.
  for (const [instant, vin] of vins) if (vin) recordAt(instant).vehicle = carName(cars, vin);

  const data = [...records.keys()]
    .sort((a, b) => a - b)
    .map((instant) => {
      const start = localIso(new Date(instant));
      return { start, minute: Number(start.slice(11, 13)) * 60 + Number(start.slice(14, 16)), ...records.get(instant) };
    });

  const readings = await db.query<Record<string, number | null> & { sampled_at: Date; weather_code: number; cloud_cover: number }>(
    "SELECT * FROM weather_sample WHERE sampled_at >= $1 AND sampled_at <= $2 ORDER BY sampled_at",
    [new Date(start - WEATHER_MARGIN), new Date(end + WEATHER_MARGIN)],
  );
  const best = await reference(day);
  const weather = readings.rows.map((r) => {
    const at = r.sampled_at.getTime();
    return {
      start: localIso(r.sampled_at),
      ...skyFrom(r.weather_code, r.cloud_cover, r.cloud_cover_low, r.cloud_cover_mid, r.cloud_cover_high, r.airport_low, r.airport_mid),
      rain: rainFrom(r.weather_code),
      wind: windAcross(r.wind_speed, r.wind_direction),
      ...windsAloft(r.wind_low_speed, r.wind_low_direction, r.wind_mid_speed, r.wind_mid_direction, r.wind_high_speed, r.wind_high_direction),
      sun: share(quarterKw(solarWh, at), best.get(slot(at))),
    };
  });

  // Spans overlapping the day, given whole: the day view cuts them to the day.
  const [offGrid, storm] = await Promise.all([
    db.query<{ start_at: Date; end_at: Date; kind: BackupKind }>(
      `SELECT * FROM (${EVENTS}) e WHERE start_at < $2 AND end_at > $1 ORDER BY start_at`, [new Date(start), new Date(end)],
    ),
    db.query<{ start_at: Date; end_at: Date | null }>(
      "SELECT start_at, end_at FROM site_state WHERE storm_mode_active AND start_at < $2 AND (end_at IS NULL OR end_at > $1) ORDER BY start_at",
      [new Date(start), new Date(end)],
    ),
  ]);

  // Watt-hour precision; the page rounds for display only.
  const totals = Object.fromEntries(ALL_FLOWS.map((flow) => [flow, totalWh[flow] / 1000]));
  return {
    date: day,
    vehicle_data: vehicleWh.size > 0 || sessionVehicle.size > 0,
    vehicle_includes_estimates: includesEstimates,
    vehicle_includes_session_estimates: includesSessionEstimates,
    totals,
    data,
    weather,
    off_grid: offGrid.rows.map((r) => ({ start: r.start_at.toISOString(), end: r.end_at.toISOString(), kind: r.kind })),
    storm_watch: storm.rows.map((r) => ({ start: r.start_at.toISOString(), end: r.end_at?.toISOString() ?? null })),
    expected,
  };
}
