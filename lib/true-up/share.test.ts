import { beforeEach, expect, test, vi } from "vitest";

const impactFigures = vi.hoisted(() => vi.fn());
vi.mock("@/lib/impact", () => ({ impactFigures }));

import { cyclesShare } from "./share";

const cycle = (first_day: string, through: string | null, net: number | null) => ({ first_day, through, net });

beforeEach(() => impactFigures.mockReset().mockResolvedValue({ total_solar_percentage: 96, total_house: 1 }));

// true-up-tracker, "The range explained": the share and the days it covers, the started cycles' own, from no earlier than
// the first day of data.
test("the share comes with the started cycles' days", async () => {
  expect(await cyclesShare([cycle("2026-02-05", "2026-03-06", 50), cycle("2026-03-07", "2026-04-06", 70.4), cycle("2026-04-07", null, null)]))
    .toEqual({ share: 96, start: "2026-02-05", end: "2026-04-06" });
  expect(impactFigures).toHaveBeenCalledWith("2026-02-05", "2026-04-06", "corrected");
});

test("the days start no earlier than October 10, 2021", async () => {
  expect((await cyclesShare([cycle("2021-10-06", "2021-11-04", 10)]))?.start).toBe("2021-10-10");
});

test("no house use, or no started cycle, gives nothing", async () => {
  expect(await cyclesShare([cycle("2026-10-05", null, null)])).toBeNull();
  impactFigures.mockResolvedValue({ total_solar_percentage: 0, total_house: 0 });
  expect(await cyclesShare([cycle("2026-10-05", "2026-10-06", 1)])).toBeNull();
});
