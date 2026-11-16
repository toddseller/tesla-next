// The layout as the server renders it, with the live status it holds.
import { renderToString } from "react-dom/server";
import { expect, test, vi } from "vitest";
import { useUnits } from "@/components/units";

const live = vi.hoisted(() => ({ latest: vi.fn(), siteState: vi.fn(() => null as string | null) }));
vi.mock("@/lib/live", () => live);
const request = vi.hoisted(() => ({ headers: {} as Record<string, string> }));
vi.mock("next/headers", () => ({ headers: async () => new Headers(request.headers) }));
vi.mock("next/font/google", () => ({ IBM_Plex_Sans: () => ({ variable: "sans" }), IBM_Plex_Mono: () => ({ variable: "mono" }) }));
vi.mock("next/navigation", () => ({ usePathname: () => "/" }));
// The stand-in shows which slide the page content gets.
vi.mock("react", async (original) => ({
  ...(await original<typeof import("react")>()),
  ViewTransition: ({ name, default: slide, children }: { name?: string; default?: string; children: React.ReactNode }) => (
    <div data-view-transition={name ?? ""} data-default={slide}>{children}</div>
  ),
}));

const { default: RootLayout } = await import("./layout");
const serve = async (children: React.ReactNode = <p>page</p>) => renderToString(await RootLayout({ children }));

test("the top bar is served with the status the server holds, before any script runs", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(Date.parse("2026-11-08T10:00:00-08:00"));
  live.latest.mockReturnValue(JSON.stringify({ battery_percentage: 92, battery_status: "Charging", modified: "2026-11-08T09:59:20-08:00" }));

  const html = await serve();

  expect(html).toContain("LIVE<!-- --> <!-- -->9:59 AM");
  expect(html).toContain("PW 92% · CHARGING");
  vi.useRealTimers();
});

test("before the server's first status, the bar is served with dashes", async () => {
  live.latest.mockReturnValue(null);

  expect(await serve()).toContain("PW — · —");
});

test("during an outage the bar is served with OFF GRID SINCE the stretch the server holds", async () => {
  live.latest.mockReturnValue(JSON.stringify({ battery_percentage: 64, battery_status: "Discharging", island_status: "off_grid_unintentional", modified: "2026-11-08T09:59:20-08:00" }));
  live.siteState.mockReturnValue(JSON.stringify({ start: "2026-11-08T14:25:52Z", island_status: "off_grid_unintentional", storm_mode_active: false }));

  expect(await serve()).toContain("OFF GRID SINCE 6:25 AM");
  live.siteState.mockReturnValue(null);
});

// dashboard-shell, "The highlight and the page move together": the page content can slide, and is served still.
test("the page content sits in the slide a tab change uses, served holding still", async () => {
  live.latest.mockReturnValue(null);
  expect(await serve()).toMatch(/data-default="none"><main[^>]*><p>page<\/p><\/main>/);
});

// display-units, "Units from the browser's region" and "US units without a region".
test("the page reads in the units of the browser's region, and in US units without one", async () => {
  live.latest.mockReturnValue(null);
  const Shown = () => {
    const { temperature, wind } = useUnits();
    return <p>{`${temperature} ${wind}`}</p>;
  };

  request.headers = { "accept-language": "de-DE,de;q=0.9" };
  expect(await serve(<Shown />)).toContain("<p>C km/h</p>");
  request.headers = {};
  expect(await serve(<Shown />)).toContain("<p>F mph</p>");
});
