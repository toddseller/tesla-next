import { afterEach, expect, test, vi } from "vitest";

const forecast = vi.hoisted(() => vi.fn());
vi.mock("@/lib/forecast", async (original) => ({ ...(await original<typeof import("@/lib/forecast")>()), forecast }));
vi.mock("@/lib/scene/replay", async (original) => ({ ...(await original<typeof import("@/lib/scene/replay")>()), siteToday: () => "2026-11-10" }));
const { GET } = await import("./route");

afterEach(() => vi.useRealTimers());

test("answers the card for today, as the page renders it", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(Date.parse("2026-11-10T18:00:00Z"));
  forecast.mockResolvedValue({
    scale: { solar_kwh: 900, radiation_mj: 360, days: 30, good_day: 37 },
    rows: [{ day: "2026-11-11", radiation_mj: 13.2, weather_code: 0, fetched_at: "2026-11-10T17:20:00Z" }],
    so_far: 9.6,
    reading: { code: 3, sampled_at: "2026-11-10T17:45:00Z" },
  });
  const response = await GET();
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({
    data: { today: { day: "2026-11-10", soFar: 9.6, expected: null, code: 3, sky: "now" }, days: [{ day: "2026-11-11", expected: 33, code: 0 }], goodDay: 37, staleSince: null },
  });
  expect(forecast).toHaveBeenCalledWith("2026-11-10");
});
