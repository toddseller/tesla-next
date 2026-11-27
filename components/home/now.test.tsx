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

// The top bar's rule: storm watch counts only on the grid, an outage outranking it.
test("a storm watch on the grid holds the Powerwalls; during an outage they read idle", () => {
  now({ ...STATUS, island_status: "on_grid", storm_mode_active: true });
  expect(part("now-sentence").textContent).toBe("Solar and the grid supply the house. The Powerwalls are holding at 100% for a storm watch.");
  cleanup();
  now({ ...STATUS, grid_power: 0, solar_power: 1.2, island_status: "off_grid_unintentional", storm_mode_active: true });
  expect(part("now-sentence").textContent).toBe("Solar supplies the house. The Powerwalls are idle at 100%.");
});

test("a stale status says when it last came, in place of the sentence", () => {
  now({ ...STATUS, modified: "2026-11-21T23:34:00Z" });
  expect(part("now-sentence").textContent).toBe("No live update since 3:34 PM.");
});

// Beside the sentence below 1024 the scene shrank to about 250 pixels and its labels collided.
test("the sentence and the scene sit side by side only from 1024 pixels", () => {
  now();
  const chapter = screen.getByRole("region", { name: "Now" }).className;
  expect(chapter).toContain("lg:grid-cols-");
  expect(chapter).not.toContain("md:grid-cols-");
});

// Now says the weather outside (home-story spec): under the live sentence, the gusts only wider than a phone.
test("the live weather in a sentence under the live one, the gusts hidden on a phone", () => {
  now({ ...STATUS, weather: { cover: 0.85, temperature: 16.7, code: 3, windGusts: 86 } });
  const outside = part("outside-sentence");
  expect(outside.textContent).toMatch(/^Outside it's 62°F and cloudy, gusts to 53 mph; sunset at 4:5\d PM\.$/);
  expect(screen.getByText(", gusts to 53 mph").className).toContain("hidden md:inline");
  expect(part("now-sentence").compareDocumentPosition(outside) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
});

test("without a temperature, or with the live status stale, no weather sentence", () => {
  now({ ...STATUS, weather: { cover: 0.85, code: 3 } });
  expect(part("outside-sentence")).toBeNull();
  cleanup();
  now({ ...STATUS, modified: "2026-11-21T23:34:00Z", weather: { cover: 0.85, temperature: 16.7, code: 3 } });
  expect(part("outside-sentence")).toBeNull();
});
