// The Top Ten page as the server renders it.
import { renderToString } from "react-dom/server";
import { afterEach, expect, test, vi } from "vitest";

import { TOP_TEN, WITHOUT_VPP } from "@/components/top-ten/fixtures";

vi.mock("next/navigation", () => ({ useRouter: () => ({}) }));
vi.mock("@/lib/top-ten", () => ({ topTen: async (withVpp: boolean) => (withVpp ? TOP_TEN : WITHOUT_VPP) }));
const { default: Page } = await import("./page");
const served = async (vpp?: string) => renderToString(await Page({ searchParams: Promise.resolve(vpp ? { vpp } : {}) }));

afterEach(() => vi.useRealTimers());

test("the first response holds the three records and their runners-up", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(Date.parse("2026-11-08T20:00:00Z"));
  const html = await served("with");
  for (const text of ["Best solar day", "Monday, June 13, 2022", "4 years, 4 months", "Best export day", "Thursday, May 30, 2024", "Best export month", "May 2024", "2 years, 5 months"])
    expect(html).toContain(text);
  for (const runnerUp of ["Jun 21, 2025", "Jul 5, 2024", "Apr 2024", "Jul 2026"]) expect(html).toContain(runnerUp);
});

test("/top and an unknown vpp are served without VPP days, vpp=with with them", async () => {
  for (const html of [await served(), await served("junk")]) {
    expect(html).not.toContain("Thursday, May 30, 2024");
    expect(html).toContain("Wednesday, May 21, 2025");
  }
  expect(await served("with")).toContain("Thursday, May 30, 2024");
});
