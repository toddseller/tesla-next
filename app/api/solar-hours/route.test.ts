// GET /api/solar-hours?year= (home-story spec, "The year switcher"): a year's solar by day and hour for the switcher.
import { expect, test, vi } from "vitest";

const solarHours = vi.hoisted(() => vi.fn());
vi.mock("@/lib/home/solar-hours", () => ({ solarHours }));
vi.mock("@/lib/scene/replay", async (original) => ({ ...(await original<typeof import("@/lib/scene/replay")>()), siteToday: () => "2026-11-21" }));
const { GET } = await import("./route");

const get = (query: string) => GET(new Request(`http://localhost/api/solar-hours${query}`));

test("answers the year's days for today", async () => {
  const days = [{ day: "2023-06-13", kwh: Array(24).fill(0) }];
  solarHours.mockResolvedValue(days);
  const response = await get("?year=2023");
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ data: days });
  expect(solarHours).toHaveBeenCalledWith(2023, "2026-11-21");
});

test.each(["", "?year=", "?year=2020", "?year=2027", "?year=twenty", "?year=2023.5"])("refuses %s with 400", async (query) => {
  solarHours.mockClear();
  const response = await get(query);
  expect(response.status).toBe(400);
  expect((await response.json()).message).toMatch(/year/);
  expect(solarHours).not.toHaveBeenCalled();
});
