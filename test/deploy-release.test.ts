// deploy/release, the Deploy workflow's side of a deploy (deploy-on-tag spec, "A lost connection doesn't decide a
// deploy"), against a fake ssh that records each request and answers from a queue: answer n is "<exit status>" on its
// first line, then what it prints; with no answer queued it exits 255, as ssh does when the connection is lost.
import { spawnSync } from "node:child_process";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, expect, test } from "vitest";

const SCRIPT = join(import.meta.dirname, "../deploy/release");
let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "deploy-release-"));
  mkdirSync(join(root, "bin"));
  mkdirSync(join(root, "answers"));
  writeFileSync(
    join(root, "bin/ssh"),
    `#!/bin/sh
for last; do :; done
echo "$last" >> '${root}/requests'
n=$(( $(cat '${root}/count' 2>/dev/null || echo 0) + 1 ))
echo "$n" > '${root}/count'
answer='${root}/answers/'"$n"
[ -f "$answer" ] || exit 255
tail -n +2 "$answer"
exit "$(head -n 1 "$answer")"
`,
  );
  chmodSync(join(root, "bin/ssh"), 0o755);
});

afterEach(() => rmSync(root, { recursive: true, force: true }));

const answers = (...each: [number, string][]) => each.forEach(([code, out], i) => writeFileSync(join(root, "answers", String(i + 1)), `${code}\n${out}`));
const requests = () => readFileSync(join(root, "requests"), "utf8").trim().split("\n");
const release = (tries = 3) => {
  const result = spawnSync(SCRIPT, ["v1"], {
    env: { ...process.env, PATH: `${join(root, "bin")}:${process.env.PATH}`, HOME: root, DEPLOY_SSH_TARGET: "onyx@test",
      DEPLOY_STATUS_INTERVAL: "0", DEPLOY_STATUS_TRIES: String(tries) },
    encoding: "utf8",
  });
  return { code: result.status, out: result.stdout, err: result.stderr };
};

test("a deploy that stays connected passes its exit status on and asks for no status", () => {
  answers([0, "v1 answered 200: deployed v1\n"]);
  expect(release().code).toBe(0);
  expect(requests()).toEqual(["deploy v1"]);
  rmSync(join(root, "requests"));
  rmSync(join(root, "count"));
  answers([1, ""]);
  expect(release().code).toBe(1);
  expect(requests()).toEqual(["deploy v1"]);
});

test("after the connection is lost it asks for the status until the deploy has ended, skipping a poll that can't connect", () => {
  answers([255, ""], [255, ""], [0, "running\nDeploying v1\n"], [0, "succeeded\nDeploying v1\nanswered 200: deployed v1\n"]);
  const result = release();
  expect(result.code).toBe(0);
  expect(requests()).toEqual(["deploy v1", "status v1", "status v1", "status v1"]);
  expect(result.out).toMatch(/::warning::lost the connection to the server/);
  expect(result.out).toMatch(/answered 200: deployed v1/);
});

test("a deploy that failed after the drop fails the run with its status and shows its log", () => {
  answers([255, ""], [0, "failed 1\ndeploy: the image did not build; the app was not replaced\n"]);
  const result = release();
  expect(result.code).toBe(1);
  expect(result.out).toMatch(/did not build/);
});

test("a deploy still running, or an answer it can't read, at the last poll fails the run as not finished", () => {
  answers([255, ""], [0, "running\n"], [2, "deploy: usage: deploy <tag>\n"], [0, "running\n"]);
  const result = release(3);
  expect(result.code).toBe(1);
  expect(requests()).toEqual(["deploy v1", "status v1", "status v1", "status v1"]);
  expect(result.out).toMatch(/::error::the deploy of v1 didn't finish in time/);
});
