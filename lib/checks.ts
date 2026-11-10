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

// From the 2021 to 2026 replay: it caught both microinverter faults (2025-08-28, 2026-04-13) and nothing else, and
// judges 40 to 77% of days in every month. A fixed level judged no day from November to January.
const SITE = "https://teslasolar.report";
const BRIGHT_SHARE = 0.6;
const CLEAR_PERCENTILE = 0.9;
const CLEAR_SPAN_DAYS = 15;
const PEAK_SHARE = 0.6;
const MIN_BRIGHT_DAYS = 5;

// A failing microinverter caps the peak, which a bright day shows at once and a total blurs with the weather.
// Yesterday is judged: today's day isn't over.
export async function peakCheck(today: string) {
  const day = shiftDay(today, -1);
  const { rows: [{ mj, clear, peak, usual, bright }] } = await db.query<{ mj: number | null; clear: number | null; peak: number | null; usual: number | null; bright: number }>(
    // Each day's clear-day forecast is taken from every stored year, the distance in days of the year measured both
    // ways round, so late December and early January share theirs.
    `WITH sky AS (
       SELECT d::date AS day, f.radiation_mj::float8 AS mj,
         (SELECT percentile_disc($3) WITHIN GROUP (ORDER BY c.radiation_mj)::float8 FROM solar_forecast c
          WHERE least(abs(extract(doy FROM c.day) - extract(doy FROM d)), 365 - abs(extract(doy FROM c.day) - extract(doy FROM d))) <= $4) AS clear,
         (SELECT max(solar_generated_wh) * 12 FROM energy_interval e WHERE e.day = d::date) AS peak
       FROM generate_series($1::date - 30, $1::date, interval '1 day') d LEFT JOIN solar_forecast f ON f.day = d::date)
     SELECT y.mj, y.clear, y.peak, percentile_disc(0.5) WITHIN GROUP (ORDER BY b.peak) AS usual, count(b.peak)::int AS bright
     FROM sky y LEFT JOIN sky b ON b.day < y.day AND b.peak IS NOT NULL AND b.mj >= $2 * b.clear
     WHERE y.day = $1 GROUP BY y.mj, y.clear, y.peak`,
    [day, BRIGHT_SHARE, CLEAR_PERCENTILE, CLEAR_SPAN_DAYS],
  );
  const label = datesLabel({ start: day, end: day }, "long");
  // The alert's link opens the day's chart, its expected line beside what was made.
  const link = `${SITE}/?day=${day}`;
  // A lost day would otherwise pass every check unseen.
  if (peak === null) return `FAIL solar peak: no solar was stored for ${label} ${link}`;
  if (mj === null || clear === null) return `ok solar peak: ${label} has no forecast to judge it by`;
  if (mj < BRIGHT_SHARE * clear) return `ok solar peak: ${label} was too dull to judge (${mj.toFixed(1)} MJ/m² forecast, ${percent(mj, clear)}% of a clear day's ${clear.toFixed(1)})`;
  if (bright < MIN_BRIGHT_DAYS) return `ok solar peak: too few bright days before ${label} to judge it (${bright})`;
  if (!usual) return `FAIL solar peak: no bright day in the 30 before ${label} made any solar ${link}`;
  const kw = (watts: number) => (watts / 1000).toFixed(1);
  const line = `${label}'s peak was ${percent(peak, usual!)}% of the usual bright-day peak (${kw(peak)} of ${kw(usual!)} kW)`;
  return peak < usual! * PEAK_SHARE ? `FAIL solar peak: ${line} ${link}` : `ok solar peak: ${line}`;
}

export const allChecks = async (today: string) => Promise.all([meterCheck(), staleCheck(today), outputCheck(today)]);
