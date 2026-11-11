// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { usePathname } from "next/navigation";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { FakeStream } from "@/test/fake-event-source";
import { PageSlide } from "./page-slide";
import { TopBar } from "./top-bar";

vi.mock("next/navigation", () => ({ usePathname: vi.fn() }));
// The stand-ins show what a link asks of a navigation, and let a test say which link is still loading.
const pendingHref = vi.hoisted(() => ({ current: "" }));
vi.mock("next/link", async () => {
  const { createContext, useContext } = await import("react");
  const Href = createContext("");
  return {
    default: ({ href, onNavigate, children, ...rest }: { href: string; onNavigate?: () => void; children: React.ReactNode }) => (
      <Href.Provider value={href}>
        <a href={href} onClick={(event) => { event.preventDefault(); onNavigate?.(); }} {...rest}>{children}</a>
      </Href.Provider>
    ),
    useLinkStatus: () => ({ pending: useContext(Href) === pendingHref.current }),
  };
});
vi.mock("react", async (original) => ({
  ...(await original<typeof import("react")>()),
  ViewTransition: ({ name, default: slide, children }: { name?: string; default?: string; children: React.ReactNode }) => (
    <span data-view-transition={name} data-default={slide}>{children}</span>
  ),
}));

// 9:59:20 AM on November 8, 2026, the Powerwalls at 92% and charging.
const STATUS = { battery_percentage: 92, battery_status: "Charging", modified: "2026-11-08T09:59:20-08:00" };
const RENDERED_AT = Date.parse("2026-11-08T10:00:00-08:00");

beforeEach(() => {
  pendingHref.current = "";
  FakeStream.opened = [];
  vi.stubGlobal("EventSource", FakeStream);
  vi.mocked(usePathname).mockReturnValue("/true-up");
  vi.useFakeTimers({ toFake: ["Date", "setInterval", "clearInterval"] });
  vi.setSystemTime(RENDERED_AT);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

const bar = (status: object | null = STATUS) => <TopBar initialStatus={status && JSON.stringify(status)} initialSite={null} renderedAt={RENDERED_AT} />;
// What a screen reader gets: the final figures, not the ones rolling on screen.
const spoken = (node: Node): string =>
  node instanceof Element && node.getAttribute("aria-hidden") === "true" ? "" : node.nodeType === Node.TEXT_NODE ? node.textContent! : [...node.childNodes].map(spoken).join("");
const shown = () => {
  const status = document.querySelector('[data-part="live-status"]')!;
  return { text: spoken(status), live: status.querySelector('[data-part="dot"]')!.className.includes("bg-powerwall") };
};
const rings = () => document.querySelectorAll('[data-part="dot-ring"]');
// The wide-screen links; the phone's Pages landmark holds only its button until opened.
const wideNav = () => screen.getAllByRole("navigation", { name: "Pages" }).find((nav) => nav.className.includes("max-sm:hidden"))!;

test.each([
  ["/", "Solar"],
  ["/true-up", "True-Up"],
  ["/patterns", "Patterns"],
])("on %s, lists the six pages and marks only %s as current", (path, current) => {
  vi.mocked(usePathname).mockReturnValue(path);
  render(bar());

  const home = screen.getByRole("link", { name: "Tesla Solar Report" });
  expect(home.getAttribute("href")).toBe("/");
  expect(home.querySelector("img")).not.toBeNull();

  const links = within(wideNav()).getAllByRole("link");
  expect(links.map((link) => [link.textContent, link.getAttribute("href")])).toEqual([
    ["Solar", "/"],
    ["Impact", "/impact"],
    ["Distribution", "/distribution"],
    ["True-Up", "/true-up"],
    ["Top Ten", "/top"],
    ["Patterns", "/patterns"],
  ]);
  expect(links.filter((link) => link.getAttribute("aria-current") === "page").map((link) => link.textContent)).toEqual([current]);
});

test("the status the page was rendered with shows before any stream message", () => {
  render(bar());

  expect(shown()).toEqual({ text: "LIVE 9:59 AMPW 92% · CHARGING", live: true });
});

test("a status from the stream updates the bar", () => {
  render(bar());

  FakeStream.opened[0].send({ ...STATUS, battery_percentage: 93, modified: "2026-11-08T10:00:20-08:00" });

  expect(shown().text).toBe("LIVE 10:00 AMPW 93% · CHARGING");
});

test("a status two minutes old turns the bar to LAST with a gray dot", () => {
  render(bar());

  act(() => vi.advanceTimersByTime(80_000));

  expect(shown()).toEqual({ text: "LAST 9:59 AMPW 92% · CHARGING", live: false });
});

test("no status yet shows dashes", () => {
  render(bar(null));

  expect(shown()).toEqual({ text: "LIVE —PW — · —", live: false });
});

const OUTAGE = { ...STATUS, battery_status: "Discharging", island_status: "off_grid_unintentional", storm_mode_active: false };
const OFF_GRID_STRETCH = { start: "2026-11-08T14:25:52Z", island_status: "off_grid_unintentional", storm_mode_active: false };
const pill = () => document.querySelector('[data-part="grid-pill"]');

test("an outage shows OFF GRID SINCE the stretch the page was rendered with, before the Powerwall pill", () => {
  render(<TopBar initialStatus={JSON.stringify(OUTAGE)} initialSite={JSON.stringify(OFF_GRID_STRETCH)} renderedAt={RENDERED_AT} />);
  expect(pill()!.textContent).toBe("OFF GRID SINCE 6:25 AM");
  expect(shown().text).toBe("LIVE 9:59 AMOFF GRID SINCE 6:25 AMPW 92% · DISCHARGING");
});

test("a site_state event fills in the outage's start", () => {
  render(<TopBar initialStatus={JSON.stringify(OUTAGE)} initialSite={null} renderedAt={RENDERED_AT} />);
  expect(pill()!.textContent).toBe("OFF GRID");
  FakeStream.opened[0].send(OFF_GRID_STRETCH, "site_state");
  expect(pill()!.textContent).toBe("OFF GRID SINCE 6:25 AM");
});

test("a test, storm watch and going back on the grid", () => {
  render(bar());
  expect(pill()).toBeNull();
  FakeStream.opened[0].send({ ...STATUS, island_status: "off_grid_intentional", storm_mode_active: false });
  expect(pill()!.textContent).toBe("OFF GRID TEST");
  FakeStream.opened[0].send({ ...STATUS, island_status: "on_grid", storm_mode_active: true });
  expect(pill()!.textContent).toBe("STORM WATCH");
  FakeStream.opened[0].send({ ...STATUS, island_status: "on_grid", storm_mode_active: false });
  expect(pill()).toBeNull();
});

test("a stale status keeps its OFF GRID pill beside LAST", () => {
  render(<TopBar initialStatus={JSON.stringify(OUTAGE)} initialSite={null} renderedAt={RENDERED_AT} />);
  act(() => vi.advanceTimersByTime(3 * 60_000));
  expect(shown()).toEqual({ text: "LAST 9:59 AMOFF GRIDPW 92% · DISCHARGING", live: false });
});

// site-motion, "The live dot rings with each status" and "Changed values move from their old figure".
test("each status from the stream sends one ring from the dot, and none shows before one arrives", () => {
  render(bar());
  expect(rings()).toHaveLength(0);
  FakeStream.opened[0].send({ ...STATUS, modified: "2026-11-08T10:00:00-08:00" });
  const first = rings()[0];
  expect(rings()).toHaveLength(1);
  expect(first.className).toContain("motion-ring");
  FakeStream.opened[0].send({ ...STATUS, modified: "2026-11-08T10:00:10-08:00" });
  expect(rings()).toHaveLength(1);
  expect(rings()[0]).not.toBe(first);
});

test("the charge rolls on screen while a screen reader gets the new figure at once", async () => {
  render(bar());
  FakeStream.opened[0].send({ ...STATUS, battery_percentage: 100, modified: "2026-11-08T10:00:20-08:00" });
  const pillOf = () => document.querySelector('[data-part="pill"]')!;
  expect(pillOf().querySelector('[aria-hidden="true"]')!.textContent).toBe("PW 92% · CHARGING");
  expect(shown().text).toContain("PW 100% · CHARGING");
  await act(() => new Promise((resolve) => setTimeout(resolve, 500)));
  expect(pillOf().querySelector('[aria-hidden="true"]')).toBeNull();
  expect(pillOf().textContent).toBe("PW 100% · CHARGING");
});

// dashboard-shell, "The highlight and the page move together": the page slides the way the tabs go.
test("a tab change slides the page the way the tabs go", () => {
  vi.mocked(usePathname).mockReturnValue("/impact");
  render(<>{bar()}<PageSlide><p>page</p></PageSlide></>);
  const slide = () => (document.querySelector("[data-default]") as HTMLElement).dataset.default;
  const tab = (name: string) => within(wideNav()).getByRole("link", { name });
  expect(slide()).toBe("none");
  fireEvent.click(tab("Patterns"));
  expect(slide()).toBe("slide-next");
  fireEvent.click(tab("Solar"));
  expect(slide()).toBe("slide-previous");
});

test("the current tab holds the highlight that glides between tabs", () => {
  vi.mocked(usePathname).mockReturnValue("/impact");
  render(bar());
  const highlights = document.querySelectorAll('[data-view-transition="nav-highlight"]');
  expect(highlights).toHaveLength(1);
  expect(highlights[0].closest("a")!.textContent).toBe("Impact");
});

// dashboard-shell, "The clicked tab shows at once".
test("a tab still loading brightens, while the current page keeps the highlight and stays current", () => {
  vi.mocked(usePathname).mockReturnValue("/");
  pendingHref.current = "/true-up";
  render(bar());
  const link = (name: string) => screen.getByRole("link", { name });
  const name = (tab: string) => link(tab).querySelector('[data-part="name"]')!.className;
  expect(name("True-Up")).toContain("text-white");
  expect(link("True-Up").getAttribute("aria-current")).toBeNull();
  expect(link("Solar").getAttribute("aria-current")).toBe("page");
  expect(link("Solar").querySelector('[data-view-transition="nav-highlight"]')).not.toBeNull();
  expect(name("Impact")).not.toContain("text-white");
});

// dashboard-shell, "The page menu on a phone": below 640 px a Pages button opens the links; CSS picks which shows.
const pagesButton = () => screen.getByRole("button", { name: "Pages" });
const menuLinks = () => within(screen.getByRole("dialog")).getAllByRole("link");

test("on a phone the links are behind a Pages button, and on a wide screen in the bar", () => {
  vi.mocked(usePathname).mockReturnValue("/impact");
  render(bar());
  expect(pagesButton().getAttribute("aria-expanded")).toBe("false");
  expect(pagesButton().closest("nav")!.className).toContain("sm:hidden");
  expect(screen.getByRole("link", { name: "Patterns" }).closest("nav")!.className).toContain("max-sm:hidden");
  expect(screen.queryByRole("dialog")).toBeNull();
});

test("the Pages button opens the six links in order, the current one marked", () => {
  vi.mocked(usePathname).mockReturnValue("/impact");
  render(bar());
  fireEvent.click(pagesButton());
  expect(pagesButton().getAttribute("aria-expanded")).toBe("true");
  expect(menuLinks().map((link) => link.textContent)).toEqual(["Solar", "Impact", "Distribution", "True-Up", "Top Ten", "Patterns"]);
  expect(menuLinks().map((link) => link.getAttribute("aria-current"))).toEqual([null, "page", null, null, null, null]);
  expect(document.querySelectorAll('[data-view-transition="nav-highlight"]')).toHaveLength(1);
});

test("choosing a page from the menu closes it and slides the page the way the tabs go", () => {
  vi.mocked(usePathname).mockReturnValue("/impact");
  render(<>{bar()}<PageSlide><p>page</p></PageSlide></>);
  fireEvent.click(pagesButton());
  fireEvent.click(within(screen.getByRole("dialog")).getByRole("link", { name: "Patterns" }));
  expect(screen.queryByRole("dialog")).toBeNull();
  expect((document.querySelector("[data-default]") as HTMLElement).dataset.default).toBe("slide-next");
});

test("Escape closes the menu", () => {
  render(bar());
  fireEvent.click(pagesButton());
  fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(pagesButton().getAttribute("aria-expanded")).toBe("false");
});
