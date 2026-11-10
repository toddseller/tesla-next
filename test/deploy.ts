import { execFileSync, spawnSync } from "node:child_process";
import { chmodSync, copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, beforeEach, vi } from "vitest";

// Runs bin/deploy against a throwaway origin and server checkout, with docker and curl replaced by recorders, so
// every decision the script makes can be checked without touching the real server. Ported from Myflix's deploy test.
// Importing this registers the hooks that make and remove the throwaway repositories around each test.
const SCRIPT = join(import.meta.dirname, "../bin/deploy");

vi.setConfig({ testTimeout: 20000 });

let root: string;
export const seed = () => join(root, "seed");
export const server = () => join(root, "server");
export const dockerLog = () => join(root, "docker.log");
export const auditLog = () => join(root, "audit.log");
const curlLog = () => join(root, "curl.log");

// Keeps the developer's global git settings (signing, hooks) and a calling hook's GIT_* variables out of the
// throwaway repositories.
const isolated = () => {
  const env = { ...process.env };
  for (const name of Object.keys(env)) if (name.startsWith("GIT_")) delete env[name];
  return {
    ...env,
    HOME: root,
    GIT_CONFIG_NOSYSTEM: "1",
    GIT_AUTHOR_NAME: "Deploy Test",
    GIT_AUTHOR_EMAIL: "deploy@example.test",
    GIT_COMMITTER_NAME: "Deploy Test",
    GIT_COMMITTER_EMAIL: "deploy@example.test",
  };
};
export const git = (dir: string, ...args: string[]) => execFileSync("git", ["-C", dir, ...args], { env: isolated(), encoding: "utf8", stdio: "pipe" }).trim();

export const commit = (files: Record<string, string>) => {
  for (const [path, body] of Object.entries(files)) {
    mkdirSync(dirname(join(seed(), path)), { recursive: true });
    writeFileSync(join(seed(), path), body);
  }
  git(seed(), "add", "--all");
  git(seed(), "commit", "--quiet", "-m", "change");
  return git(seed(), "rev-parse", "HEAD");
};

// Commits on main in origin and tags the result, as a merged change would be.
export const release = (tag: string, files: Record<string, string>) => {
  const sha = commit(files);
  git(seed(), "tag", tag);
  git(seed(), "push", "--quiet", "origin", "main", tag);
  return sha;
};

const writeStandIns = () => {
  const bin = join(root, "fake-bin");
  mkdirSync(bin);
  // "image inspect" answers as if an image exists unless the test says none is running yet; "compose" fails when told to.
  writeFileSync(
    join(bin, "docker"),
    `#!/bin/sh
echo "$*" >> '${dockerLog()}'
[ "$1" != compose ] || echo "\${AUDIT_RUN:-}" >> '${auditLog()}'
[ "$1 $2" != "image inspect" ] || [ -z "\${FAKE_NO_IMAGE:-}" ] || exit 1
[ "$1 $2" != "image prune" ] || [ -z "\${FAKE_PRUNE_FAILS:-}" ] || exit 1
[ "$1" != compose ] || [ -z "\${FAKE_BUILD_FAILS:-}" ]
`,
  );
  writeFileSync(join(bin, "curl"), `#!/bin/sh\necho "$*" >> '${curlLog()}'\nprintf '%s' "\${FAKE_HTTP_STATUS:-200}"\n[ "\${FAKE_HTTP_STATUS:-200}" = 200 ]\n`);
  chmodSync(join(bin, "docker"), 0o755);
  chmodSync(join(bin, "curl"), 0o755);
};

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "deploy-test-"));
  git(root, "init", "--quiet", "--bare", "--initial-branch=main", "origin.git");
  git(root, "clone", "--quiet", join(root, "origin.git"), "seed");
  git(seed(), "checkout", "--quiet", "-b", "main");
  mkdirSync(join(seed(), "bin"));
  if (existsSync(SCRIPT)) {
    copyFileSync(SCRIPT, join(seed(), "bin", "deploy"));
    chmodSync(join(seed(), "bin", "deploy"), 0o755);
  }
  commit({ "app/page.tsx": "v1\n" });
  git(seed(), "push", "--quiet", "origin", "main");
  git(root, "clone", "--quiet", join(root, "origin.git"), "server");
  writeStandIns();
});
afterEach(() => {
  vi.unstubAllEnvs();
  rmSync(root, { recursive: true, force: true });
});

type Options = { ssh?: string; status?: number; noImage?: boolean; buildFails?: boolean; pruneFails?: boolean };
const envFor = ({ ssh, status = 200, noImage = false, buildFails = false, pruneFails = false }: Options) => {
  const env: NodeJS.ProcessEnv = {
    ...isolated(),
    PATH: `${join(root, "fake-bin")}:${process.env.PATH}`,
    FAKE_HTTP_STATUS: String(status),
    DEPLOY_HEALTH_TRIES: "2",
    DEPLOY_HEALTH_INTERVAL: "0",
  };
  if (ssh !== undefined) env.SSH_ORIGINAL_COMMAND = ssh;
  if (noImage) env.FAKE_NO_IMAGE = "1";
  if (buildFails) env.FAKE_BUILD_FAILS = "1";
  if (pruneFails) env.FAKE_PRUNE_FAILS = "1";
  return env;
};
export const deploy = (args: string[] = [], options: Options = {}) => {
  const result = spawnSync(join(server(), "bin", "deploy"), args, { env: envFor(options), encoding: "utf8" });
  return { out: result.stdout ?? "", err: result.stderr ?? "", code: result.status };
};
// The deploy with its output read by `reader`, a shell command that can stop reading early, as a closed session would.
export const deployInto = (reader: string, args: string[], options: Options = {}) => {
  const result = spawnSync("sh", ["-c", `'${join(server(), "bin", "deploy")}' ${args.join(" ")} 2>&1 | ${reader}`], { env: envFor(options), encoding: "utf8" });
  return { out: result.stdout ?? "", code: result.status };
};
export const lines = (file: string) => (existsSync(file) ? readFileSync(file, "utf8").trim().split("\n") : []);
export const dockerCalls = () => lines(dockerLog());
export const curlCalls = () => lines(curlLog());
export const serverHead = () => git(server(), "rev-parse", "HEAD");
// What bin/deploy keeps for a tag on the server, under the test's HOME: its log and, once it ends, its exit status.
export const stateDir = () => join(root, ".local/state/tesla-next-deploy");
export const kept = (tag: string, kind: "log" | "result") => {
  const file = join(stateDir(), `${tag}.${kind}`);
  return existsSync(file) ? readFileSync(file, "utf8") : null;
};

export const KEEP = ["image inspect tesla-next-next:latest", "tag tesla-next-next:latest tesla-next-next:previous"];
export const BUILD = "compose up -d --build --remove-orphans";
export const TRIM = ["image prune -f", "builder prune -f --keep-storage 5GB"];
