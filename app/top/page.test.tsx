// The Top Ten page as the server renders it.
import { renderToString } from "react-dom/server";
import { afterEach, expect, test, vi } from "vitest";

import { TOP_TEN } from "@/components/top-ten/fixtures";

vi.mock("@/lib/top-ten", () => ({ topTen: async () => TOP_TEN }));
const { default: Page } = await import("./page");

afterEach(() => vi.useRealTimers());

test("the first response holds the three records and their runners-up", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(Date.parse("2026-11-08T20:00:00Z"));
  const html = renderToString(await Page());
  for (const text of ["Best solar day", "Monday, June 13, 2022", "4 years, 4 months", "Best export day", "Thursday, May 30, 2024", "Best export month", "May 2024", "2 years, 5 months"])
    expect(html).toContain(text);
  for (const runnerUp of ["Jun 21, 2025", "Jul 5, 2024", "Apr 2024", "Jul 2026"]) expect(html).toContain(runnerUp);
});
