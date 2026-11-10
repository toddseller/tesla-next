import { rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { commit, deploy, dockerCalls, dockerLog, git, release, seed, server, serverHead } from "./deploy";

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
