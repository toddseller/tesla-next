// Compares tesla-next's /api/top-ten with anton-tesla-api-ws's /api/v2/top_ten, as the top-ten spec requires until
// Flask's is retired. Usage: node scripts/compare-top-ten.mjs
import { pathToFileURL } from "node:url";
import { firstDifference } from "./compare-intervals.mjs";

// Run on onyx against the apps directly, as compare-range is: FLASK=http://nginx/api/v2/top_ten
// NEXT=http://next:3000/api/top-ten (see README.md).
const FLASK = process.env.FLASK ?? "https://teslasolar.report/api/v2/top_ten";
const NEXT = process.env.NEXT ?? "https://next.teslasolar.report/api/top-ten";
const RANKINGS = [["solar", "solar"], ["net_grid", "net_grid"], ["to_grid_months", "net_grid"]];

// Rows whose figures read the same to a tenth are ordered newest first here and by unshown differences in Flask, so
// they're compared as sets; at 10th place the two can rank different rows, so that figure's rows are only counted.
const shown = (field) => (row) => row[field].toFixed(1);
function tiedSets(rows, field) {
  const groups = Map.groupBy(rows.map((row) => ({ date: row.date, [field]: row[field] })), shown(field));
  if (rows.length === 10) groups.delete(shown(field)(rows[9]));
  return [...groups.values()].map((group) => group.sort((a, b) => a.date.localeCompare(b.date)));
}

export function difference(flask, next) {
  for (const [i, [name, field]] of RANKINGS.entries()) {
    const [a, b] = [flask.data[i][name], next.data[i][name]];
    const found = firstDifference(a.map(shown(field)), b.map(shown(field)), `${name} figures`) ?? firstDifference(tiedSets(a, field), tiedSets(b, field), name);
    if (found) return found;
  }
  return null;
}

async function main() {
  const [flask, next] = await Promise.all([FLASK, NEXT].map((url) => fetch(url).then(async (r) => ({ status: r.status, body: await r.json() }))));
  const found = flask.status !== next.status ? `status ${flask.status} vs ${next.status}` : difference(flask.body, next.body);
  console.log(found ?? "the three rankings match");
  process.exitCode = found ? 1 : 0;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) await main();
