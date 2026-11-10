import { db } from "@/lib/db";
import { pyRound } from "@/lib/intervals/python";
import { shiftDay } from "@/lib/scene/replay";
import { datesLabel } from "@/lib/solar/ranges";

// The weekly checks (system-checks spec): one `ok` or `FAIL` line each, so the server's shell script needs only grep.

const percent = (part: number, whole: number) => Math.round((100 * part) / whole);

// Healthy weeks sit within 1 to 2% of PG&E's meter; the 2022 to 2026 fault read about 50%.
const METER_TOLERANCE = 0.1;
// Summer imports run 6 to 15 kWh a month: too few to judge a week by.
const METER_MIN_KWH = 10;

export async function meterCheck() {
  // Only days both sides have: a day anton didn't save would otherwise read as Tesla running short.
  const { rows } = await db.query<{ days: number; first: string; last: string; pge_in: number; pge_out: number; tesla_in: number; tesla_out: number }>(
    `WITH m AS (SELECT * FROM meter_day ORDER BY date DESC LIMIT 7)
     SELECT count(*)::int AS days, min(m.date) AS first, max(m.date) AS last, sum(m.imported_wh) / 1000.0 AS pge_in, sum(m.exported_wh) / 1000.0 AS pge_out,
       sum(d.from_grid) AS tesla_in, sum(d.to_grid + d.powerwall_to_grid) AS tesla_out
     FROM m JOIN data d ON d.date = m.date WHERE d.from_grid IS NOT NULL AND d.to_grid IS NOT NULL`,
  );
  const week = rows[0];
  if (!week.days) return "FAIL meter: no recent day has both PG&E's readings and Tesla's figures";
  const span = `${datesLabel({ start: week.first, end: week.last }, "short")}, ${week.days} days both have`;
  const judged = [
    ["imports", Number(week.tesla_in), Number(week.pge_in)],
    ["exports", Number(week.tesla_out), Number(week.pge_out)],
  ] as const;
  const off = judged.filter(([, tesla, pge]) => pge >= METER_MIN_KWH && Math.abs(tesla / pge - 1) > METER_TOLERANCE);
  if (off.length) {
    return `FAIL meter: ${span}, Tesla's ${off.map(([name, tesla, pge]) => `${name} are ${percent(tesla, pge)}% of PG&E's meter (${pyRound(tesla)} of ${pyRound(pge)} kWh)`).join(", and its ")}`;
  }
  return `ok meter: ${span}, Tesla within ${METER_TOLERANCE * 100}% of PG&E's meter (${judged.map(([name, tesla, pge]) => (pge >= METER_MIN_KWH ? `${name} ${percent(tesla, pge)}%` : `${name} under ${METER_MIN_KWH} kWh, not judged`)).join(", ")})`;
}

// PG&E's readings normally run a day and a half behind.
const STALE_DAYS = 5;

export async function staleCheck(today: string) {
  const { rows: [{ last }] } = await db.query<{ last: string | null }>("SELECT max(date) AS last FROM meter_day");
  if (!last) return "FAIL meter readings: no PG&E readings stored";
  const label = datesLabel({ start: last, end: last }, "long");
  return shiftDay(last, STALE_DAYS) < today ? `FAIL meter readings: PG&E's readings stop at ${label}` : `ok meter readings: PG&E's readings run to ${label}`;
}

const WINDOW_DAYS = 30;
const MIN_DAYS = 25;
const FIRST_YEAR = 2022;
const OUTPUT_MARGIN = 0.05;

// The third-best day, so one odd reading can't set it, of the 30 days to yesterday, against the same days of each
// past year: below every one by more than 5% of the lowest fails, so a foggy year in the history widens its own margin.
export async function outputCheck(today: string) {
  const { rows } = await db.query<{ k: number; days: number; third: number | null }>(
    `WITH w AS (SELECT k, (($1::date - make_interval(years => k))::date - $2::int) AS a, (($1::date - make_interval(years => k))::date - 1) AS b
                FROM generate_series(0, $3::int) k)
     SELECT w.k, count(d.date)::int AS days, (array_agg(d.solar_generated ORDER BY d.solar_generated DESC))[3] AS third
     FROM w LEFT JOIN data d ON d.date::date BETWEEN w.a AND w.b AND d.solar_generated IS NOT NULL
     GROUP BY w.k ORDER BY w.k`,
    [today, WINDOW_DAYS, Number(today.slice(0, 4)) - FIRST_YEAR],
  );
  const span = datesLabel({ start: shiftDay(today, -WINDOW_DAYS), end: shiftDay(today, -1) }, "short");
  const [now, ...past] = rows;
  const counted = past.filter((year) => year.days >= MIN_DAYS && year.third !== null);
  if (now.days < MIN_DAYS || now.third === null || !counted.length) return `ok solar output: ${span}, too few days to compare`;
  const lowest = Math.min(...counted.map((year) => Number(year.third)));
  const third = Number(now.third);
  const line = `the third-best day of ${span} is ${third.toFixed(1)} kWh`;
  return third < lowest * (1 - OUTPUT_MARGIN)
    ? `FAIL solar output: ${line}, ${percent(third, lowest)}% of the lowest past year's (${lowest.toFixed(1)} kWh)`
    : `ok solar output: ${line}, against ${counted.length} past years' lowest of ${lowest.toFixed(1)} kWh`;
}

export const allChecks = async (today: string) => Promise.all([meterCheck(), staleCheck(today), outputCheck(today)]);
