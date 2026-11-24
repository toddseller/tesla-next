import { expect, test } from "vitest";
import { energy, energyAxis, unitsFor } from "@/lib/units";

const US = { temperature: "F", wind: "mph" };
const METRIC = { temperature: "C", wind: "km/h" };

test.each([
  ["en-US,en;q=0.9", US],
  ["de-DE,de;q=0.9,en;q=0.8", METRIC],
  ["en-GB", { temperature: "C", wind: "mph" }],
  ["es-PR", US],
  ["en-BZ", { temperature: "F", wind: "km/h" }],
  ["fr,fr-FR;q=0.8,en-US;q=0.5", METRIC],
  ["zh-Hant-TW", METRIC],
])("%s reads in its region's units", (header, units) => {
  expect(unitsFor(header)).toEqual(units);
});

test.each(["en", "*", "", "not a tag!,en", null])("%j has no region, so US units", (header) => {
  expect(unitsFor(header)).toEqual(US);
});

test.each([
  [999.9, 1, undefined, ["999.9", "kWh"]],
  [1000, 1, undefined, ["1.0", "MWh"]],
  [75660, 0, undefined, ["75.7", "MWh"]],
  [1086.2, 0, undefined, ["1.1", "MWh"]],
  [556.1, 0, undefined, ["556", "kWh"]],
  [987.6, 1, 1204.3, ["1.0", "MWh"]],
  [1234567, 0, undefined, ["1,234.6", "MWh"]],
  [-1500, 1, undefined, ["-1.5", "MWh"]],
  // The unit follows the figure as shown: these round up to 1,000 kWh.
  [999.96, 1, undefined, ["1.0", "MWh"]],
  [999.6, 0, undefined, ["1.0", "MWh"]],
  [999.4, 0, undefined, ["999", "kWh"]],
] as const)("%s kWh to %s digits, list topping at %s, reads %j", (kwh, digits, top, read) => {
  expect(energy(kwh, digits, top)).toEqual(read);
});

test.each([
  [[0, 20000, 40000, 60000, 80000], ["0", "20", "40", "60", "80 MWh"]],
  [[-1000, 0, 1000, 1500], ["-1", "0", "1", "1.5 MWh"]],
  [[0, 20, 40, 60], ["0", "20", "40", "60 kWh"]],
  [[0, 500, 999], ["0", "500", "999 kWh"]],
])("an axis of %j kWh reads %j", (ticks, read) => {
  expect(ticks.map((tick, i) => energyAxis(ticks.at(-1)!)(tick, i, ticks.length))).toEqual(read);
});
