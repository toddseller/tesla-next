// The Health page as the server renders it.
import { renderToString } from "react-dom/server";
import { afterEach, expect, test, vi } from "vitest";

import { HEALTH } from "@/components/health/fixtures";

vi.mock("@/lib/health", async (original) => ({ ...(await original<typeof import("@/lib/health")>()), health: async () => HEALTH }));
const { default: Page } = await import("./page");

afterEach(() => vi.useRealTimers());

test("the first response holds both sections and their figures, always-on load first", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(Date.parse("2026-11-10T20:00:00Z"));
  const html = renderToString(await Page());
  expect(html).toContain("<h1");
  expect(html).toContain(">Health<");
  for (const text of ["November so far", "864 W", "November in each year", "Cycles in 2026", "4,416 kWh"]) expect(html).toContain(text);
  expect(html.indexOf("Always-on load")).toBeLessThan(html.indexOf("Powerwall use"));
});
