// Compares tesla-next's /api/range with anton-tesla-api-ws's /api/v2/formatted over a sweep of ranges, as the
// solar-range-chart spec requires until Flask's is retired. Usage: node scripts/compare-range.mjs
import { pathToFileURL } from "node:url";
import { firstDifference } from "./compare-intervals.mjs";

// Run on onyx against the apps directly, as compare-intervals is: FLASK=http://nginx/api/v2/formatted
// NEXT=http://next:3000/api/range (see README.md).
const FLASK = process.env.FLASK ?? "https://teslasolar.report/api/v2/formatted";
const NEXT = process.env.NEXT ?? "https://next.teslasolar.report/api/range";
const FIELDS = ["date", "day", "solar", "grid", "house"];

const addDays = (day, days) => new Date(Date.parse(`${day}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);
const monthEnd = (year, month) => new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);
const pad = (n) => String(n).padStart(2, "0");

// Ranges that exercise each way Flask cuts and sums a range.
export function sweep(today) {
  const [year, month] = today.split("-").map(Number);
  const ranges = [];
  for (let y = 2021, m = 10; y < year || (y === year && m <= month); m === 12 ? (y++, (m = 1)) : m++) {
    ranges.push([`${y}-${pad(m)}-01`, monthEnd(y, m)]);
  }
  for (let y = 2021; y <= year; y++) ranges.push([`${y}-10-01`, `${y + 1}-09-30`]);
  for (let y = 2022; y <= year; y++) {
    ranges.push([`${y}-01-01`, `${y}-12-31`], [`${y}-01-15`, `${y}-06-14`], [`${y}-03-03`, addDays(`${y}-03-03`, 31)], [`${y}-03-03`, addDays(`${y}-03-03`, 32)]);
  }
  for (const end of ["2024-02-28", "2024-02-29"]) ranges.push(["2024-01-15", end]);
  for (const end of ["2025-03-30", "2025-03-31"]) ranges.push(["2025-01-15", end]);
  ranges.push(["2021-10-01", "2021-10-09"], ["2021-10-01", "2021-12-31"]);
  return ranges;
}

const pick = (body) => body.data.map((item) => Object.fromEntries(FIELDS.filter((f) => f in item).map((f) => [f, item[f]])));

export const difference = (flask, next) => firstDifference(pick(flask), pick(next));

async function fetchRange(base, [start, end]) {
  const response = await fetch(`${base}?start_date=${start}&end_date=${end}`);
  return { status: response.status, body: await response.json() };
}

async function main() {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles" }).format(new Date());
  const ranges = sweep(today);
  let mismatches = 0;
  for (const range of ranges) {
    const found = await Promise.all([fetchRange(FLASK, range), fetchRange(NEXT, range)])
      .then(([flask, next]) => (flask.status !== next.status ? `status ${flask.status} vs ${next.status}` : difference(flask.body, next.body)))
      .catch((error) => `request failed: ${error.message}`);
    if (found) {
      mismatches++;
      console.log(`${range.join(" to ")}: ${found}`);
    }
  }
  console.log(`${ranges.length} ranges compared, ${mismatches} mismatched`);
  process.exitCode = mismatches ? 1 : 0;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) await main();
