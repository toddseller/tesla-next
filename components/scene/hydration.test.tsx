// @vitest-environment jsdom
// The server renders the Distribution page and the browser hydrates that HTML: both renders must agree, or React
// throws the page away and renders it again in the browser.
import { act } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, expect, test, vi } from "vitest";

import Distribution from "@/components/scene/distribution";

vi.mock("@/components/scene/use-site-data", () => ({
  useSiteData: () => ({
    solarPower: 5.6, homePower: 1.1, batteryPower: -2.7, battery: 64, gridPower: 0, vehicle: null, liveReceived: true,
    modifiedAt: new Date(), weatherCover: 0.4, weatherRain: 0, weatherWind: 0, weatherWindLow: 0, weatherWindMid: 0,
    weatherWindHigh: 0, weatherCirrus: 0.1, weatherLow: 0.3, weatherMid: 0, weatherSun: 0.9, replayData: null, setReplayDay: () => {},
  }),
}));
vi.mock("@/components/scene/cloud-renderer", () => ({ createCloudRenderer: () => null }));

const reduceMotion = (on: boolean) =>
  vi.stubGlobal("matchMedia", (query: string) => ({ matches: on && query === "(prefers-reduced-motion: reduce)", addEventListener: () => {}, removeEventListener: () => {} }));

// Renders as the server would, then hydrates in the browser after `between` runs, collecting React's complaints.
function serveThenHydrate(renderedAt: number, between: () => void) {
  const page = <Distribution initialStatus={null} search={{}} renderedAt={renderedAt} />;
  const container = document.createElement("div");
  container.innerHTML = renderToString(page);
  document.body.append(container);
  between();
  const errors: unknown[] = [];
  act(() => {
    hydrateRoot(container, page, { onRecoverableError: (error) => errors.push(error) });
  });
  return errors;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  document.body.innerHTML = "";
});

test("a visitor who prefers reduced motion hydrates the page the server rendered", () => {
  reduceMotion(false);
  expect(serveThenHydrate(Date.now(), () => reduceMotion(true))).toEqual([]);
});

test("a minute turning between the server's render and the browser's hydrates cleanly", () => {
  reduceMotion(false);
  // 4:29:59.9 PM at the site, then a second later in the browser.
  vi.useFakeTimers({ now: new Date("2026-11-08T00:29:59.900Z"), toFake: ["Date"] });
  expect(serveThenHydrate(Date.now(), () => vi.setSystemTime(new Date("2026-11-08T00:30:00.900Z")))).toEqual([]);
});
