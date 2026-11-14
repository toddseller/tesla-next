// The virtual power plant's event days (`data.is_vpp`), which the True-Up Tracker's VPP estimate and the Top Ten's
// VPP filter read. Seasons run May 1 to October 31.
import type { PoolClient } from "pg";
import { longDate } from "@/lib/calendar-dates";
import { db } from "@/lib/db";
import { shiftDay } from "@/lib/scene/replay";
import { FIRST_SEASON } from "@/lib/true-up/cost";

export class VppError extends Error {}

// The season of the latest May 1 to have come, so from January to April it is still last year's.
export const currentSeason = (today: string) => Number(today.slice(0, 4)) - (today.slice(5) < "05-01" ? 1 : 0);

// `data.date` is text in ISO form, so the season's days compare as text.
export async function vppDays(season: number) {
  const { rows } = await db.query<{ date: string; kwh: number }>(
    "SELECT date, powerwall_to_grid AS kwh FROM data WHERE is_vpp AND date BETWEEN $1 AND $2 ORDER BY date",
    [`${season}-05-01`, `${season}-10-31`],
  );
  return rows;
}

const isDay = (day: string) => /^\d{4}-\d{2}-\d{2}$/.test(day) && shiftDay(day, 0) === day;

export async function mark(client: PoolClient, day: string, today: string) {
  if (!isDay(day)) throw new VppError("pick a day");
  if (day > today) throw new VppError(`${longDate(day)} has no data yet`);
  const season = currentSeason(today);
  if (day < `${season}-05-01` || day > `${season}-10-31`) {
    throw new VppError(`${longDate(day)} isn't in the ${season} season, May 1 to October 31`);
  }
  const { rowCount } = await client.query("UPDATE data SET is_vpp = true WHERE date = $1", [day]);
  if (!rowCount) throw new VppError(`${longDate(day)} has no data yet`);
}

export async function unmark(client: PoolClient, day: string) {
  if (!isDay(day)) throw new VppError("pick a day");
  await client.query("UPDATE data SET is_vpp = false WHERE date = $1", [day]);
}

// Tesla pays once a year, about six months after the season, as credits in its app; the True-Up Tracker shows a
// recorded payout in place of its estimate. Ported from anton-tesla-api-ws scripts/record_vpp_payout.py.
export async function recordPayout(client: PoolClient, season: string, amount: string, paidOn: string, today: string) {
  const year = Number(season);
  const latest = currentSeason(today);
  if (!Number.isInteger(year) || year < FIRST_SEASON || year > latest) throw new VppError(`pick a season from ${FIRST_SEASON} to ${latest}`);
  if (!(Number.isFinite(Number(amount)) && Number(amount) > 0)) throw new VppError("the amount must be positive");
  if (!isDay(paidOn)) throw new VppError("pick the date it was paid");
  if (paidOn <= `${year}-10-31`) throw new VppError(`the ${year} season hadn't ended by ${longDate(paidOn)}`);
  await client.query(
    "INSERT INTO vpp_payout (season, amount, paid_on) VALUES ($1, $2, $3) ON CONFLICT (season) DO UPDATE SET amount = $2, paid_on = $3",
    [year, Number(amount), paidOn],
  );
}

export async function latestPayout() {
  const { rows } = await db.query<{ season: number; amount: number; paid_on: string }>(
    "SELECT season, amount, paid_on::text AS paid_on FROM vpp_payout ORDER BY season DESC LIMIT 1",
  );
  return rows[0] ?? null;
}
