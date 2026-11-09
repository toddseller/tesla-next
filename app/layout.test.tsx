// The layout as the server renders it, with the live status it holds.
import { renderToString } from "react-dom/server";
import { expect, test, vi } from "vitest";

const live = vi.hoisted(() => ({ latest: vi.fn() }));
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
