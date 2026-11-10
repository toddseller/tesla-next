// forecast() (solar-forecast spec): the stored forecast and the 30 days that scale it, against a database of its own.
import type { Client } from "pg";
import { afterAll, beforeAll, expect, test, vi } from "vitest";

import { ownDatabase } from "@/test/true-up";

let owner: Client;
let forecast: typeof import("./forecast").forecast;
let expectedHours: typeof import("./forecast").expectedHours;

const TODAY = "2026-11-10";
const FETCHED = new Date("2026-11-10T17:20:00Z");

const solar = (date: string, kwh: number) => owner.query("INSERT INTO data (date, solar_generated) VALUES ($1, $2)", [date, kwh]);
const forecastFor = (day: string, mj: number, code = 0, daylight: number | null = null) =>
  owner.query("INSERT INTO solar_forecast VALUES ($1, $2, $3, $4, $5)", [day, mj, code, FETCHED, daylight]);
const sunlight = (startAt: string, wm2: number) =>
  owner.query("INSERT INTO solar_forecast_hour VALUES ($1, $2, $3)", [startAt, wm2, FETCHED]);
const made = (startAt: string, day: string, wh: number) =>
  owner.query(
    `INSERT INTO energy_interval VALUES ($1, $2, $3, 0, 0, 0, 0, 0, 0, 0, 0, 0)`,
    [startAt, day, wh],
  );
const reading = (at: string, code: number) =>
  owner.query("INSERT INTO weather_sample (sampled_at, weather_code, cloud_cover) VALUES ($1, $2, 0)", [at, code]);

beforeAll(async () => {
  owner = await ownDatabase("tsr_forecast");
  ({ forecast, expectedHours } = await import("./forecast"));
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
  // The 10 AM hours (18:00 UTC, PST) of November 8 and 9: 3,600 Wh under 900 W/m², 9's in two intervals.
  await sunlight("2026-11-08T18:00:00Z", 500);
  await made("2026-11-08T18:00:00Z", "2026-11-08", 2000);
  await sunlight("2026-11-09T18:00:00Z", 400);
  await made("2026-11-09T18:00:00Z", "2026-11-09", 1000);
  await made("2026-11-09T18:05:00Z", "2026-11-09", 600);
  // 11 AM on November 9 has no forecast, and November 7 no intervals, so neither counts; October 1 is too old.
  await made("2026-11-09T19:00:00Z", "2026-11-09", 900);
  await sunlight("2026-11-07T18:00:00Z", 450);
  await sunlight("2026-10-01T17:00:00Z", 600);
  await made("2026-10-01T17:00:00Z", "2026-10-01", 3000);
  // Today: 10 AM under way to 10:10, 11 AM ahead, and tomorrow's 10 AM left out.
  await sunlight("2026-11-10T18:00:00Z", 532.4);
  await sunlight("2026-11-10T19:00:00Z", 583);
  await sunlight("2026-11-11T18:00:00Z", 300);
  await made("2026-11-10T18:00:00Z", TODAY, 250);
  await made("2026-11-10T18:05:00Z", TODAY, 300);
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

test("each hour of the day's scale comes from the 30 days before today's hours with both sunlight and intervals", async () => {
  const { hourly } = await forecast(TODAY);
  expect(hourly.scale).toEqual([{ hour: 10, wh: 3600, wm2: 900 }]);
  expect(hourly.days).toBe(2);
});

test("today's forecast hours with what each has made so far, and when the newest interval ends", async () => {
  const { hourly } = await forecast(TODAY);
  expect(hourly.today).toEqual([
    { start_at: "2026-11-10T18:00:00.000Z", wm2: 532.4, made_wh: 550 },
    { start_at: "2026-11-10T19:00:00.000Z", wm2: 583, made_wh: null },
  ]);
  expect(hourly.made_until).toBe("2026-11-10T18:10:00.000Z");
});

// April 2026, PDT: the 10 AM hours (17:00 UTC) of April 8 to 15 made 4,000 Wh each under 500 W/m², 8 Wh per W/m²,
// twice November's 4.
async function april() {
  for (let date = 8; date <= 15; date++) {
    const day = `2026-04-${String(date).padStart(2, "0")}`;
    await sunlight(`${day}T17:00:00Z`, 500);
    await made(`${day}T17:00:00Z`, day, 4000);
  }
  await sunlight("2026-04-16T17:00:00Z", 600);
  await sunlight("2026-04-16T18:00:00Z", 300);
}

test("a past day's hours are scaled by the 30 days before that day, an hour of the day without a scale expecting 0", async () => {
  await april();
  expect(await expectedHours("2026-04-16")).toEqual([
    { start: "2026-04-16T17:00:00.000Z", kwh: 4.8 },
    { start: "2026-04-16T18:00:00.000Z", kwh: 0 },
  ]);
});

test("a day with fewer than 7 scale days, or without forecast hours, has no expected hours", async () => {
  expect(await expectedHours(TODAY)).toEqual([]);
  expect(await expectedHours("2026-04-20")).toEqual([]);
});

test("with nothing stored there is no scale, no forecast, no solar so far, no reading and no hours", async () => {
  await owner.query("DELETE FROM data; DELETE FROM solar_forecast; DELETE FROM weather_sample; DELETE FROM energy_interval; DELETE FROM solar_forecast_hour");
  expect(await forecast(TODAY)).toEqual({
    scale: { solar_kwh: 0, radiation_mj: 0, days: 0, good_day: null }, rows: [], so_far: null, reading: null,
    hourly: { scale: [], days: 0, today: [], made_until: null },
  });
});
