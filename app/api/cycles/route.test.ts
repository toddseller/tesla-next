import { afterEach, expect, test, vi } from "vitest";

import { shiftDay, siteToday } from "@/lib/scene/replay";

const cycleRows = vi.fn();
vi.mock("@/lib/true-up/cost", () => ({ cycleRows }));
const { GET } = await import("./route");

async function get(query: string) {
  const response = await GET(new Request(`http://localhost/api/cycles${query}`));
  return { status: response.status, body: await response.json() };
}

afterEach(() => cycleRows.mockReset());

test("a valid range answers with its cycles, as Flask's /api/v2/sheet", async () => {
  const row = { first_day: "2025-10-03", last_day: "2025-11-03", true_up: "'25 - '26", net: 364, nem_charges: 113.41, nem_source: "statement" };
  cycleRows.mockResolvedValue([row]);

  expect(await get("?start_date=2025-10-01&end_date=2026-09-30")).toEqual({ status: 200, body: { data: [row] } });
  expect(cycleRows).toHaveBeenCalledWith("2025-10-01", "2026-09-30");
});

test.each([
  ["", "start_date"],
  ["?start_date=2025-10-01", "end_date"],
  ["?start_date=nope&end_date=2026-09-30", "start_date"],
  ["?start_date=1900-01-01&end_date=2026-09-30", "2021-10-01"],
  [`?start_date=2025-10-01&end_date=${shiftDay(siteToday(), 733)}`, shiftDay(siteToday(), 732)],
])("%s is refused without a query", async (query, named) => {
  const { status, body } = await get(query);
  expect(status).toBe(400);
  expect(body.message).toContain(named);
  expect(cycleRows).not.toHaveBeenCalled();
});
