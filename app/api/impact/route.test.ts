import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { shiftDay, siteToday } from "@/lib/scene/replay";

const impactFigures = vi.fn();
vi.mock("@/lib/impact", () => ({ impactFigures }));
const { GET } = await import("./route");

// October 18, 2026 from the impact-report spec, its kWh by source worked out from the shares.
const OCTOBER_18 = {
  from_solar_percentage: 48, from_powerwall_percentage: 52, from_grid_percentage: 0, self_powered_percentage: 100,
  total_solar_percentage: 77, total_solar: 23.8, from_solar: 14.8, from_powerwall: 16.0, from_grid: 0, total_house: 30.8,
};

async function get(query: string) {
  const response = await GET(new Request(`http://localhost/api/impact${query}`));
  return { status: response.status, body: await response.json() };
}

beforeEach(() => impactFigures.mockResolvedValue(OCTOBER_18));
afterEach(() => impactFigures.mockReset());

test("a valid range answers with its figures", async () => {
  expect(await get("?start_date=2026-10-18&end_date=2026-10-18")).toEqual({ status: 200, body: { data: OCTOBER_18 } });
  expect(impactFigures).toHaveBeenCalledWith("2026-10-18", "2026-10-18", "corrected");
});

test.each([
  ["", "start_date"],
  ["?start_date=2026-10-01", "end_date"],
  ["?start_date=nope&end_date=2026-01-31", "start_date"],
  ["?start_date=2026-02-30&end_date=2026-03-31", "start_date"],
])("%s is refused without a query", async (query, named) => {
  const { status, body } = await get(query);
  expect(status).toBe(400);
  expect(body.message).toContain(named);
  expect(impactFigures).not.toHaveBeenCalled();
});

test("a range before the site existed names the first day", async () => {
  const { status, body } = await get("?start_date=1900-01-01&end_date=2026-10-31");
  expect(status).toBe(400);
  expect(body.message).toContain("2021-10-01");
  expect(impactFigures).not.toHaveBeenCalled();
});

test("the last day served is 732 days after today; the next is refused", async () => {
  const last = shiftDay(siteToday(), 732);
  expect((await get(`?start_date=2026-10-01&end_date=${last}`)).status).toBe(200);
  const { status, body } = await get(`?start_date=2026-10-01&end_date=${shiftDay(last, 1)}`);
  expect(status).toBe(400);
  expect(body.message).toContain(last);
});

// meter-correction: readings=tesla answers with Tesla's figures.
test("readings=tesla asks for Tesla's figures", async () => {
  await get("?start_date=2025-10-01&end_date=2025-10-31&readings=tesla");
  expect(impactFigures).toHaveBeenLastCalledWith("2025-10-01", "2025-10-31", "tesla");
});
