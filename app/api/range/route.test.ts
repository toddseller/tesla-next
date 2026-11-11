import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { shiftDay, siteToday } from "@/lib/scene/replay";

const rangeTotals = vi.fn();
vi.mock("@/lib/range", () => ({ rangeTotals }));
const { GET } = await import("./route");

async function get(query: string) {
  const response = await GET(new Request(`http://localhost/api/range${query}`));
  return { status: response.status, body: await response.json() };
}

beforeEach(() => rangeTotals.mockResolvedValue([{ date: "Oct 14", day: "2026-10-14", solar: 44.4, grid: -8.3, house: 34.0 }]));
afterEach(() => rangeTotals.mockReset());

test("a valid range answers with its items", async () => {
  expect(await get("?start_date=2026-10-01&end_date=2026-10-31")).toEqual({
    status: 200,
    body: { data: [{ date: "Oct 14", day: "2026-10-14", solar: 44.4, grid: -8.3, house: 34.0 }] },
  });
  expect(rangeTotals).toHaveBeenCalledWith("2026-10-01", "2026-10-31", "corrected");
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
  expect(rangeTotals).not.toHaveBeenCalled();
});

test("a range before the site existed names the first day", async () => {
  const { status, body } = await get("?start_date=1900-01-01&end_date=2026-10-31");
  expect(status).toBe(400);
  expect(body.message).toContain("2021-10-01");
  expect(rangeTotals).not.toHaveBeenCalled();
});

test("the last day served is 732 days after today; the next is refused", async () => {
  const last = shiftDay(siteToday(), 732);
  expect((await get(`?start_date=2026-10-01&end_date=${last}`)).status).toBe(200);
  const { status, body } = await get(`?start_date=2026-10-01&end_date=${shiftDay(last, 1)}`);
  expect(status).toBe(400);
  expect(body.message).toContain(last);
});

// meter-correction: readings=tesla answers with Tesla's figures; anything else corrected.
test("readings=tesla asks for Tesla's figures", async () => {
  await get("?start_date=2026-10-01&end_date=2026-10-31&readings=tesla");
  expect(rangeTotals).toHaveBeenLastCalledWith("2026-10-01", "2026-10-31", "tesla");
  await get("?start_date=2026-10-01&end_date=2026-10-31&readings=other");
  expect(rangeTotals).toHaveBeenLastCalledWith("2026-10-01", "2026-10-31", "corrected");
});
