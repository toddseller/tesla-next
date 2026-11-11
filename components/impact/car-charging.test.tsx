// @vitest-environment jsdom
// The Home car charging section (car-charging spec, mockup A).
import { act, cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

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
  expect(section().getByText("140").parentElement!.textContent).toBe("140 kWh");
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

// The stretch of its track a piece of a split shows, from its clip: [left, right] as % of the track, gaps aside.
const stretch = (piece: HTMLElement) => {
  const [, right, left] = piece.style.clipPath.match(/^inset\(0(?:px)? (?:calc\()?([\d.]+)%.*? 0(?:px)? (?:calc\()?([\d.]+)%/)!;
  return [Number(left), 100 - Number(right)];
};
const pieces = (car: RegExp) => [...section().getByRole("img", { name: car }).children] as HTMLElement[];

test("a car's split shows its sources side by side, each cut to its stretch with a gap between", () => {
  render(<CarChargingSection charging={CHARGING} range={ALL_TIME} />);
  const fighter = pieces(/^Tesla T\.I\.E\. Fighter:/);
  expect(fighter.map(stretch)).toEqual([[0, 22], [22, 63], [63, 100]]);
  expect(fighter.map((piece) => piece.style.clipPath)).toEqual([
    "inset(0px calc(78% + 1px) 0px 0%)", "inset(0px calc(37% + 1px) 0px calc(22% + 1px))", "inset(0px 0% 0px calc(63% + 1px))",
  ]);
});

test("new figures move each car's split and the ring from their old shares, and roll the kWh", () => {
  vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame", "performance", "setTimeout", "clearTimeout"] });
  const { rerender } = render(<CarChargingSection charging={CHARGING} range={ALL_TIME} />);
  act(() => vi.advanceTimersByTime(650));
  const split = section().getByRole("img", { name: /^R2D2:/ });
  const first = pieces(/^R2D2:/);
  expect(split.classList.contains("motion-uncover")).toBe(false);
  expect(first.every((piece) => piece.classList.contains("motion-tween"))).toBe(true);
  const moved = { ...CHARGING, total_kwh: 200, cars: [CHARGING.cars[1], { ...CHARGING.cars[0], solar_percentage: 0, powerwall_percentage: 63, kwh: 100 }] };
  rerender(<CarChargingSection charging={moved} range={ALL_TIME} />);
  expect(section().getByRole("img", { name: /^R2D2:/ })).toBe(split);
  expect(pieces(/^R2D2:/)).toEqual(first);
  const fighter = pieces(/^Tesla T\.I\.E\. Fighter:/);
  expect(fighter.map(stretch)).toEqual([[0, 0], [0, 63], [63, 100]]);
  expect(fighter[1].style.clipPath).toBe("inset(0px calc(37% + 1px) 0px 0%)");
  expect(section().getByText("4,155.3")).toBeTruthy();
  act(() => vi.advanceTimersByTime(450));
  expect(section().getByText("200")).toBeTruthy();
  vi.useRealTimers();
});

test("a car new to the range uncovers on its own", () => {
  vi.useFakeTimers();
  const { rerender } = render(<CarChargingSection charging={{ ...CHARGING, cars: [CHARGING.cars[0]] }} range={ALL_TIME} />);
  act(() => vi.advanceTimersByTime(650));
  rerender(<CarChargingSection charging={CHARGING} range={ALL_TIME} />);
  expect(section().getByRole("img", { name: /^R2D2:/ }).classList.contains("motion-uncover")).toBe(true);
  expect(section().getByRole("img", { name: /^Tesla T\.I\.E\. Fighter:/ }).classList.contains("motion-uncover")).toBe(false);
  vi.useRealTimers();
});

test("two cars of one name each keep their own row", () => {
  const error = vi.spyOn(console, "error").mockImplementation(() => {});
  const twins = { ...CHARGING, cars: CHARGING.cars.map((car) => ({ ...car, name: "Tesla" })) };
  const { rerender } = render(<CarChargingSection charging={twins} range={ALL_TIME} />);
  rerender(<CarChargingSection charging={{ ...twins, cars: [twins.cars[1], twins.cars[0]] }} range={ALL_TIME} />);
  expect(section().getAllByRole("img", { name: /^Tesla:/ }).map((split) => split.getAttribute("aria-label")))
    .toEqual(["Tesla: 48% Solar, 12% Powerwall, 40% Grid", "Tesla: 22% Solar, 41% Powerwall, 37% Grid"]);
  expect(error.mock.calls.flat().join(" ")).not.toMatch(/same key/);
  error.mockRestore();
});
