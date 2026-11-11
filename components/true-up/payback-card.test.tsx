// @vitest-environment jsdom
// The Payback card, mockup B (system-payback spec): years only, on a timeline from PTO.
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";

import { PaybackCard } from "@/components/true-up/payback-card";
import type { Payback } from "@/lib/true-up/payback";

afterEach(cleanup);

const PAYBACK: Payback = {
  solar: { year: 2025, projected: false, estimated: true },
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
  render(<PaybackCard payback={{ ...PAYBACK, solar: { year: 2027, projected: true, estimated: true } }} today="2026-11-09" />);
  expect(card().getByText("Solar is projected to pay for itself in 2027, and for the whole system in 2030")).toBeTruthy();
});

test("the timeline runs from PTO to the end of the Powerwall warranty, marking solar, today and the whole system", () => {
  render(<PaybackCard payback={PAYBACK} today="2026-11-09" />);
  const timeline = card().getByRole("img", { name: /^Timeline/ });
  expect(timeline.getAttribute("aria-label")).toBe(
    "Timeline from October 2021, when the system went in: solar paid for itself in 2025, today is 2026, solar is projected to pay for the whole system in 2030, the Powerwall warranty ends in 2031",
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

test("the note says years only, which years are estimated, and how the credit is taken", () => {
  render(<PaybackCard payback={PAYBACK} today="2026-11-09" />);
  expect(card().getByText(/^Years only\. '21 - '22 and '22 - '23 are estimated from '23 - '24/)).toBeTruthy();
});

test("a year that can't be projected says so", () => {
  render(<PaybackCard payback={{ ...PAYBACK, solar: { year: null, projected: true, estimated: true }, system: { year: null, projected: true, estimated: true } }} today="2026-11-09" />);
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

test("on a phone a rail joins the steps, solar up to today and grey after, with none after the last; today is a hollow ring", () => {
  const { container } = render(<PaybackCard payback={PAYBACK} today="2026-11-09" />);
  const steps = [...container.querySelectorAll<HTMLElement>("ol > li")];
  expect(steps.map((step) => step.querySelector("span.font-mono")!.textContent)).toEqual(["2021", "2025", "2026", "2030", "2031"]);
  const rails = steps.map((step) => step.querySelector<HTMLElement>('[data-part="rail"]')?.className ?? null);
  expect(rails.map((rail) => rail && (rail.includes("bg-solar") ? "solar" : "grey"))).toEqual(["solar", "solar", "grey", "grey", null]);
  expect(steps[2].querySelector('[data-part="dot"]')!.className).toContain("border-muted-foreground");
});

// site-motion: the payback track is a timeline, not a quantity, so it holds still.
test("the payback track has no motion", () => {
  const { container } = render(<PaybackCard payback={PAYBACK} today="2026-11-09" />);
  expect(container.querySelector('[class*="motion-"]')).toBeNull();
});
