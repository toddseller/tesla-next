// /api/car-charging (car-charging spec): the Home car charging section's figures, for /api/impact's ranges.
import { afterEach, expect, test, vi } from "vitest";

import { siteToday } from "@/lib/scene/replay";

const carCharging = vi.fn();
vi.mock("@/lib/car-charging", () => ({ carCharging }));
const { GET } = await import("./route");

const FIGURES = {
  since: null, cars_since: null, total_kwh: 10, solar_kwh: 0, powerwall_kwh: 6, grid_kwh: 4,
  solar_percentage: 0, powerwall_percentage: 60, grid_percentage: 40, off_grid_percentage: 60,
  cars: [{ name: "R2D2", kwh: 10, solar_percentage: 0, powerwall_percentage: 60, grid_percentage: 40 }],
};

async function get(query: string) {
  const response = await GET(new Request(`http://localhost/api/car-charging${query}`));
  return { status: response.status, body: await response.json() };
}

afterEach(() => carCharging.mockReset());

test("a valid range answers with its figures, counted up to today", async () => {
  carCharging.mockResolvedValue(FIGURES);
  expect(await get("?start_date=2026-11-01&end_date=2026-11-09")).toEqual({ status: 200, body: { data: FIGURES } });
  expect(carCharging).toHaveBeenCalledWith("2026-11-01", "2026-11-09", siteToday());
});

test("with no charging stored at all, it answers null", async () => {
  carCharging.mockResolvedValue(null);
  expect(await get("?start_date=2024-03-01&end_date=2024-03-31")).toEqual({ status: 200, body: { data: null } });
});

test.each(["", "?start_date=2026-11-01", "?start_date=2021-09-30&end_date=2021-10-01", "?start_date=nope&end_date=2026-11-09"])(
  "%s is 400 with a message",
  async (query) => {
    const { status, body } = await get(query);
    expect(status).toBe(400);
    expect(typeof body.message).toBe("string");
    expect(carCharging).not.toHaveBeenCalled();
  },
);
