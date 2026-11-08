// Ported from anton-tesla-api-ws services/sunshine.py: how sunny it was at the house, from the roof's own output.
// The live share stays in Flask, which keeps the recent output in memory.
import { db } from "@/lib/db";

const REFERENCE_DAYS = 14;
// Wh over a quarter-hour -> average kW
const QUARTER_WH_TO_KW = 4 / 1000;
// Below this best output (night, dawn, dusk) the roof says too little about the sky.
const MIN_REFERENCE_KW = 1.0;

// The UTC quarter-hour of the day: the sun's position follows UTC, not the clock, across daylight saving.
export function slot(instant: number) {
  const at = new Date(instant);
  return Math.floor((at.getUTCHours() * 60 + at.getUTCMinutes()) / 15);
}

// The roof's best quarter-hour output in kW for each slot over the 14 days before `day` (YYYY-MM-DD).
export async function reference(day: string): Promise<Map<number, number>> {
  const { rows } = await db.query<{ day: string; start_at: Date; wh: number }>(
    "SELECT day::text AS day, start_at, solar_generated_wh AS wh FROM energy_interval WHERE day >= $1::date - $2::int AND day < $1::date",
    [day, REFERENCE_DAYS],
  );
  const quarters = new Map<string, { at: number; wh: number }>();
  for (const row of rows) {
    const at = slot(row.start_at.getTime());
    const key = `${row.day} ${at}`;
    quarters.set(key, { at, wh: (quarters.get(key)?.wh ?? 0) + row.wh });
  }
  const best = new Map<number, number>();
  for (const { at, wh } of quarters.values()) best.set(at, Math.max(best.get(at) ?? 0, wh * QUARTER_WH_TO_KW));
  return best;
}

// How sunny it is, 0 to 1: the output over the best at that time; null when either is too small to judge by.
export function share(outputKw: number | null, referenceKw: number | null | undefined): number | null {
  if (outputKw === null || referenceKw == null || referenceKw < MIN_REFERENCE_KW) return null;
  return Math.min(1, outputKw / referenceKw);
}

// The average output in kW over the quarter-hour from `start`, by interval start; null until all three are stored.
export function quarterKw(solarWh: Map<number, number>, start: number): number | null {
  const wh = [0, 5, 10].map((minutes) => solarWh.get(start + minutes * 60_000));
  if (wh.some((value) => value === undefined)) return null;
  return (wh as number[]).reduce((a, b) => a + b, 0) * QUARTER_WH_TO_KW;
}
