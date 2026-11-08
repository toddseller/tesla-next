// The page as the server renders it: no browser, no stream yet, only the status the server holds.
import { renderToString } from "react-dom/server";
import { beforeEach, expect, test, vi } from "vitest";

const live = vi.hoisted(() => ({ current: null as string | null }));
vi.mock("@/lib/live", () => ({ latest: () => live.current }));

const { default: Page } = await import("./page");

const served = async (searchParams: Record<string, string> = {}) => renderToString(await Page({ searchParams: Promise.resolve(searchParams) }));

beforeEach(() => {
  live.current = null;
});

test("with a status, the served labels show its values", async () => {
  live.current = JSON.stringify({
    load_power: 4.1, home_power: 4.1, solar_power: 6.1, grid_power: 2.0, battery_power: 0, battery_percentage: 100,
    battery_status: "Standby", modified: new Date().toISOString(), vehicle: null, weather: null,
  });
  const html = await served();
  expect(html).toContain("6.1 kW");
  expect(html).toContain("100%");
  expect(html).not.toContain("—");
});

test("before the server's first status, the served labels show dashes", async () => {
  const html = await served();
  expect(html).toContain('data-part="label-solar"');
  expect(html).toContain("—");
  expect(html).not.toContain(" kW");
});

test("a shared moment is served as that replay", async () => {
  const html = await served({ at: "2026-10-19T18:35" });
  expect(html).toContain('data-part="replay-tag"');
});
