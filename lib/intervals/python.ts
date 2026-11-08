// The intervals read must answer exactly as anton-tesla-api-ws's Python did, so these reproduce two of Python's
// behaviors JavaScript doesn't share.

export const SITE_ZONE = "America/Los_Angeles";

// Python's round(): the double's exact value, rounded to nearest, an exact tie to the even neighbor.
// JavaScript's toFixed rounds an exact tie away from zero instead.
export function pyRound(value: number, digits = 0): number {
  // 100 digits hold the exact decimal expansion of every double this read rounds (kW, kWh and percentages).
  const exact = Math.abs(value).toFixed(100);
  const point = exact.indexOf(".");
  if (!/^50*$/.test(exact.slice(point + 1 + digits))) return Number(value.toFixed(digits));
  const kept = exact.slice(0, point + 1 + digits);
  const odd = Number(kept.replace(".", "").slice(-1)) % 2 === 1;
  return Math.sign(value) * Number((Number(kept) + (odd ? 10 ** -digits : 0)).toFixed(digits));
}

const wallClock = new Intl.DateTimeFormat("en-US", {
  timeZone: SITE_ZONE,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

const pad = (n: number) => String(n).padStart(2, "0");

const wallParts = (instant: Date) => Object.fromEntries(wallClock.formatToParts(instant).map(({ type, value }) => [type, value]));

// Minutes the site's clock is ahead of UTC at `instant` (negative: behind).
function offsetMinutes(instant: Date) {
  const part = wallParts(instant);
  const wall = Date.UTC(+part.year, +part.month - 1, +part.day, +part.hour, +part.minute, +part.second);
  return Math.round((wall - instant.getTime()) / 60_000);
}

// Python's datetime.isoformat() for an instant shown at the site: "2026-11-07T00:00:00-08:00".
export function localIso(instant: Date): string {
  const part = wallParts(instant);
  const offset = offsetMinutes(instant);
  const sign = offset < 0 ? "-" : "+";
  const minutes = Math.abs(offset);
  return `${part.year}-${part.month}-${part.day}T${part.hour}:${part.minute}:${part.second}${sign}${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
}

// The UTC milliseconds of midnight starting `day` (YYYY-MM-DD) at the site, as datetime.combine(day, time.min, LOCAL).
// The site changes its clocks at 2 AM, so midnight always exists once.
export function localMidnight(day: string): number {
  const wall = Date.parse(`${day}T00:00:00Z`);
  const guess = wall - offsetMinutes(new Date(wall)) * 60_000;
  return wall - offsetMinutes(new Date(guess)) * 60_000;
}
