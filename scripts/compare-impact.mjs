// Compares tesla-next's /api/impact with anton-tesla-api-ws's /api/v2/impact over a sweep of ranges, as the
// impact-report spec requires until Flask's is retired. Usage: node scripts/compare-impact.mjs
import { pathToFileURL } from "node:url";
import { firstDifference } from "./compare-intervals.mjs";
import { compareAll, siteToday, sweep } from "./compare-range.mjs";

// Run on onyx against the apps directly, as compare-range is: FLASK=http://nginx/api/v2/impact
// NEXT=http://next:3000/api/impact (see README.md).
const FLASK = process.env.FLASK ?? "https://teslasolar.report/api/v2/impact";
const NEXT = process.env.NEXT ?? "https://next.teslasolar.report/api/impact";
const FIELDS = [
  "from_solar_percentage", "from_powerwall_percentage", "from_grid_percentage", "self_powered_percentage", "total_solar_percentage",
  "total_solar", "from_solar", "from_powerwall", "from_grid", "total_house",
];

// The Impact page opens on a single day, which the range sweep never asks for.
export function ranges(today) {
  const days = [];
  for (let y = 2021, m = 10; `${y}-${String(m).padStart(2, "0")}` <= today.slice(0, 7); m === 12 ? (y++, (m = 1)) : m++) {
    const day = `${y}-${String(m).padStart(2, "0")}-15`;
    days.push([day, day]);
  }
  return [...sweep(today), ...days];
}

// Flask's answer also carries the live battery, which /api/impact leaves out.
const pick = (body) => body.data && Object.fromEntries(FIELDS.map((f) => [f, body.data[f]]));

export const difference = (flask, next) => firstDifference(pick(flask), pick(next));

async function main() {
  process.exitCode = (await compareAll(FLASK, NEXT, ranges(siteToday()), difference)) ? 1 : 0;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) await main();
