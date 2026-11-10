import { rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { auditLog, BUILD, deploy, dockerCalls, dockerLog, KEEP, lines, release, server, serverHead, TRIM } from "./deploy";

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
});
