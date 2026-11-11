// @vitest-environment jsdom
// The Home car charging section (car-charging spec, mockup A).
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";

import { CarChargingSection } from "@/components/impact/car-charging";
import type { CarCharging } from "@/lib/car-charging";

afterEach(cleanup);

const ALL_TIME = { start: "2021-10-22", end: "2026-11-09" };
const CHARGING: CarCharging = {
  since: "2025-10-20", cars_since: "2026-10-17",
  total_kwh: 4155.3, solar_kwh: 1412.8, powerwall_kwh: 1121.9, grid_kwh: 1620.6,
  solar_percentage: 34, powerwall_percentage: 27, grid_percentage: 39, off_grid_percentage: 61,
  cars: [
    { name: "Tesla T.I.E. Fighter", kwh: 140, solar_percentage: 22, powerwall_percentage: 41, grid_percentage: 37 },
    { name: "R2D2", kwh: 54, solar_percentage: 48, powerwall_percentage: 12, grid_percentage: 40 },
  ],
};
const section = () => within(screen.getByRole("region", { name: "Home car charging" }));

test("the ring shows the share off the grid, with the kWh and each source in the legend", () => {
  render(<CarChargingSection charging={CHARGING} range={ALL_TIME} />);
  expect(section().getByRole("img", { name: "Car charging: 34% Solar, 27% Powerwall, 39% Grid" }).textContent).toContain("61%");
  expect(section().getByText("4,155.3")).toBeTruthy();
  expect(section().getAllByRole("listitem").map((li) => li.textContent)).toEqual(["34%Solar", "27%Powerwall", "39%Grid"]);
});

test("a range from before the data says from when it counts, and from when cars were measured", () => {
  render(<CarChargingSection charging={CHARGING} range={ALL_TIME} />);
  expect(section().getByText("Since Oct 20, 2025, the oldest charging Tesla kept")).toBeTruthy();
  expect(section().getByText("By car, measured from Oct 17, 2026")).toBeTruthy();
});

test("each car has a line with its kWh and its own split", () => {
  render(<CarChargingSection charging={CHARGING} range={ALL_TIME} />);
  expect(section().getByRole("img", { name: "Tesla T.I.E. Fighter: 22% Solar, 41% Powerwall, 37% Grid" })).toBeTruthy();
  expect(section().getByRole("img", { name: "R2D2: 48% Solar, 12% Powerwall, 40% Grid" })).toBeTruthy();
  expect(section().getByText("140 kWh")).toBeTruthy();
});

test("a range inside the data says nothing about where it starts", () => {
  render(<CarChargingSection charging={{ ...CHARGING, since: null, cars_since: null }} range={{ start: "2026-11-01", end: "2026-11-09" }} />);
  expect(section().queryByText(/^Since/)).toBeNull();
  expect(section().getByText("By car")).toBeTruthy();
});

const IDLE: CarCharging = {
  ...CHARGING, since: null, cars_since: null, total_kwh: 0, solar_kwh: 0, powerwall_kwh: 0, grid_kwh: 0,
  solar_percentage: 0, powerwall_percentage: 0, grid_percentage: 0, off_grid_percentage: 0, cars: [],
};

test("an idle day says there was no home charging, with an empty ring and no car lines", () => {
  const { container } = render(<CarChargingSection charging={IDLE} range={{ start: "2026-11-09", end: "2026-11-09" }} />);
  expect(section().getByText("No home charging on November 9, 2026")).toBeTruthy();
  expect(container.querySelectorAll("circle[data-share]")).toHaveLength(0);
  expect(section().queryByText(/^By car/)).toBeNull();
});

test("a range before the data says there is none before it starts", () => {
  render(<CarChargingSection charging={{ ...IDLE, since: "2025-10-20" }} range={{ start: "2024-03-01", end: "2024-03-31" }} />);
  expect(section().getByText("No charging data before Oct 20, 2025")).toBeTruthy();
});

// site-motion: each car's split uncovers as one piece, so its shares never look other than they are.
test("each car's split bar uncovers as one piece, one car after the other", () => {
  render(<CarChargingSection charging={CHARGING} range={ALL_TIME} />);
  const splits = [section().getByRole("img", { name: /^Tesla T\.I\.E\. Fighter:/ }), section().getByRole("img", { name: /^R2D2:/ })];
  expect(splits.every((split) => split.classList.contains("motion-uncover"))).toBe(true);
  expect(splits.map((split) => split.style.getPropertyValue("--i"))).toEqual(["0", "1"]);
  expect(splits[0].querySelector(".motion-uncover")).toBeNull();
});
