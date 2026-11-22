import { db } from "@/lib/db";
import { type Kept, keptFor, refreshKept } from "@/lib/kept";
import { PTO } from "@/lib/scene/replay";

export type SolarDay = { day: string; kwh: number[] };

const SITE = "'America/Los_Angeles'";

// Solar is never corrected by PG&E's meter, so the stored steps are read as they are. A site day's hour that happens
// twice, as the clock goes back, holds both.
async function workOut(year: number, today: string): Promise<SolarDay[]> {
  const { rows } = await db.query<{ day: string; hour: number; wh: number }>(
    `SELECT day::text AS day, extract(hour FROM start_at AT TIME ZONE ${SITE})::int AS hour, sum(solar_generated_wh)::float8 AS wh
     FROM energy_interval WHERE day >= greatest($1::date, $4::date) AND day <= least($2::date, $3::date) GROUP BY 1, 2 ORDER BY 1, 2`,
    [`${year}-01-01`, `${year}-12-31`, today, PTO],
  );
  const days = new Map<string, number[]>();
  for (const { day, hour, wh } of rows) (days.get(day) ?? days.set(day, Array(24).fill(0)).get(day)!)[hour] += wh / 1000;
  return [...days].map(([day, kwh]) => ({ day, kwh }));
}

declare global {
  var solarHoursKept: Kept<SolarDay[]> | undefined;
}
const kept = () => (globalThis.solarHoursKept ??= new Map());

// A year's 8,760 hours are kept for the site day; only today's totals change the current year's, which
// instrumentation refreshes, so a visit almost never waits for it.
export const solarHours = (year: number, today: string) => keptFor(kept(), String(year), today, () => workOut(year, today));

export function refreshSolarHours(today: string) {
  const year = Number(today.slice(0, 4));
  return refreshKept(kept(), String(year), today, () => workOut(year, today), "solar hours");
}
