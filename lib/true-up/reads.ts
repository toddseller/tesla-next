import { db } from "@/lib/db";
import { shiftDay } from "@/lib/scene/replay";

// PG&E's meter read dates for this meter, which start its billing cycles. Only anton-tesla-api-ws stores them, from
// PG&E's yearly schedules; years without all 12 stored are estimated, so a schedule published later takes over.

const pad = (n: number) => String(n).padStart(2, "0");

// The 6th of each month, moved to the Friday before a Saturday or the Monday after a Sunday.
export const estimatedReads = (year: number) =>
  Array.from({ length: 12 }, (_, i) => {
    const sixth = `${year}-${pad(i + 1)}-06`;
    const weekday = new Date(`${sixth}T00:00:00Z`).getUTCDay();
    return weekday === 6 ? shiftDay(sixth, -1) : weekday === 0 ? shiftDay(sixth, 1) : sixth;
  });

async function storedReads(first: number, last: number) {
  const { rows } = await db.query<{ year: number; read_date: string }>(
    "SELECT year, read_date::text AS read_date FROM meter_read WHERE year BETWEEN $1 AND $2 ORDER BY read_date",
    [first, last],
  );
  return (year: number) => {
    const stored = rows.filter((row) => row.year === year).map((row) => row.read_date);
    return stored.length === 12 ? stored : estimatedReads(year);
  };
}

export const readsFor = async (year: number) => (await storedReads(year, year))(year);

// [first day, last day] of each billing cycle starting from start to end. As PG&E's bills count billing days, a cycle
// starts on a read date and ends the day before the next read.
export async function billingCycles(start: string, end: string): Promise<[string, string][]> {
  const [first, last] = [Number(start.slice(0, 4)) - 1, Number(end.slice(0, 4)) + 1];
  const readsOf = await storedReads(first, last);
  const all = Array.from({ length: last - first + 1 }, (_, i) => readsOf(first + i)).flat().sort();
  return all.slice(0, -1)
    .map((read, i): [string, string] => [read, shiftDay(all[i + 1], -1)])
    .filter(([day]) => start <= day && day <= end);
}

// True-up years run October 1 to September 30, the first ending in 2022 (permission to operate was October 2021).
// Each ends, for PG&E, on its October read.
export const FIRST_TRUE_UP_END_YEAR = 2022;
export const OCTOBER = 9;

// The year whose October read ends the true-up year containing `day`, given that year's October read; the read day
// starts the next.
export const endYearOf = (day: string, octoberRead: string) => Number(day.slice(0, 4)) + (day < octoberRead ? 0 : 1);

export const trueUpEndYear = async (day: string) => endYearOf(day, (await readsFor(Number(day.slice(0, 4))))[OCTOBER]);

export const trueUpLabel = (year: number) => `'${pad((year - 1) % 100)} - '${pad(year % 100)}`;

export type TrueUpYear = { label: string; start_date: string; end_date: string; last_read_date: string; current: boolean };

// Each true-up year from 2021-22 through the one containing today, the last marked current.
export async function trueUpYears(today: string): Promise<TrueUpYear[]> {
  const current = await trueUpEndYear(today);
  const readsOf = await storedReads(FIRST_TRUE_UP_END_YEAR, current);
  return Array.from({ length: current - FIRST_TRUE_UP_END_YEAR + 1 }, (_, i) => {
    const year = FIRST_TRUE_UP_END_YEAR + i;
    return {
      label: trueUpLabel(year),
      start_date: `${year - 1}-10-01`,
      end_date: `${year}-09-30`,
      last_read_date: readsOf(year)[OCTOBER],
      current: year === current,
    };
  });
}
