// The Solar page's forecast card from the stored forecast (solar-forecast spec).
import { expect, test } from "vitest";

import { forecastCard, type ForecastData } from "./forecast";

const TODAY = "2026-11-10";
// 10:00 AM site time, PST.
const NOW = Date.parse("2026-11-10T18:00:00Z");
const FRESH = "2026-11-10T17:20:00Z";

// The last 30 days made 900 kWh under 360 MJ/m², 2.5 kWh per MJ/m²; their best day was 37 kWh.
const data = (overrides: Partial<ForecastData> = {}): ForecastData => ({
  scale: { solar_kwh: 900, radiation_mj: 360, days: 30, good_day: 37 },
  rows: [
    { day: "2026-11-10", radiation_mj: 12.4, weather_code: 0, fetched_at: FRESH },
    { day: "2026-11-11", radiation_mj: 13.2, weather_code: 0, fetched_at: FRESH },
    { day: "2026-11-12", radiation_mj: 5.6, weather_code: 45, fetched_at: FRESH },
    { day: "2026-11-13", radiation_mj: 10.8, weather_code: 2, fetched_at: FRESH },
  ],
  so_far: 9.6,
  reading: null,
  ...overrides,
});

test("each day's expected kWh is its forecast sunlight times the last 30 days' kWh per MJ/m², to a whole kWh", () => {
  const card = forecastCard(data(), TODAY, NOW);
  expect(card.today).toEqual({ day: TODAY, soFar: 9.6, expected: 31, code: 0, sky: "forecast" });
  expect(card.days).toEqual([
    { day: "2026-11-11", expected: 33, code: 0 },
    { day: "2026-11-12", expected: 14, code: 45 },
    { day: "2026-11-13", expected: 27, code: 2 },
  ]);
  expect(card.goodDay).toBe(37);
  expect(card.staleSince).toBeNull();
});

test("with fewer than 7 days behind the scale there is no forecast, only today's kWh so far", () => {
  const card = forecastCard(data({ scale: { solar_kwh: 150, radiation_mj: 60, days: 5, good_day: 37 } }), TODAY, NOW);
  expect(card.days).toBeNull();
  expect(card.today).toEqual({ day: TODAY, soFar: 9.6, expected: null, code: 0, sky: "forecast" });
});

test("a forecast over 6 hours old says when it is from; one 40 minutes old doesn't", () => {
  const at = (fetched_at: string) => data({ rows: data().rows.map((row) => ({ ...row, fetched_at })) });
  expect(forecastCard(at("2026-11-10T11:15:00Z"), TODAY, NOW).staleSince).toBe("2026-11-10T11:15:00Z");
  expect(forecastCard(at(FRESH), TODAY, NOW).staleSince).toBeNull();
});

test("with no forecast for the days ahead from the last 24 hours, the days give way and today keeps its kWh so far", () => {
  const old = data({ rows: data().rows.map((row) => ({ ...row, fetched_at: "2026-11-09T16:00:00Z" })) });
  const card = forecastCard(old, TODAY, NOW);
  expect(card.days).toBeNull();
  expect(card.today.expected).toBeNull();
  expect(card.today.soFar).toBe(9.6);
  // A 26-hour-old time would read as today's.
  expect(card.staleSince).toBeNull();
});

// Today forecast foggy (45) while the sky is clear (0).
const foggy = (reading: ForecastData["reading"]) =>
  data({ rows: data().rows.map((row) => (row.day === TODAY ? { ...row, weather_code: 45 } : row)), reading });

test("a reading 10 minutes old is today's sky now, in daylight and after sunset; the days ahead keep the forecast", () => {
  const day = forecastCard(foggy({ code: 0, sampled_at: "2026-11-10T17:50:00Z" }), TODAY, NOW);
  expect(day.today).toMatchObject({ code: 0, sky: "now" });
  expect(day.days).toEqual(forecastCard(data(), TODAY, NOW).days);
  // 9:00 PM site time.
  const night = forecastCard(foggy({ code: 0, sampled_at: "2026-11-11T04:50:00Z" }), TODAY, Date.parse("2026-11-11T05:00:00Z"));
  expect(night.today).toMatchObject({ code: 0, sky: "night" });
});

test("a reading 4 hours old, or none, leaves today's forecast sky", () => {
  expect(forecastCard(foggy({ code: 0, sampled_at: "2026-11-10T14:00:00Z" }), TODAY, NOW).today).toMatchObject({ code: 45, sky: "forecast" });
  expect(forecastCard(foggy(null), TODAY, NOW).today).toMatchObject({ code: 45, sky: "forecast" });
});
