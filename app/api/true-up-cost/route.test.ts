import { afterEach, expect, test, vi } from "vitest";

import { shiftDay, siteToday } from "@/lib/scene/replay";

const trueUpCost = vi.fn();
vi.mock("@/lib/true-up/cost", () => ({ trueUpCost }));
const { GET } = await import("./route");

async function get(query: string) {
  const response = await GET(new Request(`http://localhost/api/true-up-cost${query}`));
  return { status: response.status, body: await response.json() };
}

afterEach(() => trueUpCost.mockReset());

test("a valid range answers with its dollars as of today", async () => {
  const data = { amount_due: 767.73, source: "statement", rates_effective: "2026-06-01" };
  trueUpCost.mockResolvedValue(data);

  expect(await get("?start_date=2025-10-01&end_date=2026-09-30")).toEqual({ status: 200, body: { data } });
  expect(trueUpCost).toHaveBeenCalledWith("2025-10-01", "2026-09-30", siteToday());
});

test.each([
  ["", "start_date"],
  ["?start_date=2025-10-01", "end_date"],
  ["?start_date=2025-10-01&end_date=nope", "end_date"],
  ["?start_date=1900-01-01&end_date=2026-09-30", "2021-10-01"],
  [`?start_date=2025-10-01&end_date=${shiftDay(siteToday(), 733)}`, shiftDay(siteToday(), 732)],
])("%s is refused without a query", async (query, named) => {
  const { status, body } = await get(query);
  expect(status).toBe(400);
  expect(body.message).toContain(named);
  expect(trueUpCost).not.toHaveBeenCalled();
});
