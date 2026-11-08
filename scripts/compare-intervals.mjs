// Compares tesla-next's /api/intervals with anton-tesla-api-ws's /api/v2/intervals for every date, as the day-intervals
// spec requires until Flask's is retired. Usage: node scripts/compare-intervals.mjs [first-date] [last-date]
import { pathToFileURL } from "node:url";

const FLASK = "https://teslasolar.report/api/v2/intervals";
const NEXT = "https://next.teslasolar.report/api/intervals";
const FIRST_DAY = "2021-10-01";
const AT_ONCE = 4;

const describe = (value) => (Array.isArray(value) ? `${value.length} items` : JSON.stringify(value));

// The path of the first place two parsed responses differ, or null. Numbers compare with ===, so -0 equals 0.
export function firstDifference(a, b, path = "") {
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return `${path}: ${a.length} items vs ${b.length}`;
    for (let i = 0; i < a.length; i++) {
      const found = firstDifference(a[i], b[i], `${path}[${i}]`);
      if (found) return found;
    }
    return null;
  }
  if (a && b && typeof a === "object" && typeof b === "object" && !Array.isArray(a) && !Array.isArray(b)) {
    for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
      const found = firstDifference(a[key], b[key], path ? `${path}.${key}` : key);
      if (found) return found;
    }
    return null;
  }
  return a === b ? null : `${path}: ${describe(a)} vs ${describe(b)}`;
}

const addDays = (day, days) => new Date(Date.parse(`${day}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);

async function fetchDay(base, day) {
  const response = await fetch(`${base}?date=${day}`);
  return { status: response.status, body: await response.json() };
}

async function compare(day) {
  const [flask, next] = await Promise.all([fetchDay(FLASK, day), fetchDay(NEXT, day)]);
  if (flask.status !== next.status) return `status ${flask.status} vs ${next.status}`;
  return firstDifference(flask.body, next.body);
}

async function main() {
  const first = process.argv[2] ?? FIRST_DAY;
  const last = process.argv[3] ?? new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles" }).format(new Date());
  const days = [addDays(FIRST_DAY, -1)];
  for (let day = first; day <= last; day = addDays(day, 1)) days.push(day);

  let mismatches = 0;
  let next = 0;
  async function worker() {
    while (next < days.length) {
      const day = days[next++];
      const found = await compare(day).catch((error) => `request failed: ${error.message}`);
      if (found) {
        mismatches++;
        console.log(`${day}: ${found}`);
      }
    }
  }
  await Promise.all(Array.from({ length: AT_ONCE }, worker));
  console.log(`${days.length} dates compared (${days[0]}, outside the window, and ${first} to ${last}), ${mismatches} mismatched`);
  process.exitCode = mismatches ? 1 : 0;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) await main();
