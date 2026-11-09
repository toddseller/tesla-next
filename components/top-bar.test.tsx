// @vitest-environment jsdom
import { act, cleanup, render, screen, within } from "@testing-library/react";
import { usePathname } from "next/navigation";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { FakeStream } from "@/test/fake-event-source";
import { TopBar } from "./top-bar";

vi.mock("next/navigation", () => ({ usePathname: vi.fn() }));

// 9:59:20 AM on November 8, 2026, the Powerwalls at 92% and charging.
const STATUS = { battery_percentage: 92, battery_status: "Charging", modified: "2026-11-08T09:59:20-08:00" };
const RENDERED_AT = Date.parse("2026-11-08T10:00:00-08:00");

beforeEach(() => {
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
const shown = () => {
  const status = document.querySelector('[data-part="live-status"]')!;
  return { text: status.textContent, live: status.querySelector('[data-part="dot"]')!.className.includes("bg-powerwall") };
};

test.each([
  ["/", "Solar"],
  ["/true-up", "True-Up"],
])("on %s, lists the five pages and marks only %s as current", (path, current) => {
  vi.mocked(usePathname).mockReturnValue(path);
  render(bar());

  const home = screen.getByRole("link", { name: "Tesla Solar Report" });
  expect(home.getAttribute("href")).toBe("/");
  expect(home.querySelector("img")).not.toBeNull();

  const links = within(screen.getByRole("navigation", { name: "Pages" })).getAllByRole("link");
  expect(links.map((link) => [link.textContent, link.getAttribute("href")])).toEqual([
    ["Solar", "/"],
    ["Impact", "/impact"],
    ["Distribution", "/distribution"],
    ["True-Up", "/true-up"],
    ["Top Ten", "/top"],
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
