// live-flow-scene, "Christmas lights": the bulbs' places along the roof's edges.
import { expect, test } from "vitest";

import { CHRISTMAS_LIGHTS, STAGE } from "./layout";

test("six runs of bulbs, 64 in all, every one on the stage", () => {
  expect(Object.keys(CHRISTMAS_LIGHTS)).toEqual(["garageFront", "garageEast", "recessSlope", "recessEave", "bayFront", "powerwallSide"]);
  const bulbs = Object.values(CHRISTMAS_LIGHTS).flat();
  expect(bulbs).toHaveLength(64);
  for (const [x, y] of bulbs) {
    expect(x).toBeGreaterThan(0);
    expect(x).toBeLessThan(STAGE.width);
    expect(y).toBeGreaterThan(0);
    expect(y).toBeLessThan(STAGE.height);
  }
});
