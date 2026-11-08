// Compares tesla-next's /api/true-up-years, /api/cycles and /api/true-up-cost with anton-tesla-api-ws's
// /api/v2/true_up_years, /api/v2/sheet and /api/v2/true_up_cost, as the true-up-cycles and true-up-cost specs require
// until Flask's are retired. Usage: node scripts/compare-true-up.mjs
import { pathToFileURL } from "node:url";
import { firstDifference } from "./compare-intervals.mjs";
import { compareAll } from "./compare-range.mjs";

// Run on onyx against the apps directly, as compare-range is: FLASK=http://nginx/api/v2 NEXT=http://next:3000/api
// (see README.md). Both answers depend on today, so run it away from midnight and the October read.
const FLASK = process.env.FLASK ?? "https://teslasolar.report/api/v2";
const NEXT = process.env.NEXT ?? "https://next.teslasolar.report/api";

export const difference = (flask, next) => firstDifference(flask, next);

// Each true-up year, All time, and in each year a month, a 15th-to-14th span and a range across into the next year.
export function ranges(years) {
  const custom = years.flatMap(({ start_date: start, end_date: end }) => {
    const [first, second] = [start.slice(0, 4), end.slice(0, 4)];
    return [[`${first}-11-01`, `${first}-11-30`], [`${second}-01-15`, `${second}-06-14`], [`${first}-04-01`, `${second}-03-31`]];
  });
  return [
    ...years.map((year) => [year.start_date, year.end_date]),
    [years[0].start_date, years.at(-1).end_date],
    ...custom.filter(([start]) => start >= years[0].start_date && start <= years.at(-1).start_date),
  ];
}

export async function compareYears(flask, next, log = console.log) {
  const [a, b] = await Promise.all([`${flask}/true_up_years`, `${next}/true-up-years`].map(async (url) => (await fetch(url)).json()));
  const found = difference(a, b);
  if (found) log(`true-up years: ${found}`);
  return { years: a.data, mismatched: Boolean(found) };
}

async function main() {
  const { years, mismatched } = await compareYears(FLASK, NEXT);
  const swept = ranges(years);
  const cycles = await compareAll(`${FLASK}/sheet`, `${NEXT}/cycles`, swept, difference);
  const cost = await compareAll(`${FLASK}/true_up_cost`, `${NEXT}/true-up-cost`, swept, difference);
  process.exitCode = mismatched || cycles || cost ? 1 : 0;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) await main();
