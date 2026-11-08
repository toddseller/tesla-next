// Ported from anton-tesla-api-ws services/gap_estimates.py; see the day-intervals spec. Times are UTC milliseconds,
// so 5 minute steps stay uniform across daylight saving changes.
import { pyRound } from "./python";

export const STEP = 5 * 60_000;
const MAX_MISSING = (2 * 60 * 60_000) / STEP;

export function fill(points: Map<number, number>): Map<number, number> {
  const estimates = new Map<number, number>();
  const times = [...points.keys()].sort((a, b) => a - b);
  for (let i = 0; i + 1 < times.length; i++) {
    const before = times[i];
    const after = times[i + 1];
    const missing = pyRound((after - before) / STEP) - 1;
    if (missing < 1 || missing > MAX_MISSING) continue;
    const start = points.get(before)!;
    const end = points.get(after)!;
    for (let k = 1; k <= missing; k++) estimates.set(before + k * STEP, start + ((end - start) * k) / (missing + 1));
  }
  return estimates;
}

export const SESSION_HORIZON = 12 * 60 * 60_000;
const CHARGING_WH = (2000 * STEP) / (60 * 60_000);
const MAX_QUIET = (30 * 60_000) / STEP;

export type Session = [start: number, energyWh: number, car: string | null];

// A session's start is often when the car was plugged in, not when it charged, so its energy goes on the load above
// the day's baseline (`excess`) from its start on; see the day-intervals spec.
export function placeSessions(
  sessions: Session[],
  excess: Map<number, number>,
  known: Map<number, number>,
  knownVins: Map<number, string | null>,
): [Map<number, number>, Map<number, string | null>] {
  const placed = new Map<number, number>();
  const cars = new Map<number, string | null>();
  const largest = new Map<number, number>();
  for (const [start, energy, car] of sessions) {
    let boundary = start - (start % STEP);
    let remaining = energy;
    let started = false;
    let quiet = 0;
    let measuredCar: string | null = null;
    const own = new Map<number, number>();
    while (remaining > 0 && boundary < start + SESSION_HORIZON) {
      let charging: boolean;
      if (known.has(boundary)) {
        remaining -= known.get(boundary)!;
        charging = known.get(boundary)! > 0;
        measuredCar = measuredCar || (knownVins.get(boundary) ?? null);
      } else {
        const available = (excess.get(boundary) ?? 0) - (placed.get(boundary) ?? 0);
        charging = available >= CHARGING_WH;
        if (charging) {
          const wh = Math.min(available, remaining);
          own.set(boundary, wh);
          placed.set(boundary, (placed.get(boundary) ?? 0) + wh);
          remaining -= wh;
        }
      }
      if (charging) {
        started = true;
        quiet = 0;
      } else if (started) {
        quiet += 1;
        if (quiet >= MAX_QUIET) break;
      }
      boundary += STEP;
    }
    for (const [t, wh] of own) {
      if (wh > (largest.get(t) ?? 0)) {
        largest.set(t, wh);
        cars.set(t, measuredCar || car);
      }
    }
  }
  return [new Map([...placed].filter(([, wh]) => wh > 0)), cars];
}
