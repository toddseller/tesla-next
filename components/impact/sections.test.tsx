// @vitest-environment jsdom
// The Self Powered and Solar Offset sections of the impact-report spec, ported from anton-tesla-api-ws Impact.test.jsx.
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";

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
  expect(bars.map((bar) => (bar.firstChild as HTMLElement).style.width)).toEqual(["77.2727%", "100%"]);
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
  expect(screen.getAllByRole("meter").map((bar) => (bar.firstChild as HTMLElement).style.width)).toEqual(["0%", "0%"]);
  expect(section("Self powered").textContent).toContain("0%");
});
