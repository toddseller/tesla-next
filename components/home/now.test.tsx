// @vitest-environment jsdom
// The home page's Now chapter (home-story spec: the status line, the balance, Now in a sentence, the house scene in Now).
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { FakeStream } from "@/test/fake-event-source";
import { Now } from "./now";

vi.mock("@/components/scene/cloud-renderer", () => ({ createCloudRenderer: () => null }));

// 3:39 PM on November 21, 2026: the house on solar and the grid, the Powerwalls full and idle.
const RENDERED_AT = Date.parse("2026-11-21T23:39:30Z");
const STATUS = { home_power: 1.2, solar_power: 0.7, grid_power: 0.5, battery_power: 0, battery_percentage: 100, battery_status: "Standby", modified: "2026-11-21T23:39:00Z" };
const now = (status: object = STATUS, site: object | null = null) =>
  render(<Now initialStatus={JSON.stringify(status)} initialSite={site && JSON.stringify(site)} renderedAt={RENDERED_AT} />);
const part = (name: string) => document.querySelector<HTMLElement>(`[data-part="${name}"]`)!;

beforeEach(() => {
  FakeStream.opened = [];
  vi.stubGlobal("EventSource", FakeStream);
  vi.stubGlobal("matchMedia", () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} }));
  vi.useFakeTimers({ toFake: ["Date", "setInterval", "clearInterval"] });
  vi.setSystemTime(RENDERED_AT);
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

test("the served status: the live line, Now in a sentence leading, and the scene, linking to Distribution", () => {
  now();
  expect(part("status-line").textContent).toBe("Live · updated 3:39 PM");
  expect(part("now-sentence").textContent).toBe("Solar and the grid supply the house. The Powerwalls are idle at 100%.");
  expect(part("equation")).toBeNull();
  expect(part("label-home")).not.toBeNull();
  expect(screen.queryByRole("button", { name: /real time/i })).toBeNull();
  expect(screen.getByRole("link", { name: "See the house live, with replay" }).getAttribute("href")).toBe("/distribution");
  expect(part("label-home").closest("a")).toBeNull();
});

test("a new status moves the sentence and the scene without a reload", () => {
  now();
  FakeStream.opened[0].send({ ...STATUS, solar_power: 5.8, home_power: 1.1, grid_power: -4.7, modified: "2026-11-21T23:39:20Z" });
  expect(part("now-sentence").textContent).toBe("Solar supplies the house. The Powerwalls are idle at 100%.");
  expect(part("label-solar").textContent).toContain("5.8 kW");
});

test("a stale status says when it last came, in the line and in place of the sentence", () => {
  now({ ...STATUS, modified: "2026-11-21T23:34:00Z" });
  expect(part("status-line").textContent).toBe("Last update 3:34 PM");
  expect(part("now-sentence").textContent).toBe("No live update since 3:34 PM.");
});

test("off the grid, the line adds the top bar's text", () => {
  now({ ...STATUS, island_status: "off_grid_unintentional" }, { start: "2026-11-21T22:14:00Z", island_status: "off_grid_unintentional", storm_mode_active: false });
  expect(part("status-line").textContent).toBe("Live · updated 3:39 PM · OFF GRID SINCE 2:14 PM");
});
