// dayCharging (car-charging design): the day's charging per 5 minutes, and which intervals the Wall Connector named
// a car for by measurement rather than by a session's power.
import type { Client } from "pg";
import { afterAll, beforeAll, expect, test } from "vitest";

import { ownDatabase } from "@/test/true-up";

let owner: Client;
let dayCharging: typeof import("./intervals").dayCharging;

const R2D2 = "5YJYGDEE0TEST0001";
const TIE = "5YJ3GDEE0TEST0002"; // a Model 3, by its 4th character
// A PDT (UTC-7) time in October 2026, as UTC milliseconds.
const at = (day: number, hour: number, minute: number) => Date.UTC(2026, 9, day, hour + 7, minute);

beforeAll(async () => {
  owner = await ownDatabase("tsr_day_charging");
  ({ dayCharging } = await import("./intervals"));
  await owner.query("INSERT INTO vehicle VALUES ($1, 'R2D2', true), ($2, 'Tesla T.I.E. Fighter', true)", [R2D2, TIE]);
  // October 14: 1 kW all day, with charging load at 01:00 (measured) and 23:00 (a session only).
  await owner.query(
    `INSERT INTO energy_interval (start_at, day, house_from_grid_wh, solar_generated_wh, grid_imported_wh, grid_exported_from_solar_wh,
       grid_exported_from_battery_wh, battery_exported_wh, battery_imported_from_grid_wh, battery_imported_from_solar_wh, house_from_solar_wh, house_from_battery_wh)
     SELECT t, '2026-10-14', CASE WHEN t IN ($2, $3) THEN 720 ELSE 80 END, 0, 0, 0, 0, 0, 0, 0, 0, 0 FROM generate_series($1::timestamptz, $1::timestamptz + interval '1435 minutes', interval '5 minutes') t`,
    [new Date(at(14, 0, 0)), new Date(at(14, 1, 0)), new Date(at(14, 23, 0))],
  );
  await owner.query("INSERT INTO vehicle_interval VALUES ($1, 640, $2)", [new Date(at(14, 1, 0)), R2D2]);
  await owner.query("INSERT INTO charge_session VALUES ($1, 300, 635)", [new Date(at(14, 23, 0))]);
});

afterAll(() => owner.end());

test("the day's charging, with measured cars named and session cars left to the replay", async () => {
  const { charging, measuredVins, vins, intervals } = await dayCharging("2026-10-14");
  expect(charging.get(at(14, 1, 0))).toBe(640);
  expect(charging.get(at(14, 23, 0))).toBe(635);
  expect(measuredVins.get(at(14, 1, 0))).toBe(R2D2);
  expect(measuredVins.has(at(14, 23, 0))).toBe(false);
  // The replay still names the session's car by its power.
  expect(vins.get(at(14, 23, 0))).toBe(TIE);
  expect(intervals).toHaveLength(288);
});
