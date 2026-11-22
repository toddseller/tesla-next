// Now's balance (home-story spec, "Now in a sentence"): the signed flows the sentence is written from.
import { expect, test } from "vitest";

import { balance } from "./balance";

const live = (over: Partial<Parameters<typeof balance>[0]> = {}) => ({ solarPower: 0, homePower: 0, batteryPower: 0, gridPower: 0, ...over });

test("each source signed as the scene reads it: the Powerwalls negative while charging, the grid while exporting", () => {
  expect(balance(live({ solarPower: 6.2, batteryPower: -3.1, gridPower: -2.0 })).sources).toEqual([
    { name: "Solar", kw: 6.2 }, { name: "Powerwall", kw: -3.1 }, { name: "Grid", kw: -2.0 },
  ]);
});

test("a source under 0.05 kW is left out, as the scene shows it at 0", () => {
  expect(balance(live({ solarPower: 0.04, gridPower: 0.5 })).sources).toEqual([{ name: "Grid", kw: 0.5 }]);
});
