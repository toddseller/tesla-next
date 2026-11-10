// carCharging (car-charging spec): home charging over a range, by source and by measured car.
import type { Client } from "pg";
import { afterAll, beforeAll, expect, test, vi } from "vitest";

import { ownDatabase } from "@/test/true-up";

let owner: Client;
let carCharging: typeof import("./car-charging").carCharging;

const R2D2 = "5YJYGDEE0TEST0001";
const TIE = "5YJ3GDEE0TEST0002"; // a Model 3, by its 4th character
const TODAY = "2026-11-09";
// A PDT (UTC-7) time in October 2026, as UTC milliseconds.
const at = (day: number, hour: number, minute: number) => Date.UTC(2026, 9, day, hour + 7, minute);

const COLUMNS = [
  "solar_generated_wh", "grid_imported_wh", "grid_exported_from_solar_wh", "grid_exported_from_battery_wh", "battery_exported_wh",
  "battery_imported_from_grid_wh", "battery_imported_from_solar_wh", "house_from_solar_wh",
];
// A whole day of home use, from the grid unless `battery` names the intervals that ran on the Powerwall.
async function day(date: number, wh: (t: number) => number, battery: (t: number) => boolean = () => false) {
  for (let t = at(date, 0, 0); t < at(date + 1, 0, 0); t += 300_000) {
    const [grid, powerwall] = battery(t) ? [0, wh(t)] : [wh(t), 0];
    await owner.query(
      `INSERT INTO energy_interval (start_at, day, house_from_grid_wh, house_from_battery_wh, ${COLUMNS.join(", ")}) VALUES ($1, $2, $3, $4${", 0".repeat(COLUMNS.length)})`,
      [new Date(t), `2026-10-${String(date).padStart(2, "0")}`, grid, powerwall],
    );
  }
}

beforeAll(async () => {
  owner = await ownDatabase("tsr_car_charging");
  ({ carCharging } = await import("./car-charging"));
  await owner.query("INSERT INTO vehicle VALUES ($1, 'R2D2', true), ($2, 'Tesla T.I.E. Fighter', true)", [R2D2, TIE]);
  // October 5: a 3.8 kWh session at 7.6 kW, which the replay credits to the Model 3, all from the grid.
  const charge = (t: number) => t >= at(5, 22, 0) && t < at(5, 22, 30);
  await day(5, (t) => (charge(t) ? 720 : 80));
  await owner.query("INSERT INTO charge_session VALUES ($1, 1800, 3800)", [new Date(at(5, 22, 0))]);
  // October 10, the spec's night: R2D2 measured taking 10 kWh, 6 while the home ran on the Powerwall and 4 on the grid.
  const night = (t: number) => t >= at(10, 1, 0) && t < at(10, 2, 40);
  await day(10, (t) => (night(t) ? 500 : 80), (t) => t < at(10, 2, 0));
  for (let t = at(10, 1, 0); t < at(10, 2, 40); t += 300_000) await owner.query("INSERT INTO vehicle_interval VALUES ($1, 500, $2)", [new Date(t), R2D2]);
});

afterAll(async () => {
  await owner.end();
  vi.unstubAllEnvs();
});

test("the spec's Powerwall night: 10 kWh, 60% Powerwall and 40% grid, all of it R2D2's", async () => {
  expect(await carCharging("2026-10-10", "2026-10-10", TODAY)).toEqual({
    since: null, cars_since: null,
    total_kwh: 10, solar_kwh: 0, powerwall_kwh: 6, grid_kwh: 4,
    solar_percentage: 0, powerwall_percentage: 60, grid_percentage: 40, off_grid_percentage: 60,
    cars: [{ name: "R2D2", kwh: 10, solar_percentage: 0, powerwall_percentage: 60, grid_percentage: 40 }],
  });
});

test("a range from before the first session counts from it, and the session counts toward the household only", async () => {
  const answer = (await carCharging("2026-10-01", "2026-10-10", TODAY))!;
  expect(answer).toMatchObject({ since: "2026-10-05", cars_since: "2026-10-10", total_kwh: 13.8, grid_kwh: 7.8, powerwall_kwh: 6 });
  expect(answer.cars).toEqual([{ name: "R2D2", kwh: 10, solar_percentage: 0, powerwall_percentage: 60, grid_percentage: 40 }]);
});

test("a range before any charging data counts nothing and says from when there is some", async () => {
  expect(await carCharging("2026-09-01", "2026-09-30", TODAY)).toMatchObject({ since: "2026-10-05", total_kwh: 0, cars: [] });
});

test("an idle day in the covered period is 0 kWh, with no shares and no cars", async () => {
  expect(await carCharging("2026-10-08", "2026-10-08", TODAY)).toMatchObject({
    total_kwh: 0, solar_percentage: 0, powerwall_percentage: 0, grid_percentage: 0, off_grid_percentage: 0, cars: [],
  });
});

test("no VIN leaves", async () => {
  const text = JSON.stringify(await carCharging("2026-10-01", TODAY, TODAY));
  expect(text).not.toContain(R2D2);
  expect(text).not.toContain(TIE);
});
