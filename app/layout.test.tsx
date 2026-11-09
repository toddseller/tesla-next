// The layout as the server renders it, with the live status it holds.
import { renderToString } from "react-dom/server";
import { expect, test, vi } from "vitest";

const live = vi.hoisted(() => ({ latest: vi.fn(), siteState: vi.fn(() => null as string | null) }));
vi.mock("@/lib/live", () => live);
vi.mock("next/font/google", () => ({ IBM_Plex_Sans: () => ({ variable: "sans" }), IBM_Plex_Mono: () => ({ variable: "mono" }) }));
vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

const { default: RootLayout } = await import("./layout");

test("the top bar is served with the status the server holds, before any script runs", () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(Date.parse("2026-11-08T10:00:00-08:00"));
  live.latest.mockReturnValue(JSON.stringify({ battery_percentage: 92, battery_status: "Charging", modified: "2026-11-08T09:59:20-08:00" }));

  const html = renderToString(<RootLayout><p>page</p></RootLayout>);

  expect(html).toContain("LIVE<!-- --> <!-- -->9:59 AM");
  expect(html).toContain("PW 92% · CHARGING");
  vi.useRealTimers();
});

test("before the server's first status, the bar is served with dashes", () => {
  live.latest.mockReturnValue(null);

  expect(renderToString(<RootLayout><p>page</p></RootLayout>)).toContain("PW — · —");
});

test("during an outage the bar is served with OFF GRID SINCE the stretch the server holds", () => {
  live.latest.mockReturnValue(JSON.stringify({ battery_percentage: 64, battery_status: "Discharging", island_status: "off_grid_unintentional", modified: "2026-11-08T09:59:20-08:00" }));
  live.siteState.mockReturnValue(JSON.stringify({ start: "2026-11-08T14:25:52Z", island_status: "off_grid_unintentional", storm_mode_active: false }));

  expect(renderToString(<RootLayout><p>page</p></RootLayout>)).toContain("OFF GRID SINCE 6:25 AM");
  live.siteState.mockReturnValue(null);
});
