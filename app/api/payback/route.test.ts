import { expect, test, vi } from "vitest";

const payback = vi.hoisted(() => vi.fn());
vi.mock("@/lib/true-up/payback", () => ({ payback }));
vi.mock("@/lib/scene/replay", () => ({ siteToday: () => "2026-11-09" }));
const { GET } = await import("./route");

test("answers the years for today", async () => {
  const years = { solar: { year: 2025, projected: false, estimated: true } };
  payback.mockResolvedValue(years);
  const response = await GET();
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ data: years });
  expect(payback).toHaveBeenCalledWith("2026-11-09");
});

test("without a costs file it answers null", async () => {
  payback.mockResolvedValue(null);
  expect(await (await GET()).json()).toEqual({ data: null });
});
