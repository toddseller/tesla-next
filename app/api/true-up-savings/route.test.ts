import { afterEach, expect, test, vi } from "vitest";

import { shiftDay, siteToday } from "@/lib/scene/replay";

const trueUpSavings = vi.fn();
vi.mock("@/lib/true-up/savings", () => ({ trueUpSavings }));
const { GET } = await import("./route");

async function get(query: string) {
  const response = await GET(new Request(`http://localhost/api/true-up-savings${query}`));
  return { status: response.status, body: await response.json() };
}

afterEach(() => trueUpSavings.mockReset());

test("a true-up year answers with its savings", async () => {
  const data = {
    solar_saved: 2289.45, powerwalls_added: 215.65, powerwalls_held: -20.1, powerwalls_used: 235.75, held_days: 40, used_days: 325,
    peak_only: { pge: 600, westlight: 150, total: 750 }, efficiency: 0.86, through: "2025-10-02",
  };
  trueUpSavings.mockResolvedValue(data);

  expect(await get("?start_date=2024-10-01&end_date=2025-09-30")).toEqual({ status: 200, body: { data } });
  expect(trueUpSavings).toHaveBeenCalledWith("2024-10-01", "2025-09-30");
});

test("'23 - '24 answers its savings, marked as priced at estimated rates", async () => {
  trueUpSavings.mockResolvedValue({ solar_saved: 5_000, estimated_rates: true });

  expect(await get("?start_date=2023-10-01&end_date=2024-09-30")).toEqual({ status: 200, body: { data: { solar_saved: 5_000, estimated_rates: true } } });
  expect(trueUpSavings).toHaveBeenCalledWith("2023-10-01", "2024-09-30");
});

test("a range without savings answers null", async () => {
  trueUpSavings.mockResolvedValue(null);

  expect(await get("?start_date=2025-01-01&end_date=2025-12-31")).toEqual({ status: 200, body: { data: null } });
});

test.each([
  ["", "start_date"],
  ["?start_date=2024-13-01&end_date=2025-09-30", "start_date"],
  ["?start_date=2024-10-01", "end_date"],
  ["?start_date=1900-01-01&end_date=2025-09-30", "2021-10-01"],
  [`?start_date=2025-10-01&end_date=${shiftDay(siteToday(), 733)}`, shiftDay(siteToday(), 732)],
])("%s is refused without a query", async (query, named) => {
  const { status, body } = await get(query);
  expect(status).toBe(400);
  expect(body.message).toContain(named);
  expect(trueUpSavings).not.toHaveBeenCalled();
});
