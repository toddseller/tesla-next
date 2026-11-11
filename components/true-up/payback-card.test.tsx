// @vitest-environment jsdom
// The Payback card, mockup B (system-payback spec): years only, on a timeline from PTO.
import { act, cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { PaybackCard } from "@/components/true-up/payback-card";
import type { Payback } from "@/lib/true-up/payback";

// The story waits for the timeline to scroll into view; jsdom has no IntersectionObserver, so a test's stands in.
let observers: { callback: IntersectionObserverCallback; options?: IntersectionObserverInit }[] = [];
beforeEach(() => {
  observers = [];
  vi.stubGlobal("IntersectionObserver", class {
    constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) { observers.push({ callback, options }); }
    observe() {}
    disconnect() {}
  });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
const inView = () => act(() => observers.forEach(({ callback }) => callback([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver)));

const PAYBACK: Payback = {
  solar: { year: 2025, month: "2025-06", projected: false, estimated: true },
  system: { year: 2030, projected: true, estimated: true },
  powerwalls: { year: null, wont: true },
  outages: { count: 35, seconds: 564_840, longest_seconds: 188_172 },
};
const card = () => within(screen.getByRole("region", { name: "Payback" }));

test("the heading gives solar's year and the whole system's, saying which is projected", () => {
  render(<PaybackCard payback={PAYBACK} today="2026-11-09" />);
  expect(card().getByText("Solar paid for itself in 2025, and is projected to pay for the whole system in 2030")).toBeTruthy();
});

test("before solar has paid back, both read as projections", () => {
  render(<PaybackCard payback={{ ...PAYBACK, solar: { year: 2027, month: null, projected: true, estimated: true } }} today="2026-11-09" />);
  expect(card().getByText("Solar is projected to pay for itself in 2027, and for the whole system in 2030")).toBeTruthy();
});

test("the timeline runs from PTO to the end of the Powerwall warranty, marking solar, today and the whole system", () => {
  render(<PaybackCard payback={PAYBACK} today="2026-11-09" />);
  const timeline = card().getByRole("img", { name: /^Timeline/ });
  expect(timeline.getAttribute("aria-label")).toBe(
    "Timeline from October 2021, when the system went in: solar paid for itself in June 2025, today is 2026, solar is projected to pay for the whole system in 2030, the Powerwall warranty ends in 2031",
  );
});

test("the Powerwalls won't pay back in dollars: the card says so and links their outage record", () => {
  render(<PaybackCard payback={PAYBACK} today="2026-11-09" />);
  expect(card().getByText("The Powerwalls won't pay for themselves in dollars before their warranty ends.")).toBeTruthy();
  const link = card().getByRole("link", { name: "What they did instead: 35 outages, 6 d 12 h off the grid, the longest 2 d 4 h" });
  expect(link.getAttribute("href")).toBe("/impact?backup=all");
});

test("Powerwalls that would pay back give their year", () => {
  render(<PaybackCard payback={{ ...PAYBACK, powerwalls: { year: 2029, wont: false } }} today="2026-11-09" />);
  expect(card().getByText("The Powerwalls are projected to pay for themselves in 2029.")).toBeTruthy();
});

test("the note says years, and the month solar paid back, which years are estimated, and how the credit is taken", () => {
  render(<PaybackCard payback={PAYBACK} today="2026-11-09" />);
  expect(card().getByText(/^Years, and the month solar paid back\. '21 - '22 and '22 - '23 are estimated from '23 - '24/)).toBeTruthy();
});

test("a year that can't be projected says so", () => {
  render(<PaybackCard payback={{ ...PAYBACK, solar: { year: null, month: null, projected: true, estimated: true }, system: { year: null, projected: true, estimated: true } }} today="2026-11-09" />);
  expect(card().getByText("Solar's payback can't be projected yet")).toBeTruthy();
});

test("a year past the warranty stretches the timeline to fit it", () => {
  const { container } = render(<PaybackCard payback={{ ...PAYBACK, system: { year: 2038, projected: true, estimated: true } }} today="2026-11-09" />);
  const ticks = [...container.querySelectorAll('[data-part="tick"]')].map((tick) => tick.textContent);
  expect(ticks.at(-1)).toBe("2038");
  const marks = [...container.querySelectorAll<HTMLElement>('[data-part="mark"]')];
  expect(marks.every((mark) => parseFloat(mark.style.left) < 100)).toBe(true);
});

test("markers alternate label rows so neighbours don't overlap", () => {
  const { container } = render(<PaybackCard payback={PAYBACK} today="2026-11-09" />);
  const rows = [...container.querySelectorAll<HTMLElement>('[data-part="mark"]')].map((mark) => mark.dataset.row);
  expect(rows).toEqual(["0", "1", "0", "1"]);
});

test("a marker near the timeline's end hangs its label inward", () => {
  const { container } = render(<PaybackCard payback={{ ...PAYBACK, system: { year: 2038, projected: true, estimated: true } }} today="2026-11-09" />);
  const marks = [...container.querySelectorAll<HTMLElement>('[data-part="mark"]')];
  expect(marks.at(-1)!.dataset.align).toBe("end");
  expect(marks[0].dataset.align).toBe("center");
});

const centre = (el: HTMLElement) => parseFloat(el.style.top) + parseFloat(el.style.height) / 2;

test("every marker's dot sits centred on the line, ringed in the card's colour", () => {
  const { container } = render(<PaybackCard payback={PAYBACK} today="2026-11-09" />);
  const box = container.querySelector<HTMLElement>('[data-part="timeline"]')!;
  const line = centre(container.querySelector<HTMLElement>('[data-part="track"]')!);
  const marks = [...container.querySelectorAll<HTMLElement>('[data-part="mark"]')];
  expect(marks).toHaveLength(4);
  for (const mark of marks) {
    const dot = mark.querySelector<HTMLElement>('[data-part="dot"]')!;
    expect(parseFloat(box.style.height) - parseFloat(mark.style.bottom) - parseFloat(dot.style.height) / 2).toBe(line);
    expect(dot.className).toContain("shadow-[0_0_0_3px_var(--card)]");
  }
});

test("the line is dashed from today to a projected whole-system year", () => {
  const { container } = render(<PaybackCard payback={PAYBACK} today="2026-11-09" />);
  const dashed = container.querySelector<HTMLElement>('[data-part="projection"]')!;
  const [, today, system] = [...container.querySelectorAll<HTMLElement>('[data-part="mark"]')];
  expect(dashed.style.left).toBe(today.style.left);
  expect(parseFloat(dashed.style.left) + parseFloat(dashed.style.width)).toBeCloseTo(parseFloat(system.style.left), 6);
  expect(dashed.style.background).toContain("repeating-linear-gradient");
});

test("with the whole system already paid for, nothing is dashed", () => {
  const { container } = render(<PaybackCard payback={{ ...PAYBACK, system: { year: 2026, projected: false, estimated: true } }} today="2026-11-09" />);
  expect(container.querySelector('[data-part="projection"]')).toBeNull();
});

// system-payback, "The Payback card": the phone draws the same line as the desktop, turned down the card.
test("on a phone a rail joins the steps: solar up to today, dashed to the whole system, grey after, none after the last; today is a hollow ring", () => {
  const { container } = render(<PaybackCard payback={PAYBACK} today="2026-11-09" />);
  const steps = [...container.querySelectorAll<HTMLElement>("ol > li")];
  expect(steps.map((step) => step.querySelector("span.font-mono")!.textContent)).toEqual(["2021", "2025", "2026", "2030", "2031"]);
  const rails = steps.map((step) => step.querySelector<HTMLElement>('[data-part="rail"]'));
  const kind = (rail: HTMLElement | null) => rail && (rail.style.background.includes("repeating-linear-gradient(180deg") ? "dashed" : rail.className.includes("bg-solar") ? "solar" : "grey");
  expect(rails.map(kind)).toEqual(["solar", "solar", "dashed", "grey", null]);
  expect(steps[2].querySelector('[data-part="dot"]')!.className).toContain("border-muted-foreground");
});

// site-motion, "The Payback card tells its story": once half the timeline is in view, after 200 ms, the line crosses
// the track at an even 6 s for the whole of it, stopping 900 ms at each mark while it lands. Styles keep about a tenth
// of a millisecond, so delays are compared to that.
const ms = (value: string) => parseFloat(value);
const delay = (element: Element) => ms((element as HTMLElement).style.animationDelay);
const lasts = (element: Element) => ms((element as HTMLElement).style.animationDuration);
const FROM = Date.parse("2021-10-22T00:00:00Z");
const share = (iso: string) => (Date.parse(`${iso}T00:00:00Z`) - FROM) / (Date.parse("2033-01-01T00:00:00Z") - FROM);
const PIECES = '[data-part="stretch"], [data-part="projection"], [data-part="dot"], [data-part="connector"], [data-part="label"], [data-part="rail"], [data-part="step-text"]';

test("until half the timeline is in view the story waits: its pieces hidden, the grey track showing, nothing moving", () => {
  const { container } = render(<PaybackCard payback={PAYBACK} today="2026-11-09" />);
  expect(observers.map(({ options }) => options?.threshold)).toEqual([0.5]);
  const pieces = [...container.querySelectorAll(PIECES)];
  expect(pieces.length).toBeGreaterThan(10);
  for (const piece of pieces) expect(piece.className).toContain("motion-waiting");
  expect(container.querySelector('[class*="motion-stretch"], [class*="motion-land"]')).toBeNull();
  expect(container.querySelector('[data-part="track"]')!.className).not.toContain("motion-");
});

test("in view, the line draws stop by stop: solid to solar, on to today, dashed to the whole system, then the warranty", () => {
  const { container } = render(<PaybackCard payback={PAYBACK} today="2026-11-09" />);
  inView();
  const timeline = container.querySelector('[data-part="timeline"]')!;
  expect(timeline.querySelector('[class*="motion-waiting"]')).toBeNull();
  const stretches = [...timeline.querySelectorAll('[data-part="stretch"], [data-part="projection"]')];
  expect(stretches.map((stretch) => stretch.className.includes("motion-stretch"))).toEqual([true, true, true]);
  const [toSolar, toToday, toSystem] = stretches;
  const [solar, today, system, warranty] = [...timeline.querySelectorAll('[data-part="dot"]')].map(delay);

  expect(delay(toSolar)).toBe(200);
  expect(solar).toBeCloseTo(200 + lasts(toSolar), 1);
  expect(delay(toToday)).toBeCloseTo(solar + 900, 1);
  expect(today).toBeCloseTo(delay(toToday) + lasts(toToday), 1);
  expect(delay(toSystem)).toBeCloseTo(today + 900, 1);
  expect(system).toBeCloseTo(delay(toSystem) + lasts(toSystem), 1);
  expect(warranty).toBeCloseTo(system + 900, 1);
  expect(lasts(toSolar) + lasts(toToday) + lasts(toSystem)).toBeCloseTo(6000 * share("2030-07-01"), 1);
});

test("a mark lands: its dot pops in and rings, its connector draws up, and its label grows past its size, solar's most", () => {
  const { container } = render(<PaybackCard payback={PAYBACK} today="2026-11-09" />);
  inView();
  const marks = [...container.querySelectorAll('[data-part="timeline"] [data-part="mark"]')];
  marks.forEach((mark, i) => {
    const dot = mark.querySelector('[data-part="dot"]')!;
    const ring = mark.querySelector('[data-part="ring"]')!;
    const connector = mark.querySelector('[data-part="connector"]')!;
    const label = mark.querySelector<HTMLElement>('[data-part="label"]')!;
    expect(dot.className).toContain("motion-land");
    expect(lasts(dot)).toBe(260);
    expect(ring.className).toContain("motion-ring");
    expect(delay(ring)).toBeCloseTo(delay(dot), 1);
    expect(connector.className).toContain("motion-raise");
    expect(delay(connector)).toBeCloseTo(delay(dot) + 160, 1);
    expect(lasts(connector)).toBe(260);
    expect(label.className).toContain("motion-grow");
    expect(delay(label)).toBeCloseTo(delay(dot) + 320, 1);
    expect(lasts(label)).toBe(600);
    expect(label.style.getPropertyValue("--peak")).toBe(i === 0 ? "1.4" : "1.15");
  });
});

test("on a phone the same story runs down the steps, each rail drawing from one stop to the next and each step landing", () => {
  const { container } = render(<PaybackCard payback={PAYBACK} today="2026-11-09" />);
  inView();
  const stops = [...container.querySelectorAll('[data-part="timeline"] [data-part="dot"]')].map(delay);
  const steps = [...container.querySelectorAll<HTMLElement>("ol > li")];
  const rails = steps.map((step) => step.querySelector('[data-part="rail"]'));
  const starts = [200, ...stops.map((stop) => stop + 900)];
  for (const i of [0, 1, 2]) {
    expect(delay(rails[i]!)).toBeCloseTo(starts[i], 1);
    expect(delay(rails[i]!) + lasts(rails[i]!)).toBeCloseTo(stops[i], 1);
  }
  expect(rails[3]!.className).not.toContain("motion-drop");
  expect(delay(steps[0].querySelector('[data-part="step-text"]')!)).toBe(200);
  stops.forEach((stop, i) => {
    expect(steps[i + 1].querySelector('[data-part="dot"]')!.className).toContain("motion-land");
    const text = steps[i + 1].querySelector<HTMLElement>('[data-part="step-text"]')!;
    expect(text.className).toContain("motion-grow");
    expect(delay(text)).toBeCloseTo(stop + 320, 1);
    expect(text.style.getPropertyValue("--peak")).toBe(i === 0 ? "1.4" : "1.15");
  });
});

// site-motion, "The Payback card tells its story": as across the card, the timeline starts as its grey track.
test("on a phone a grey track runs behind every rail, so the drawn rails draw over it and none floats alone", () => {
  const { container } = render(<PaybackCard payback={PAYBACK} today="2026-11-09" />);
  inView();
  const tracks = [...container.querySelectorAll<HTMLElement>("ol > li")].map((step) => step.querySelector<HTMLElement>('[data-part="rail-track"]'));
  expect(tracks.map((track) => track?.className.includes("bg-input") ?? null)).toEqual([true, true, true, true, null]);
  for (const track of tracks.slice(0, 3)) expect(track!.querySelector('[data-part="rail"]')!.className).toContain("motion-drop");
});

test("on a phone the grey track is unbroken: a bridge behind each dot joins the rails, half a dot at the ends", () => {
  const { container } = render(<PaybackCard payback={PAYBACK} today="2026-11-09" />);
  const bridges = [...container.querySelectorAll<HTMLElement>("ol > li")].map((step) => step.querySelector<HTMLElement>('[data-part="track-bridge"]'));
  expect(bridges.every((bridge) => bridge?.className.includes("bg-input"))).toBe(true);
  expect(bridges.map((bridge) => [bridge!.style.top, bridge!.style.height])).toEqual([["10px", "6px"], ["0px", "16px"], ["0px", "16px"], ["0px", "16px"], ["0px", "10px"]]);
});

// system-payback and site-motion: once Solar paid back has landed, its month fades in under it on wider screens, the
// connector, drawn up to the label, shrinking down from it to 12 of its 28 px; on a phone the month follows the label.
test("solar's month fades in under its label as the connector shrinks, and beside it on a phone", () => {
  const { container } = render(<PaybackCard payback={PAYBACK} today="2026-11-09" />);
  inView();
  const solar = container.querySelector('[data-part="timeline"] [data-part="mark"]')!;
  const stop = delay(solar.querySelector('[data-part="dot"]')!);
  const month = solar.querySelector<HTMLElement>('[data-part="month"]')!;
  expect(month.textContent).toBe("Jun '25");
  expect(month.className).toContain("motion-fade");
  expect(delay(month)).toBeCloseTo(stop + 920, 1);
  expect(lasts(month)).toBe(400);
  const connector = solar.querySelector<HTMLElement>('[data-part="connector"]')!;
  expect(connector.className).toContain("motion-raise-shrink");
  expect(connector.style.animationDelay).toBe(`${stop + 160}ms, ${stop + 920}ms`);
  expect(connector.style.height).toBe("28px");
  const phoneMonth = [...container.querySelectorAll("ol > li")][1].querySelector('[data-part="month"]')!;
  expect(phoneMonth.textContent).toBe(" · Jun '25");
  expect(delay(phoneMonth)).toBeCloseTo(stop + 920, 1);
});

test("at rest the solar connector stands 12 of its 28 px under the month, so the label keeps its height", () => {
  vi.stubGlobal("IntersectionObserver", undefined);
  const { container } = render(<PaybackCard payback={PAYBACK} today="2026-11-09" />);
  const connector = container.querySelector<HTMLElement>('[data-part="timeline"] [data-part="mark"] [data-part="connector"]')!;
  expect(connector.style.height).toBe("28px");
  expect(parseFloat(connector.style.transform.replace("scaleY(", ""))).toBeCloseTo(12 / 28, 5);
});

// The month leaves the server for solar's payback, so its dot sits mid-month rather than mid-year.
test("solar's dot sits at the middle of the month it paid back; a projected one at mid-year", () => {
  const { container } = render(<PaybackCard payback={PAYBACK} today="2026-11-09" />);
  const solar = container.querySelector<HTMLElement>('[data-part="timeline"] [data-part="mark"]')!;
  expect(parseFloat(solar.style.left)).toBeCloseTo(share("2025-06-15") * 100, 3);
  cleanup();
  const { container: projected } = render(<PaybackCard payback={{ ...PAYBACK, solar: { year: 2027, month: null, projected: true, estimated: true } }} today="2026-11-09" />);
  const marks = [...projected.querySelectorAll<HTMLElement>('[data-part="timeline"] [data-part="mark"]')];
  expect(marks.some((mark) => Math.abs(parseFloat(mark.style.left) - share("2027-07-01") * 100) < 1e-3)).toBe(true);
});

test("a projected solar payback has no month", () => {
  const { container } = render(<PaybackCard payback={{ ...PAYBACK, solar: { year: 2027, month: null, projected: true, estimated: true } }} today="2026-11-09" />);
  expect(container.querySelector('[data-part="month"]')).toBeNull();
});

test("a browser without IntersectionObserver skips the story and shows the timeline complete", () => {
  vi.stubGlobal("IntersectionObserver", undefined);
  const { container } = render(<PaybackCard payback={PAYBACK} today="2026-11-09" />);
  expect(container.querySelector('[class*="motion-"]')).toBeNull();
});

test("it plays once: when it's over, a re-render with new figures carries no motion and doesn't wait again", () => {
  vi.useFakeTimers();
  const { container, rerender } = render(<PaybackCard payback={PAYBACK} today="2026-11-09" />);
  inView();
  act(() => vi.advanceTimersByTime(20_000));
  rerender(<PaybackCard payback={{ ...PAYBACK, system: { year: 2031, projected: true, estimated: true } }} today="2026-11-09" />);
  expect(container.querySelector('[class*="motion-"]')).toBeNull();
});

// site-motion, "True-Up's figures count up when first seen": calendar years show as they are.
test("the card's years never count", () => {
  render(<PaybackCard payback={PAYBACK} today="2026-11-09" />);
  expect(document.querySelector("[data-part=counting]")).toBeNull();
});
