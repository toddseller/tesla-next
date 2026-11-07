import { execFileSync, spawnSync } from "node:child_process";
import { chmodSync, copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Runs bin/deploy against a throwaway origin and server checkout, with docker and curl replaced by recorders, so
// every decision the script makes can be checked without touching the real server. Ported from Myflix's deploy test.
const SCRIPT = join(import.meta.dirname, "../bin/deploy");

vi.setConfig({ testTimeout: 20000 });

let root: string;
const seed = () => join(root, "seed");
const server = () => join(root, "server");
const dockerLog = () => join(root, "docker.log");
const auditLog = () => join(root, "audit.log");
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
const git = (dir: string, ...args: string[]) => execFileSync("git", ["-C", dir, ...args], { env: isolated(), encoding: "utf8", stdio: "pipe" }).trim();

const commit = (files: Record<string, string>) => {
  for (const [path, body] of Object.entries(files)) {
    mkdirSync(dirname(join(seed(), path)), { recursive: true });
    writeFileSync(join(seed(), path), body);
  }
  git(seed(), "add", "--all");
  git(seed(), "commit", "--quiet", "-m", "change");
  return git(seed(), "rev-parse", "HEAD");
};

// Commits on main in origin and tags the result, as a merged change would be.
const release = (tag: string, files: Record<string, string>) => {
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
const deploy = (args: string[] = [], { ssh, status = 200, noImage = false, buildFails = false, pruneFails = false }: Options = {}) => {
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
  const result = spawnSync(join(server(), "bin", "deploy"), args, { env, encoding: "utf8" });
  return { out: result.stdout ?? "", err: result.stderr ?? "", code: result.status };
};
const lines = (file: string) => (existsSync(file) ? readFileSync(file, "utf8").trim().split("\n") : []);
const dockerCalls = () => lines(dockerLog());
const curlCalls = () => lines(curlLog());
const serverHead = () => git(server(), "rev-parse", "HEAD");

const KEEP = ["image inspect tesla-next-next:latest", "tag tesla-next-next:latest tesla-next-next:previous"];
const BUILD = "compose up -d --build --remove-orphans";
const TRIM = ["image prune -f", "builder prune -f --keep-storage 5GB"];

it("keeps its git commands out of the repository a pre-commit hook runs it from", () => {
  // git hands hooks an absolute GIT_INDEX_FILE for `git commit <paths>`; inherited, it would stage the test's files there.
  const outside = join(mkdtempSync(join(tmpdir(), "deploy-test-index-")), "index");
  vi.stubEnv("GIT_INDEX_FILE", outside);
  release("v1", { "app/page.tsx": "v2\n" });
  expect(deploy(["deploy", "v1"]).code).toBe(0);
  expect(existsSync(outside)).toBe(false);
  rmSync(dirname(outside), { recursive: true, force: true });
});

describe("a request it does not accept", () => {
  let head: string;
  beforeEach(() => {
    release("v1", { "app/page.tsx": "v2\n" });
    head = serverHead();
  });
  afterEach(() => {
    expect(serverHead()).toBe(head);
    expect(dockerCalls()).toEqual([]);
  });

  it("refuses no request at all", () => {
    expect(deploy().code).toBe(2);
  });

  it("refuses a verb other than deploy", () => {
    expect(deploy(["rollback", "v1"]).code).toBe(2);
  });

  it("refuses something that is not a version tag", () => {
    const result = deploy(["deploy", "v1; rm -rf ~"]);
    expect(result.code).toBe(2);
    expect(result.err).toMatch(/not a version tag/);
  });

  it("refuses extra words after the tag over SSH", () => {
    expect(deploy([], { ssh: "deploy v1 now" }).code).toBe(2);
  });

  it("takes the request from SSH over its arguments", () => {
    expect(deploy(["deploy", "v1"], { ssh: "shell" }).code).toBe(2);
  });
});

describe("a server or tag it should not move to", () => {
  it("refuses when a tracked file was changed on the server", () => {
    release("v1", { "app/page.tsx": "v2\n" });
    writeFileSync(join(server(), "app/page.tsx"), "edited\n");
    const result = deploy(["deploy", "v1"]);
    expect(result.code).toBe(1);
    expect(result.err).toMatch(/uncommitted changes/);
    expect(dockerCalls()).toEqual([]);
  });

  it("refuses when the server is not on main", () => {
    release("v1", { "app/page.tsx": "v2\n" });
    git(server(), "checkout", "--quiet", "-b", "other");
    expect(deploy(["deploy", "v1"]).code).toBe(1);
    expect(dockerCalls()).toEqual([]);
  });

  it("refuses a tag that is not on main", () => {
    git(seed(), "checkout", "--quiet", "-b", "feature");
    commit({ "app/page.tsx": "feature\n" });
    git(seed(), "tag", "v9");
    git(seed(), "push", "--quiet", "origin", "v9");
    const head = serverHead();
    const result = deploy(["deploy", "v9"]);
    expect(result.code).toBe(1);
    expect(result.err).toMatch(/not on main/);
    expect(serverHead()).toBe(head);
    expect(dockerCalls()).toEqual([]);
  });

  it("refuses a tag that does not exist", () => {
    expect(deploy(["deploy", "v404"]).code).toBe(1);
    expect(dockerCalls()).toEqual([]);
  });

  it("refuses a tag behind the server", () => {
    release("v1", { "app/page.tsx": "v2\n" });
    const v2 = release("v2", { "app/page.tsx": "v3\n" });
    expect(deploy(["deploy", "v2"]).code).toBe(0);
    rmSync(dockerLog(), { force: true });
    const result = deploy(["deploy", "v1"]);
    expect(result.code).toBe(1);
    expect(result.err).toMatch(/behind/);
    expect(serverHead()).toBe(v2);
    expect(dockerCalls()).toEqual([]);
  });

  it("refuses a tag that was moved after the server fetched it", () => {
    const v1 = release("v1", { "app/page.tsx": "v2\n" });
    expect(deploy(["deploy", "v1"]).code).toBe(0);
    rmSync(dockerLog(), { force: true });
    commit({ "app/page.tsx": "moved\n" });
    git(seed(), "tag", "--force", "v1");
    git(seed(), "push", "--quiet", "--force", "origin", "main", "v1");
    expect(deploy(["deploy", "v1"]).code).toBe(1);
    expect(serverHead()).toBe(v1);
    expect(dockerCalls()).toEqual([]);
  });
});

describe("a deploy", () => {
  it("fast-forwards main to the tag, keeps the running image as previous, rebuilds, then trims the cache", () => {
    const v1 = release("v1", { "app/page.tsx": "v2\n" });
    const result = deploy(["deploy", "v1"]);
    expect(result.code).toBe(0);
    expect(serverHead()).toBe(v1);
    expect(dockerCalls()).toEqual([...KEEP, BUILD, ...TRIM]);
    expect(result.out).toMatch(new RegExp(`Deploying v1: \\w{7} -> ${v1.slice(0, 7)}`));
    expect(result.out).toMatch(/Disk: .* free of /);
  });

  it("gives every build a new audit run, so the audit checks today's advisories", () => {
    release("v1", { "app/page.tsx": "v2\n" });
    deploy(["deploy", "v1"]);
    expect(lines(auditLog())).toEqual([expect.stringMatching(/^\d+$/)]);
  });

  it("builds without keeping a previous image when none is running yet", () => {
    release("v1", { "app/page.tsx": "v2\n" });
    expect(deploy(["deploy", "v1"], { noImage: true }).code).toBe(0);
    expect(dockerCalls()).toEqual([KEEP[0], BUILD, ...TRIM]);
  });

  it("redeploys the tag the server is already on without moving it", () => {
    const v1 = release("v1", { "app/page.tsx": "v2\n" });
    deploy(["deploy", "v1"]);
    rmSync(dockerLog(), { force: true });
    const result = deploy(["deploy", "v1"]);
    expect(result.code).toBe(0);
    expect(serverHead()).toBe(v1);
    // The running image is this release's, so tagging it would replace the release before it as the rollback.
    expect(dockerCalls()).toEqual([BUILD, ...TRIM]);
    expect(result.out).toMatch(/Redeploying v1/);
  });

  it("ignores untracked files such as .env", () => {
    release("v1", { "app/page.tsx": "v2\n" });
    writeFileSync(join(server(), ".env"), "local\n");
    expect(deploy(["deploy", "v1"]).code).toBe(0);
  });

  it("deploys the tag named over SSH", () => {
    const v1 = release("v1", { "app/page.tsx": "v2\n" });
    expect(deploy([], { ssh: "deploy v1" }).code).toBe(0);
    expect(serverHead()).toBe(v1);
  });

  it("fails without checking the site or trimming when the build fails", () => {
    release("v1", { "app/page.tsx": "v2\n" });
    const result = deploy(["deploy", "v1"], { buildFails: true });
    expect(result.code).toBe(1);
    expect(result.err).toMatch(/did not build/);
    expect(dockerCalls()).toEqual([...KEEP, BUILD]);
    expect(curlCalls()).toEqual([]);
  });

  it("succeeds when the site answers 200, checking next.teslasolar.report by default", () => {
    release("v1", { "app/page.tsx": "v2\n" });
    const result = deploy(["deploy", "v1"]);
    expect(result.code).toBe(0);
    expect(curlCalls()).toHaveLength(1);
    expect(curlCalls()[0]).toMatch(/https:\/\/next\.teslasolar\.report\//);
    expect(result.out).toMatch(/answered 200: deployed v1/);
  });

  it("still succeeds when the image prune fails after the site answers", () => {
    release("v1", { "app/page.tsx": "v2\n" });
    const result = deploy(["deploy", "v1"], { pruneFails: true });
    expect(result.code).toBe(0);
    expect(result.out).toMatch(/warning: image prune failed/);
  });

  it("fails when the site keeps answering something else, and leaves the cache alone", () => {
    release("v1", { "app/page.tsx": "v2\n" });
    const result = deploy(["deploy", "v1"], { status: 502 });
    expect(result.code).toBe(1);
    expect(curlCalls()).toHaveLength(2);
    expect(result.err).toMatch(/answered 502 after 2 tries/);
    expect(dockerCalls()).toEqual([...KEEP, BUILD]);
  });
});
