// The Patterns page as the server renders it.
import { renderToString } from "react-dom/server";
import { afterEach, expect, test, vi } from "vitest";

import { PATTERNS } from "@/components/patterns/fixtures";

vi.mock("@/lib/patterns", async (original) => ({ ...(await original<typeof import("@/lib/patterns")>()), patterns: async () => PATTERNS }));
const { default: Page } = await import("./page");

afterEach(() => vi.useRealTimers());

test("the first response holds the three sections and their figures, in order", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(Date.parse("2026-11-10T20:00:00Z"));
  const html = renderToString(await Page());
  expect(html).toContain("<h1");
  expect(html).toContain(">Patterns<");
  for (const text of ["November so far", "864 W", "November in each year", "Cycles in 2026", "4,416 kWh"]) expect(html).toContain(text);
  const order = ["Always-on load", "When the house uses power", "Powerwall use"].map((title) => html.indexOf(title));
  expect(order.every((at, i) => at > 0 && (i === 0 || at > order[i - 1]))).toBe(true);
});
