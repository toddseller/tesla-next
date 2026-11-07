import { expect, test } from "vitest";
import { auditReport } from "./audit.mjs";

// One line of `yarn audit --groups dependencies --json` for an advisory. Yarn 1 marks
// every advisory `dev: false`, so the group filter, not this script, leaves out build tools.
const line = (ghsa, severity, { module = "some-package" } = {}) => JSON.stringify({
  type: "auditAdvisory",
  data: {
    resolution: { id: 1, path: `app>${module}`, dev: false, optional: false, bundled: false },
    advisory: { id: 1, github_advisory_id: ghsa, module_name: module, severity, title: `${ghsa} title`, url: `https://github.com/advisories/${ghsa}` },
  },
});
const summary = JSON.stringify({ type: "auditSummary", data: { vulnerabilities: {} } });
const report = (lines, waived = {}) => auditReport([...lines, summary].join("\n"), waived);

test("a high or critical advisory in a shipped package blocks", () => {
  expect(report([line("GHSA-high", "high"), line("GHSA-crit", "critical")]).blocking).toEqual(["GHSA-high", "GHSA-crit"]);
});

test("a moderate or low advisory in a shipped package doesn't", () => {
  expect(report([line("GHSA-mod", "moderate"), line("GHSA-low", "low")]).blocking).toEqual([]);
});

test("a waived advisory doesn't, and others still do", () => {
  expect(report([line("GHSA-waived", "high"), line("GHSA-other", "high")], { "GHSA-waived": "only reachable from attacker-controlled links" }).blocking)
    .toEqual(["GHSA-other"]);
});

test("every advisory is listed once per package, with its severity", () => {
  const { listed } = report([
    line("GHSA-a", "moderate", { module: "@babel/runtime" }),
    line("GHSA-a", "moderate", { module: "@babel/runtime" }),
    line("GHSA-b", "moderate", { module: "react-router" }),
  ]);

  expect(listed).toEqual([
    "moderate GHSA-a @babel/runtime: GHSA-a title",
    "moderate GHSA-b react-router: GHSA-b title",
  ]);
});

test("an audit that never finished, as when the registry is unreachable, fails rather than passing empty", () => {
  expect(() => auditReport("", {})).toThrow(/no audit summary/);
});
