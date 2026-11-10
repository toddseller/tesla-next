// /api/checks (system-checks spec): one plain-text line per check for the server's weekly run.
import { expect, test, vi } from "vitest";

import { siteToday } from "@/lib/scene/replay";

const allChecks = vi.fn(async () => ["FAIL meter: Nov 1 – 7, 2026, Tesla's imports are 48% of PG&E's meter (58 of 120 kWh)", "ok meter readings: PG&E's readings run to November 7, 2026", "ok solar output: too few days"]);
vi.mock("@/lib/checks", () => ({ allChecks }));
const { GET } = await import("./route");

test("each check's line, in plain text, for today at the site", async () => {
  const response = await GET();
  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toMatch(/^text\/plain/);
  expect((await response.text()).split("\n")).toEqual([...(await allChecks()), ""]);
  expect(allChecks).toHaveBeenCalledWith(siteToday());
});
