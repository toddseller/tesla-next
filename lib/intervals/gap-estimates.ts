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

export const SESSION_HORIZON = 24 * 60 * 60_000;
const CHARGING_WH = (2000 * STEP) / (60 * 60_000);

export type Session = [start: number, durationS: number, energyWh: number, car: string | null];

// A session's start is often when the car was plugged in, not when it charged, so its energy goes in the stretch of
// its duration, within a day of its start and before the next session's, with the most load above the day's baseline
// (`excess`); sessions come in order of their start. See the day-intervals spec.
export function placeSessions(
  sessions: Session[],
  excess: Map<number, number>,
  known: Map<number, number>,
  knownVins: Map<number, string | null>,
): [Map<number, number>, Map<number, string | null>] {
  const placed = new Map<number, number>();
  const cars = new Map<number, string | null>();
  const largest = new Map<number, number>();
  const available = (t: number) => (excess.get(t) ?? 0) - (placed.get(t) ?? 0);
  const creditable = (t: number) => known.get(t) ?? (available(t) >= CHARGING_WH ? available(t) : 0);
  sessions.forEach(([start, durationS, energy, car], i) => {
    // One Wall Connector charges one session at a time, so a session's stretch ends before the next one starts.
    const end = Math.min(start + SESSION_HORIZON, sessions[i + 1]?.[0] ?? Infinity);
    let best = start - (start % STEP);
    // One interval more than its duration, since a session rarely starts on a boundary.
    const length = Math.max(1, Math.min(Math.ceil((durationS * 1000) / STEP) + 1, Math.ceil((end - best) / STEP)));
    let bestWh = -1;
    for (let from = best; ; from += STEP) {
      let wh = 0;
      for (let k = 0; k < length; k++) wh += creditable(from + k * STEP);
      if (Math.min(wh, energy) > bestWh) [best, bestWh] = [from, Math.min(wh, energy)];
      if (from + length * STEP >= end) break;
    }
    let remaining = energy;
    let measuredCar: string | null = null;
    const own = new Map<number, number>();
    for (let k = 0; k < length && remaining > 0; k++) {
      const t = best + k * STEP;
      if (known.has(t)) {
        remaining -= known.get(t)!;
        measuredCar = measuredCar || (knownVins.get(t) ?? null);
      } else if (available(t) >= CHARGING_WH) {
        const wh = Math.min(available(t), remaining);
        own.set(t, wh);
        placed.set(t, (placed.get(t) ?? 0) + wh);
        remaining -= wh;
      }
    }
    for (const [t, wh] of own) {
      if (wh > (largest.get(t) ?? 0)) {
        largest.set(t, wh);
        cars.set(t, measuredCar || car);
      }
    }
  });
  return [new Map([...placed].filter(([, wh]) => wh > 0)), cars];
}
