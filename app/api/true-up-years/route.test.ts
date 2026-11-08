import { expect, test, vi } from "vitest";

import { siteToday } from "@/lib/scene/replay";

const trueUpYears = vi.fn();
vi.mock("@/lib/true-up/reads", () => ({ trueUpYears }));
const { GET } = await import("./route");

test("answers the true-up years through today's, as Flask's /api/v2/true_up_years", async () => {
  const years = [{ label: "'25 - '26", start_date: "2025-10-01", end_date: "2026-09-30", last_read_date: "2026-10-05", current: true }];
  trueUpYears.mockResolvedValue(years);

  const response = await GET();

  expect([response.status, await response.json()]).toEqual([200, { data: years }]);
  expect(trueUpYears).toHaveBeenCalledWith(siteToday());
});
