// @vitest-environment jsdom
// The home page's Now chapter (home-story spec: the balance, Now in a sentence, the house scene in Now).
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { FakeStream } from "@/test/fake-event-source";
import { Now } from "./now";

vi.mock("@/components/scene/cloud-renderer", () => ({ createCloudRenderer: () => null }));

// 3:39 PM on November 21, 2026: the house on solar and the grid, the Powerwalls full and idle.
const RENDERED_AT = Date.parse("2026-11-21T23:39:30Z");
const STATUS = { home_power: 1.2, solar_power: 0.7, grid_power: 0.5, battery_power: 0, battery_percentage: 100, battery_status: "Standby", modified: "2026-11-21T23:39:00Z" };
const now = (status: object = STATUS) => render(<Now initialStatus={JSON.stringify(status)} renderedAt={RENDERED_AT} />);
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

test("the served status: Now in a sentence leading, and the scene, linking to Distribution", () => {
  now();
  // The top bar right above gives the live time and any off-grid text, so Now doesn't repeat it.
  expect(part("status-line")).toBeNull();
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
  expect(part("now-sentence").textContent).toBe("Solar supplies the house and sends 4.7\u00a0kW to PG&E. The Powerwalls are idle at 100%.");
  expect(part("label-solar").textContent).toContain("5.8 kW");
});

test("a stale status says when it last came, in place of the sentence", () => {
  now({ ...STATUS, modified: "2026-11-21T23:34:00Z" });
  expect(part("now-sentence").textContent).toBe("No live update since 3:34 PM.");
});
