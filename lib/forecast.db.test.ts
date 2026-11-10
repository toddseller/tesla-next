// forecast() (solar-forecast spec): the stored forecast and the 30 days that scale it, against a database of its own.
import type { Client } from "pg";
import { afterAll, beforeAll, expect, test, vi } from "vitest";

import { ownDatabase } from "@/test/true-up";

let owner: Client;
let forecast: typeof import("./forecast").forecast;

const TODAY = "2026-11-10";
const FETCHED = new Date("2026-11-10T17:20:00Z");

const solar = (date: string, kwh: number) => owner.query("INSERT INTO data (date, solar_generated) VALUES ($1, $2)", [date, kwh]);
const forecastFor = (day: string, mj: number, code = 0, daylight: number | null = null) =>
  owner.query("INSERT INTO solar_forecast VALUES ($1, $2, $3, $4, $5)", [day, mj, code, FETCHED, daylight]);
const reading = (at: string, code: number) =>
  owner.query("INSERT INTO weather_sample (sampled_at, weather_code, cloud_cover) VALUES ($1, $2, 0)", [at, code]);

beforeAll(async () => {
  owner = await ownDatabase("tsr_forecast");
  ({ forecast } = await import("./forecast"));
  // October 11 to November 9: 30 kWh a day under 12 MJ/m², November 1 the best at 37 kWh.
  for (let n = 1; n <= 30; n++) {
    const day = new Date(Date.UTC(2026, 10, 10 - n)).toISOString().slice(0, 10);
    await solar(day, day === "2026-11-01" ? 37 : day === "2026-10-20" ? 50 : 30);
    // October 20 has no forecast, so neither its kWh nor its 50 kWh best counts.
    if (day !== "2026-10-20") await forecastFor(day, 12);
  }
  // Before the 30 days, so left out.
  await solar("2026-10-01", 60);
  await forecastFor("2026-10-01", 20);
  // Today so far, and the forecast for today, the next three days and one more.
  await solar(TODAY, 9.6);
  await forecastFor("2026-11-10", 12.5, 45);
  // Fog only overnight: the daylight code stands in for the daily one.
  await forecastFor("2026-11-11", 13.25, 45, 3);
  await forecastFor("2026-11-12", 9, 51);
  await forecastFor("2026-11-13", 5.25, 81);
  await forecastFor("2026-11-14", 14);
  await reading("2026-11-10T17:30:00Z", 45);
  await reading("2026-11-10T17:45:00Z", 0);
});

afterAll(async () => {
  await owner.end();
  vi.unstubAllEnvs();
});

test("the scale and the good day come from the 30 days before today that have both a solar total and a forecast", async () => {
  const { scale } = await forecast(TODAY);
  expect(scale.days).toBe(29);
  expect(scale.solar_kwh).toBeCloseTo(28 * 30 + 37);
  expect(scale.radiation_mj).toBeCloseTo(29 * 12);
  expect(scale.good_day).toBe(37);
});

test("today's and the next three days' forecasts, and today's solar so far", async () => {
  const { rows, so_far } = await forecast(TODAY);
  expect(rows).toEqual([
    { day: "2026-11-10", radiation_mj: 12.5, weather_code: 45, fetched_at: FETCHED.toISOString() },
    { day: "2026-11-11", radiation_mj: 13.25, weather_code: 3, fetched_at: FETCHED.toISOString() },
    { day: "2026-11-12", radiation_mj: 9, weather_code: 51, fetched_at: FETCHED.toISOString() },
    { day: "2026-11-13", radiation_mj: 5.25, weather_code: 81, fetched_at: FETCHED.toISOString() },
  ]);
  expect(so_far).toBe(9.6);
});

test("the sky now is the newest weather reading", async () => {
  const { reading } = await forecast(TODAY);
  expect(reading).toEqual({ code: 0, sampled_at: "2026-11-10T17:45:00.000Z" });
});

test("with nothing stored there is no scale, no forecast, no solar so far and no reading", async () => {
  await owner.query("DELETE FROM data; DELETE FROM solar_forecast; DELETE FROM weather_sample");
  expect(await forecast(TODAY)).toEqual({
    scale: { solar_kwh: 0, radiation_mj: 0, days: 0, good_day: null }, rows: [], so_far: null, reading: null,
  });
});
