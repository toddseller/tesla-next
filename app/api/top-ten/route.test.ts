import { expect, test, vi } from "vitest";

const TOP_TEN = [
  { solar: [{ date: "Jun 13, 2022", solar: 80.9, day: "2022-06-13" }] },
  { net_grid: [{ date: "May 30, 2024", net_grid: -60.0, day: "2024-05-30" }] },
  { to_grid_months: [{ date: "May 2024", net_grid: -510.1, month: "2024-05" }] },
];
const WITHOUT_VPP = [
  TOP_TEN[0],
  { net_grid: [{ date: "May 21, 2025", net_grid: -45.9, day: "2025-05-21" }] },
  { to_grid_months: [{ date: "May 2024", net_grid: -450.1, month: "2024-05" }] },
];
vi.mock("@/lib/top-ten", () => ({ topTen: async (withVpp: boolean) => (withVpp ? TOP_TEN : WITHOUT_VPP) }));
const { GET } = await import("./route");

test("leaves VPP days out of the export rankings by default, as the page does", async () => {
  const response = await GET(new Request("http://next/api/top-ten"));
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ data: WITHOUT_VPP });
});

test("?vpp=with includes VPP days", async () => {
  expect(await (await GET(new Request("http://next/api/top-ten?vpp=with"))).json()).toEqual({ data: TOP_TEN });
});

test("?vpp=without answers as no parameter does", async () => {
  expect(await (await GET(new Request("http://next/api/top-ten?vpp=without"))).json()).toEqual({ data: WITHOUT_VPP });
});
