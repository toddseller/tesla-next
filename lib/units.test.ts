import { expect, test } from "vitest";
import { unitsFor } from "@/lib/units";

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
