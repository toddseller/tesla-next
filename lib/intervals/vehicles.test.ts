// Ported from anton-tesla-api-ws tests/test_vehicles.py (names and session cars), with the same values. anton stores
// its vehicle list in the `vehicle` table, `streamed` already excluding IGNORE_VEHICLES.
import { Client } from "pg";
import { afterAll, beforeAll, expect, inject, test, vi } from "vitest";
import { type Car, carName, sessionVin } from "./vehicles";

const R2D2 = "5YJYGDEE0TEST0001";
const TIE = "5YJYGDEE0TEST0002";
const LIST: Car[] = [
  { vin: R2D2, display_name: "R2D2", streamed: true },
  { vin: TIE, display_name: "Tesla T.I.E. Fighter", streamed: true },
  { vin: "5YJYGDEE0TEST0003", display_name: "", streamed: false },
];

test("names come from the stored list", () => {
  expect(carName(LIST, R2D2)).toBe("R2D2");
  expect(carName(LIST, TIE)).toBe("Tesla T.I.E. Fighter");
});

test("an unknown or unnamed VIN is Vehicle", () => {
  expect(carName(LIST, "5YJYGDEE0UNKNOWN0")).toBe("Vehicle");
  expect(carName(LIST, "5YJYGDEE0TEST0003")).toBe("Vehicle");
});

const MODEL_Y = "7SAYGDEE0TEST0001";
const MODEL_3 = "5YJ3E1EA0TEST0002";
const TWO_MODELS: Car[] = [
  { vin: MODEL_Y, display_name: "R2D2", streamed: true },
  { vin: MODEL_3, display_name: "Tesla T.I.E. Fighter", streamed: true },
];

test.each([
  [13278, 5076, MODEL_Y], // 9.4 kW
  [8000, 3600, MODEL_Y], // exactly 8 kW
  [46311, 21855, MODEL_3], // 7.6 kW
  [6500, 3600, MODEL_3], // exactly 6.5 kW
  [5500, 3600, null], // slow: could be either
  [40, 0, null],
])("a session of %s Wh over %s s charged %s", (energyWh, durationS, expected) => {
  expect(sessionVin(TWO_MODELS, energyWh, durationS)).toBe(expected);
});

test("two cars of one model name neither", () => {
  const cars: Car[] = [TWO_MODELS[0], { vin: "7SAYGDEE0TEST0009", display_name: "BB8", streamed: true }];
  expect(sessionVin(cars, 13278, 5076)).toBeNull();
});

test("a car that isn't streamed (ignored) is not inferred", () => {
  const cars: Car[] = [{ ...TWO_MODELS[0], streamed: false }, TWO_MODELS[1]];
  expect(sessionVin(cars, 13278, 5076)).toBeNull();
  expect(sessionVin(cars, 46311, 21855)).toBe(MODEL_3);
});

test("no known cars name nothing", () => {
  expect(sessionVin([], 13278, 5076)).toBeNull();
});

const pg = inject("pg");
let owner: Client;

beforeAll(async () => {
  owner = new Client({ ...pg });
  await owner.connect();
});

afterAll(async () => {
  await owner.query("DELETE FROM vehicle WHERE vin LIKE '%VEHTEST%'");
  await owner.end();
  vi.unstubAllEnvs();
});

test("the list is read from the vehicle table anton writes", async () => {
  await owner.query("INSERT INTO vehicle VALUES ('5YJYGDEE0VEHTEST1', 'R2D2', true), ('5YJYGDEE0VEHTEST2', '', false)");
  vi.stubEnv("DATABASE_URL", `postgresql://${pg.user}:${pg.password}@/${pg.database}?host=${pg.host}`);
  vi.resetModules();
  const { loadCars } = await import("./vehicles");
  expect(await loadCars()).toEqual(
    expect.arrayContaining([
      { vin: "5YJYGDEE0VEHTEST1", display_name: "R2D2", streamed: true },
      { vin: "5YJYGDEE0VEHTEST2", display_name: "", streamed: false },
    ]),
  );
});
