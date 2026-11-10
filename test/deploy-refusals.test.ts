import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { deploy, dockerCalls, release, serverHead } from "./deploy";

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
