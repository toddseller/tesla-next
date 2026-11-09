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

const bar = (status: object | null = STATUS) => <TopBar initialStatus={status && JSON.stringify(status)} renderedAt={RENDERED_AT} />;
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
