import { describe, expect, it } from "vitest";

import { BUILD, curlCalls, deploy, dockerCalls, KEEP, release, serverHead } from "./deploy";

describe("a deploy", () => {
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

  it("succeeds when the site answers 200, checking teslasolar.report by default", () => {
    release("v1", { "app/page.tsx": "v2\n" });
    const result = deploy(["deploy", "v1"]);
    expect(result.code).toBe(0);
    expect(curlCalls()).toHaveLength(1);
    expect(curlCalls()[0]).toMatch(/https:\/\/teslasolar\.report\//);
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
