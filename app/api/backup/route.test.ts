import { expect, test, vi } from "vitest";

const history = vi.hoisted(() => vi.fn(async (range: { start: string; end: string }) => ({ range })));
vi.mock("@/lib/backup", () => ({ backupHistory: history }));
vi.mock("@/lib/scene/replay", () => ({ siteToday: () => "2026-11-09" }));
const { GET } = await import("./route");

const data = async (query: string) => {
  const response = await GET(new Request(`http://next/api/backup${query}`));
  expect(response.status).toBe(200);
  return (await response.json()).data;
};

test("answers the year asked for", async () => {
  expect(await data("?year=23-24")).toEqual({ range: { start: "2023-10-01", end: "2024-09-30" } });
});

test("all is every year", async () => {
  expect(await data("?year=all")).toEqual({ range: { start: "2021-10-01", end: "2027-09-30" } });
});

test("no year, or any other value, is this true-up year", async () => {
  expect(await data("")).toEqual({ range: { start: "2026-10-01", end: "2027-09-30" } });
  expect(await data("?year=1999")).toEqual({ range: { start: "2026-10-01", end: "2027-09-30" } });
});
