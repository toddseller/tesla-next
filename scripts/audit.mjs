// Fails the app's image build on a known high or critical advisory in a
// package it ships (to the server or browsers). Yarn 1's own exit code can't waive an advisory, and
// it marks every advisory `dev: false`, so the runtime group is chosen by Yarn and
// this reads its JSON on standard input:
//   yarn audit --groups dependencies --json | node scripts/audit.mjs
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

// Advisories that don't apply here, by GitHub advisory ID, each with the reason.
const WAIVED = {};

const BLOCKING = new Set(["high", "critical"]);

export const auditReport = (text, waived = WAIVED) => {
  const seen = new Map();
  let finished = false;
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    const { type, data } = JSON.parse(line);
    finished ||= type === "auditSummary";
    if (type !== "auditAdvisory") continue;
    const { advisory } = data;
    const id = advisory.github_advisory_id ?? String(advisory.id);
    seen.set(`${id} ${advisory.module_name}`, { id, severity: advisory.severity, module: advisory.module_name, title: advisory.title });
  }
  // An unreachable registry yields no advisories, which mustn't read as none found.
  if (!finished) throw new Error("no audit summary: yarn audit did not finish");
  const advisories = [...seen.values()];
  return {
    listed: advisories.map((a) => `${a.severity} ${a.id} ${a.module}: ${a.title}`),
    blocking: advisories.filter((a) => BLOCKING.has(a.severity) && !(a.id in waived)).map((a) => a.id),
  };
};

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { listed, blocking } = auditReport(readFileSync(0, "utf8"));
  listed.forEach((entry) => console.log(entry));
  Object.entries(WAIVED).forEach(([id, reason]) => console.log(`waived ${id}: ${reason}`));
  if (blocking.length) {
    console.error(`Blocking advisories in shipped packages: ${blocking.join(", ")}. Upgrade, or waive in scripts/audit.mjs with a reason.`);
    process.exit(1);
  }
}
