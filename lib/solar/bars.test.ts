import { expect, test } from "vitest";

import { stackEnds } from "./bars";

test("a bar above zero rounds the top of house and the bottom of solar", () => {
  expect(stackEnds({ solar: 37.1, grid: 10.6, house: 50.8 })).toEqual({
    solar: { top: false, bottom: true },
    grid: { top: false, bottom: false },
    house: { top: true, bottom: false },
  });
});

test("grid below zero takes the bottom; solar's end at zero stays square", () => {
  expect(stackEnds({ solar: 44.4, grid: -8.3, house: 34.0 })).toEqual({
    solar: { top: false, bottom: false },
    grid: { top: false, bottom: true },
    house: { top: true, bottom: false },
  });
});

test("a bar with one section rounds both its ends", () => {
  expect(stackEnds({ solar: 0, grid: 2.5, house: null })).toEqual({
    solar: { top: false, bottom: false },
    grid: { top: true, bottom: true },
    house: { top: false, bottom: false },
  });
});

test("an empty month has no ends", () => {
  expect(stackEnds({ solar: null, grid: null, house: null })).toEqual({
    solar: { top: false, bottom: false },
    grid: { top: false, bottom: false },
    house: { top: false, bottom: false },
  });
});
