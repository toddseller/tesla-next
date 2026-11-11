// @vitest-environment jsdom
// The Self Powered and Solar Offset sections of the impact-report spec, ported from anton-tesla-api-ws Impact.test.jsx.
import { act, cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

import { SelfPowered, SolarOffset } from "@/components/impact/sections";
import type { ImpactFigures } from "@/lib/impact";

// The spec's October 18, 2026, its kWh by source worked out from the shares.
const day: ImpactFigures = {
  from_solar_percentage: 48, from_powerwall_percentage: 52, from_grid_percentage: 0, self_powered_percentage: 100,
  total_solar_percentage: 77, total_solar: 23.8, from_solar: 14.8, from_powerwall: 16.0, from_grid: 0, total_house: 30.8,
};
const zero: ImpactFigures = Object.fromEntries(Object.keys(day).map((key) => [key, 0])) as ImpactFigures;

afterEach(cleanup);

const section = (name: string) => screen.getByRole("region", { name });
// How much of its track a bar shows: what its clip leaves uncovered.
const shown = (meter: HTMLElement) =>
  100 - Number((meter.firstChild as HTMLElement).style.clipPath.match(/^inset\(0(?:px)? ([\d.e-]+)% 0(?:px)? 0(?:px)? round 8px\)$/)?.[1]);

test("Self Powered explains itself and shows the self-powered share in the ring and each source in the legend", () => {
  render(<SelfPowered figures={day} />);
  const self = section("Self powered");
  expect(self.textContent).toContain("Home use met by solar and Powerwall");
  expect(within(self).getByRole("img", { name: "Home use: 48% Solar, 52% Powerwall, 0% Grid" }).textContent).toContain("100%");
  expect(within(self).getAllByRole("listitem").map((li) => li.textContent)).toEqual(["48%Solar", "52%Powerwall", "0%Grid"]);
});

test("the ring draws an arc for each share above zero, one after another", () => {
  const { container } = render(<SelfPowered figures={{ ...day, from_solar_percentage: 35, from_powerwall_percentage: 60, from_grid_percentage: 5 }} />);
  const arcs = [...container.querySelectorAll("circle[data-share]")];
  expect(arcs.map((arc) => [arc.getAttribute("data-share"), arc.getAttribute("pathLength"), arc.getAttribute("stroke-dasharray"), arc.getAttribute("stroke-dashoffset")]))
    .toEqual([["solar", "100", "35 100", "0"], ["powerwall", "100", "60 100", "-35"], ["grid", "100", "5 100", "-95"]]);
  render(<SelfPowered figures={day} />);
  expect([...document.querySelectorAll("circle[data-share]")].map((arc) => arc.getAttribute("data-share")).slice(3)).toEqual(["solar", "powerwall"]);
});

test("shares that round to 101 still close the ring, without overlapping", () => {
  const { container } = render(<SelfPowered figures={{ ...day, from_solar_percentage: 34, from_powerwall_percentage: 33, from_grid_percentage: 34 }} />);
  const arcs = [...container.querySelectorAll("circle[data-share]")];
  expect(arcs.map((arc) => [arc.getAttribute("pathLength"), arc.getAttribute("stroke-dasharray"), arc.getAttribute("stroke-dashoffset")]))
    .toEqual([["101", "34 101", "0"], ["101", "33 101", "-34"], ["101", "34 101", "-67"]]);
});

test("Solar Offset explains itself and shows the offset and labeled bars on one scale", () => {
  render(<SolarOffset figures={day} />);
  const offset = section("Solar offset");
  expect(offset.textContent).toContain("Solar generated against home use");
  expect(offset.textContent).toContain("77%energy offset");
  const bars = within(offset).getAllByRole("meter");
  expect(bars.map((bar) => [bar.getAttribute("aria-label"), bar.getAttribute("aria-valuetext")])).toEqual([["Solar", "23.8 kWh"], ["Home", "30.8 kWh"]]);
  expect(shown(bars[0])).toBeCloseTo(77.3, 5);
  expect(shown(bars[1])).toBe(100);
});

test("totals of 1,000 kWh or more are shown in MWh, and whole numbers keep their decimal", () => {
  render(<SolarOffset figures={{ ...day, total_solar: 12345.6, total_house: 15200 }} />);
  expect(screen.getAllByRole("meter").map((bar) => bar.getAttribute("aria-valuetext"))).toEqual(["12.3 MWh", "15.2 MWh"]);
  cleanup();
  render(<SolarOffset figures={{ ...day, total_solar: 24 }} />);
  expect(screen.getAllByRole("meter")[0].getAttribute("aria-valuetext")).toBe("24.0 kWh");
});

test("a range without saved days shows zeros and empty bars", () => {
  render(<><SelfPowered figures={zero} /><SolarOffset figures={zero} /></>);
  expect(document.querySelectorAll("circle[data-share]")).toHaveLength(0);
  expect(screen.getAllByRole("meter").map(shown)).toEqual([0, 0]);
  expect(section("Self powered").textContent).toContain("0%");
});

// site-motion: the ring sweeps round on first view and moves to new shares; the figures roll; the bars uncover.
test("on first view the ring sweeps round, and later shares move by transition", () => {
  vi.useFakeTimers();
  const { container } = render(<SelfPowered figures={day} />);
  const arcs = [...container.querySelectorAll<SVGElement>("circle[data-share]")];
  expect(arcs.every((arc) => arc.classList.contains("motion-sweep") && arc.classList.contains("motion-tween"))).toBe(true);
  expect(arcs[0].style.getPropertyValue("--whole")).toBe("100");
  act(() => vi.advanceTimersByTime(650));
  expect(arcs.some((arc) => arc.classList.contains("motion-sweep"))).toBe(false);
  expect(arcs.every((arc) => arc.classList.contains("motion-tween"))).toBe(true);
  vi.useRealTimers();
});

test("new shares roll the ring's middle and the legend, with the new figures for screen readers at once", () => {
  vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame", "performance", "setTimeout", "clearTimeout"] });
  const { rerender } = render(<SelfPowered figures={day} />);
  rerender(<SelfPowered figures={{ ...day, self_powered_percentage: 70, from_solar_percentage: 39, from_powerwall_percentage: 31, from_grid_percentage: 30 }} />);
  const ring = within(section("Self powered")).getByRole("img");
  expect(ring.querySelector("span[aria-hidden=true]")!.textContent).toBe("100%");
  expect(ring.querySelector(".sr-only")!.textContent).toBe("70%");
  expect(within(section("Self powered")).getAllByRole("listitem")[0].querySelector(".sr-only")!.textContent).toBe("39%");
  act(() => vi.advanceTimersByTime(450));
  expect(within(section("Self powered")).getAllByRole("listitem").map((li) => li.textContent)).toEqual(["39%Solar", "31%Powerwall", "30%Grid"]);
  vi.useRealTimers();
});

test("Solar offset's bars uncover from the left, one after the other, to the share each shows", () => {
  render(<SolarOffset figures={day} />);
  const fills = screen.getAllByRole("meter").map((bar) => bar.firstChild as HTMLElement);
  expect(fills.every((fill) => fill.classList.contains("motion-uncover"))).toBe(true);
  // Rounded as the track is, so its left end matches the track's while the uncover's clip rounds less.
  expect(fills.every((fill) => fill.classList.contains("rounded-md"))).toBe(true);
  expect(fills.map((fill) => fill.style.getPropertyValue("--i"))).toEqual(["0", "1"]);
  expect(fills.every((fill) => fill.style.clipPath.includes(` ${fill.style.getPropertyValue("--hidden")} `))).toBe(true);
});

test("new figures move Solar offset's bars from their old length, and roll its figures", () => {
  vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame", "performance", "setTimeout", "clearTimeout"] });
  const { rerender } = render(<SolarOffset figures={day} />);
  act(() => vi.advanceTimersByTime(650));
  const fill = screen.getAllByRole("meter")[0].firstChild as HTMLElement;
  expect(fill.classList.contains("motion-uncover")).toBe(false);
  expect(fill.classList.contains("motion-tween")).toBe(true);
  rerender(<SolarOffset figures={{ ...day, total_solar_percentage: 50, total_solar: 15.4 }} />);
  expect(screen.getAllByRole("meter")[0].firstChild).toBe(fill);
  expect(shown(screen.getAllByRole("meter")[0])).toBeCloseTo(50, 3);
  const offset = section("Solar offset");
  expect(offset.querySelector("p span[aria-hidden=true]")!.textContent).toBe("77%");
  expect(offset.querySelector("p .sr-only")!.textContent).toBe("50%");
  act(() => vi.advanceTimersByTime(450));
  expect(offset.textContent).toContain("50%energy offset");
  expect(offset.textContent).toContain("15.4 kWh");
  vi.useRealTimers();
});
