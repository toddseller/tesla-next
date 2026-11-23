import { expect, test } from "vitest";

import { stackEnds } from "./bars";

const SQUARE = { top: false, bottom: false };

// House use is a mark at its own value, not a section of the stack, so it never rounds.
test("a bar above zero rounds the top of grid and the bottom of solar", () => {
  expect(stackEnds({ solar: 37.1, grid: 10.6, powerwall: 0, house: 47.7 })).toEqual({
    solar: { top: false, bottom: true },
    grid: { top: true, bottom: false },
    powerwall: SQUARE,
    house: SQUARE,
  });
});

test("grid below zero takes the bottom and solar the top; solar's end at zero stays square", () => {
  expect(stackEnds({ solar: 44.4, grid: -8.3, powerwall: 0, house: 36.1 })).toEqual({
    solar: { top: true, bottom: false },
    grid: { top: false, bottom: true },
    powerwall: SQUARE,
    house: SQUARE,
  });
});

test("a bar with one section rounds both its ends", () => {
  expect(stackEnds({ solar: 0, grid: 2.5, powerwall: 0, house: 2.5 })).toEqual({
    solar: SQUARE,
    grid: { top: true, bottom: true },
    powerwall: SQUARE,
    house: SQUARE,
  });
});

test("an empty month has no ends", () => {
  expect(stackEnds({ solar: null, grid: null, powerwall: null, house: null })).toEqual({
    solar: SQUARE, grid: SQUARE, powerwall: SQUARE, house: SQUARE,
  });
});

// solar-range-chart, "Bar values": the Powerwall stacks on top above zero, and under negative grid below it.
test("a Powerwall above zero takes the top, over solar and grid", () => {
  expect(stackEnds({ solar: 22.5, grid: 10.0, powerwall: 11.9, house: 44.4 })).toEqual({
    solar: { top: false, bottom: true },
    grid: SQUARE,
    powerwall: { top: true, bottom: false },
    house: SQUARE,
  });
});

test("a Powerwall below zero takes the bottom, under negative grid", () => {
  expect(stackEnds({ solar: 44.4, grid: -8.3, powerwall: -2.1, house: 34.0 })).toEqual({
    solar: { top: true, bottom: false },
    grid: SQUARE,
    powerwall: { top: false, bottom: true },
    house: SQUARE,
  });
});
