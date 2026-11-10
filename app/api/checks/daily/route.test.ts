// /api/checks/daily (system-checks spec): the solar peak check's line for the server's daily run.
import { expect, test, vi } from "vitest";

import { siteToday } from "@/lib/scene/replay";

const line = "FAIL solar peak: April 13, 2026's peak was 52% of the usual bright-day peak (4.4 of 8.4 kW)";
const peakCheck = vi.fn(async () => line);
vi.mock("@/lib/checks", () => ({ peakCheck }));
const { GET } = await import("./route");

test("the solar peak line, in plain text, for today at the site", async () => {
  const response = await GET();
  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toMatch(/^text\/plain/);
  expect(await response.text()).toBe(`${line}\n`);
  expect(peakCheck).toHaveBeenCalledWith(siteToday());
});
