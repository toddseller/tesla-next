// What bin/deploy keeps of each deploy on the server (deploy-on-tag spec, "The server keeps each deploy's outcome").
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { deploy, deployInto, dockerCalls, kept, release, serverHead, stateDir } from "./deploy";

describe("each deploy's outcome", () => {
  it("keeps a deploy's log and, once it ends, its exit status 0", () => {
    release("v1", { "app/page.tsx": "v2\n" });
    expect(deploy([], { ssh: "deploy v1" }).code).toBe(0);
    expect(kept("v1", "log")).toMatch(/answered 200: deployed v1/);
    expect(kept("v1", "result")).toBe("0\n");
  });

  it("keeps a failed build's or health check's status, and its error in the log", () => {
    release("v1", { "app/page.tsx": "v2\n" });
    expect(deploy(["deploy", "v1"], { buildFails: true }).code).toBe(1);
    expect(kept("v1", "result")).toBe("1\n");
    expect(kept("v1", "log")).toMatch(/did not build/);
    release("v2", { "app/page.tsx": "v3\n" });
    expect(deploy(["deploy", "v2"], { status: 502 }).code).toBe(1);
    expect(kept("v2", "result")).toBe("1\n");
  });

  it("starts a tag's log afresh when the tag is deployed again", () => {
    release("v1", { "app/page.tsx": "v2\n" });
    deploy(["deploy", "v1"]);
    expect(kept("v1", "log")).toMatch(/^Deploying v1:/m);
    deploy(["deploy", "v1"]);
    expect(kept("v1", "log")).toMatch(/^Redeploying v1/m);
    expect(kept("v1", "log")).not.toMatch(/^Deploying v1:/m);
  });

  it("finishes and keeps its whole log when the session stops reading part-way", () => {
    release("v1", { "app/page.tsx": "v2\n" });
    deployInto("head -n 1", ["deploy", "v1"]);
    expect(kept("v1", "result")).toBe("0\n");
    expect(kept("v1", "log")).toMatch(/answered 200: deployed v1/);
  });

  it("keeps nothing for a request it refuses", () => {
    expect(deploy(["deploy", "latest"]).code).toBe(2);
    expect(existsSync(stateDir())).toBe(false);
  });
});

describe("a status request", () => {
  it("answers succeeded and the log once a deploy has passed its health check", () => {
    release("v1", { "app/page.tsx": "v2\n" });
    deploy(["deploy", "v1"]);
    const result = deploy([], { ssh: "status v1" });
    expect(result.code).toBe(0);
    expect(result.out.split("\n")[0]).toBe("succeeded");
    expect(result.out).toMatch(/answered 200: deployed v1/);
  });

  it("answers failed with the deploy's exit status", () => {
    release("v1", { "app/page.tsx": "v2\n" });
    deploy(["deploy", "v1"], { status: 502 });
    expect(deploy([], { ssh: "status v1" }).out.split("\n")[0]).toBe("failed 1");
  });

  it("answers running and the log so far while a deploy has not ended", () => {
    mkdirSync(stateDir(), { recursive: true });
    writeFileSync(join(stateDir(), "v1.log"), "Deploying v1: aaaaaaa -> bbbbbbb\n");
    const result = deploy([], { ssh: "status v1" });
    expect(result.out).toBe("running\nDeploying v1: aaaaaaa -> bbbbbbb\n");
  });

  it("answers unknown for a tag never deployed, and touches neither git nor docker", () => {
    const head = serverHead();
    const result = deploy([], { ssh: "status v1999.1.1" });
    expect([result.code, result.out]).toEqual([0, "unknown\n"]);
    expect(serverHead()).toBe(head);
    expect(dockerCalls()).toEqual([]);
    expect(existsSync(stateDir())).toBe(false);
  });
});
