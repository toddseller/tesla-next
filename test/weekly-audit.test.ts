// deploy/checks (system-checks spec), run by deploy/weekly-audit and the daily timer: it asks the running site for its
// checks and alerts on a failing one, with docker and deploy/pushover replaced by recorders.
import { spawnSync } from "node:child_process";
import { chmodSync, copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, expect, test } from "vitest";

let root: string;

const script = (path: string, body: string) => {
  writeFileSync(path, `#!/bin/sh\n${body}\n`);
  chmodSync(path, 0o755);
};

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "weekly-audit-"));
  mkdirSync(join(root, "app/deploy"), { recursive: true });
  for (const name of ["weekly-audit", "checks"]) copyFileSync(join(import.meta.dirname, `../deploy/${name}`), join(root, `app/deploy/${name}`));
  // Records each alert's title and message.
  script(join(root, "app/deploy/pushover"), `printf '%s\\n' "$1" >> "${root}/alerts"; cat "$2" >> "${root}/alerts"`);
  mkdirSync(join(root, "bin"));
  // The build and prunes pass; "compose ... exec" answers the checks from a file, or fails when there is none.
  script(join(root, "bin/docker"), `case "$*" in
  *exec*) printf '%s\\n' "$*" >> "${root}/execs"; [ -f "${root}/checks" ] && cat "${root}/checks" || exit 1 ;;
  *) exit 0 ;;
esac`);
});

afterEach(() => rmSync(root, { recursive: true, force: true }));

const run = (checks: string | null, command = ["weekly-audit"]) => {
  if (checks !== null) writeFileSync(join(root, "checks"), checks);
  spawnSync(join(root, "app/deploy", command[0]), command.slice(1), { env: { ...process.env, HOME: root, PATH: `${join(root, "bin")}:${process.env.PATH}` }, encoding: "utf8" });
  return existsSync(join(root, "alerts")) ? readFileSync(join(root, "alerts"), "utf8") : null;
};

test("a failing check is sent with its line, and only the failing lines", () => {
  const alerts = run("FAIL meter: Nov 1 – 7, 2026, Tesla's imports are 48% of PG&E's meter\nok meter readings: to November 7, 2026\nok solar output: normal\n");
  expect(alerts).toBe("Weekly checks failed: tesla-next\nFAIL meter: Nov 1 – 7, 2026, Tesla's imports are 48% of PG&E's meter\n");
});

test("a site that can't be reached sends an alert saying the checks couldn't run", () => {
  // Pushover refuses an empty message, and the failed exec may print nothing.
  expect(run(null)).toMatch(/^Weekly checks couldn't run: tesla-next\n[^]*didn't answer \/api\/checks/);
});

test("a week where every check passes sends nothing, and the log keeps the lines", () => {
  expect(run("ok meter: fine\nok meter readings: fine\nok solar output: fine\n")).toBeNull();
  expect(readFileSync(join(root, "tesla-next-weekly-audit.log"), "utf8")).toContain("ok solar output: fine");
});

const daily = (checks: string | null) => run(checks, ["checks", "/api/checks/daily", "Daily"]);

test("the daily run asks for the daily checks and sends a failing line under its own title", () => {
  const line = "FAIL solar peak: April 13, 2026's peak was 52% of the usual bright-day peak (4.4 of 8.4 kW)\n";
  expect(daily(line)).toBe(`Daily checks failed: tesla-next\n${line}`);
  expect(readFileSync(join(root, "execs"), "utf8")).toContain("http://127.0.0.1:3000/api/checks/daily");
});

test("the daily run alerts that it couldn't run when the site can't be reached", () => {
  expect(daily(null)).toMatch(/^Daily checks couldn't run: tesla-next\n[^]*didn't answer \/api\/checks\/daily/);
});

test("a day the check passes sends nothing", () => {
  expect(daily("ok solar peak: November 9, 2026's peak was 98% of the usual bright-day peak (6.6 of 6.7 kW)\n")).toBeNull();
});
