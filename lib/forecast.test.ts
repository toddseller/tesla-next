// The Solar page's forecast card from the stored forecast (solar-forecast spec).
import { expect, test } from "vitest";

import { forecastCard, type ForecastData, observedCode } from "./forecast";

const TODAY = "2026-11-10";
// 10:00 AM site time, PST.
const NOW = Date.parse("2026-11-10T18:00:00Z");
const FRESH = "2026-11-10T17:20:00Z";

// The last 30 days made 900 kWh under 360 MJ/m², 2.5 kWh per MJ/m²; their best day was 37 kWh.
const data = (overrides: Partial<ForecastData> = {}): ForecastData => ({
  scale: { solar_kwh: 900, radiation_mj: 360, days: 30, good_day: 37 },
  rows: [
    { day: "2026-11-10", radiation_mj: 12.4, weather_code: 0, fetched_at: FRESH, temperature_max: 16.2, temperature_min: 9.4 },
    { day: "2026-11-11", radiation_mj: 13.2, weather_code: 0, fetched_at: FRESH, temperature_max: 17.8, temperature_min: 11.1 },
    // A high without a low, as on no day anton stores, shows neither.
    { day: "2026-11-12", radiation_mj: 5.6, weather_code: 45, fetched_at: FRESH, temperature_max: 15, temperature_min: null },
    { day: "2026-11-13", radiation_mj: 10.8, weather_code: 2, fetched_at: FRESH, temperature_max: null, temperature_min: null },
  ],
  so_far: 9.6,
  reading: null,
  hourly: { scale: [], days: 0, hours: [], made_until: null },
  ...overrides,
});

test("each day's expected kWh is its forecast sunlight times the last 30 days' kWh per MJ/m², to a whole kWh", () => {
  const card = forecastCard(data(), TODAY, NOW);
  expect(card.today).toEqual({ day: TODAY, soFar: 9.6, expected: 31, code: 0, sky: "forecast", temperature: null });
  expect(card.days).toEqual([
    { day: "2026-11-11", expected: 33, code: 0, byHour: null, high: 64, low: 52 },
    { day: "2026-11-12", expected: 14, code: 45, byHour: null, high: null, low: null },
    { day: "2026-11-13", expected: 27, code: 2, byHour: null, high: null, low: null },
  ]);
  expect(card.goodDay).toBe(37);
  expect(card.staleSince).toBeNull();
});

test("the good day is a whole kWh, as the stored real arrives with float noise", () => {
  const card = forecastCard(data({ scale: { ...data().scale, good_day: 43.29999923706055 } }), TODAY, NOW);
  expect(card.goodDay).toBe(43);
  expect(forecastCard(data({ scale: { ...data().scale, good_day: null } }), TODAY, NOW).goodDay).toBeNull();
});

test("with fewer than 7 days behind the scale there is no forecast, only today's kWh so far", () => {
  const card = forecastCard(data({ scale: { solar_kwh: 150, radiation_mj: 60, days: 5, good_day: 37 } }), TODAY, NOW);
  expect(card.days).toBeNull();
  expect(card.today).toEqual({ day: TODAY, soFar: 9.6, expected: null, code: 0, sky: "forecast", temperature: null });
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
  const day = forecastCard(foggy({ ...sample(0, 0), sampled_at: "2026-11-10T17:50:00Z" }), TODAY, NOW);
  expect(day.today).toMatchObject({ code: 0, sky: "now" });
  expect(day.days).toEqual(forecastCard(data(), TODAY, NOW).days);
  // 9:00 PM site time.
  const night = forecastCard(foggy({ ...sample(0, 0), sampled_at: "2026-11-11T04:50:00Z" }), TODAY, Date.parse("2026-11-11T05:00:00Z"));
  expect(night.today).toMatchObject({ code: 0, sky: "night" });
});

test("today's sky now is the observed sky: the model's few clouds under the airport's clear sky read sunny, day and night", () => {
  // As at 10:00 AM on 2026-11-11: code 1 from 21% model low cloud, none at the airport.
  const morning = forecastCard(foggy({ ...sample(1, 21, 0), sampled_at: "2026-11-10T17:50:00Z" }), TODAY, NOW);
  expect(morning.today).toMatchObject({ code: 0, sky: "now" });
  const night = forecastCard(foggy({ ...sample(1, 5), sampled_at: "2026-11-11T04:50:00Z" }), TODAY, Date.parse("2026-11-11T05:00:00Z"));
  expect(night.today).toMatchObject({ code: 0, sky: "night" });
});

test("a reading 4 hours old, or none, leaves today's forecast sky", () => {
  expect(forecastCard(foggy({ ...sample(0, 0), sampled_at: "2026-11-10T14:00:00Z" }), TODAY, NOW).today).toMatchObject({ code: 45, sky: "forecast" });
  expect(forecastCard(foggy(null), TODAY, NOW).today).toMatchObject({ code: 45, sky: "forecast" });
});

// solar-forecast, "Temperatures on the tiles".
test("today's temperature is the recent reading's in whole °F, none when the reading is old, missing or has none", () => {
  const at = (sampled_at: string, temperature: number | null) => forecastCard(foggy({ ...sample(0, 0), temperature, sampled_at }), TODAY, NOW).today.temperature;
  expect(at("2026-11-10T17:50:00Z", 14.6)).toBe(58);
  expect(at("2026-11-10T17:50:00Z", -3.1)).toBe(26);
  expect(at("2026-11-10T14:00:00Z", 14.6)).toBeNull();
  expect(at("2026-11-10T17:50:00Z", null)).toBeNull();
  expect(forecastCard(foggy(null), TODAY, NOW).today.temperature).toBeNull();
});

// solar-forecast, "The sky". Every day forecast to snow, moderate (73) unless given, with the given low.
const snowy = (low: number | null, reading: ForecastData["reading"] = null, code = 73) =>
  data({ rows: data().rows.map((row) => ({ ...row, weather_code: code, temperature_min: low })), reading });

test("a forecast day's snow reads as rain when its low is above freezing", () => {
  const mild = forecastCard(snowy(8.9), TODAY, NOW);
  expect(mild.today).toMatchObject({ code: 61, sky: "forecast" });
  expect(mild.days!.map((d) => d.code)).toEqual([61, 61, 61]);
  for (const low of [-1.5, 0, null]) expect(forecastCard(snowy(low), TODAY, NOW).days!.map((d) => d.code)).toEqual([73, 73, 73]);
  const mildDay = (code: number) => forecastCard(snowy(8.9, null, code), TODAY, NOW).days![0].code;
  for (const code of [71, 77, 85, 86]) expect(mildDay(code)).toBe(61);
  for (const code of [70, 80]) expect(mildDay(code)).toBe(code);
});

test("a recent reading's snow is left as it is", () => {
  expect(forecastCard(snowy(8.9, { ...sample(73, 100), sampled_at: "2026-11-10T17:50:00Z" }), TODAY, NOW).today).toMatchObject({ code: 73, sky: "now" });
});

// 1 Wh per W/m² at every daylight hour, so an hour expects its W/m² over 1,000 in kWh. November 8's hours at 1:40 PM.
const SCALE = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16].map((hour) => ({ hour, wh: 30_000, wm2: 30_000 }));
const PST = (hour: number, date = 10) => new Date(Date.UTC(2026, 10, date, hour + 8)).toISOString();
const NOV_8: [number, number, number | null][] = [
  [5, 0, null], [6, 0, 10], [7, 690, 340], [8, 3160, 1740], [9, 4340, 2470], [10, 5740, 5000], [11, 5260, 5900],
  [12, 4570, 5380], [13, 4100, 3100], [14, 3060, null], [15, 1590, null], [16, 300, null], [17, 0, null],
];
// Thursday, November 12: a gray day, nothing made yet.
const NOV_12: [number, number][] = [[5, 0], [6, 0], [7, 300], [8, 1500], [9, 2200], [10, 2800], [11, 3000], [12, 2800], [13, 2200], [14, 1400], [15, 600], [16, 100], [17, 0]];
const thursday = NOV_12.map(([hour, wm2]) => ({ day: "2026-11-12", start_at: PST(hour, 12), wm2, made_wh: null }));
const hourly = (madeUntil: string | null, days = 30, rows = NOV_8, ahead = thursday): ForecastData["hourly"] => ({
  scale: SCALE, days, made_until: madeUntil,
  hours: [...rows.map(([hour, wm2, made]) => ({ day: TODAY, start_at: PST(hour), wm2, made_wh: made })), ...ahead],
});
const byHour = (madeUntil: string | null, days?: number, rows?: typeof NOV_8) =>
  forecastCard(data({ hourly: hourly(madeUntil, days, rows) }), TODAY, NOW).byHour;

test("each hour expects its sunlight times its hour of the day's scale, from the first to the last hour with sunlight or 0.05 kWh made", () => {
  const card = byHour("2026-11-10T21:40:00Z")!;
  expect(card.hours.map((h) => h.start)).toEqual([7, 8, 9, 10, 11, 12, 13, 14, 15, 16].map((hour) => PST(hour)));
  expect(card.hours[2]).toEqual({ start: PST(9), expected: 4.34, made: 2.47 });
  expect(card.hours[7]).toEqual({ start: PST(14), expected: 3.06, made: null });
});

test("an hour of the day without a scale expects nothing", () => {
  const scaled = forecastCard(data({ hourly: { ...hourly(null), scale: SCALE.filter((s) => s.hour !== 9) } }), TODAY, NOW).byHour!;
  expect(scaled.hours.find((h) => h.start === PST(9))!.expected).toBe(0);
});

test("made against expected by the newest interval's end: the hours over and the share of the current one", () => {
  const { byNow } = byHour("2026-11-10T21:40:00Z")!;
  expect(byNow!.at).toBe("2026-11-10T21:40:00Z");
  // 6 AM's 10 Wh count too: the day's made, not only the shown hours'.
  expect(byNow!.made).toBeCloseTo(23.94);
  expect(byNow!.expected).toBeCloseTo(23.76 + (4.1 * 40) / 60);
  expect(byNow!.over).toBe(false);
});

test("before the first hour there is no made-against-expected; after the last it covers the whole day", () => {
  expect(byHour("2026-11-10T14:15:00Z")!.byNow).toBeNull();
  expect(byHour(null)!.byNow).toBeNull();
  const evening = byHour("2026-11-11T01:30:00Z", 30, NOV_8.map(([hour, wm2, made]) => [hour, wm2, hour >= 14 && hour <= 16 ? 500 : made]))!;
  expect(evening.byNow).toMatchObject({ over: true });
  expect(evening.byNow!.expected).toBeCloseTo(32.81);
});

test("no hourly panel without an hour today or with fewer than 7 days to scale by", () => {
  expect(byHour("2026-11-10T21:40:00Z", 6)).toBeNull();
  expect(byHour(null, 30, [])).toBeNull();
  expect(byHour("2026-11-10T21:40:00Z", 7)).not.toBeNull();
});

test("a day ahead's hours expect their sunlight times today's scale, from its first to its last hour with sunlight, none made", () => {
  const days = forecastCard(data({ hourly: hourly("2026-11-10T21:40:00Z") }), TODAY, NOW).days!;
  const thu = days.find((d) => d.day === "2026-11-12")!.byHour!;
  expect(thu.hours.map((h) => h.start)).toEqual([7, 8, 9, 10, 11, 12, 13, 14, 15, 16].map((hour) => PST(hour, 12)));
  expect(thu.hours[3]).toEqual({ start: PST(10, 12), expected: 2.8, made: null });
  expect(thu.byNow).toBeNull();
});

test("a day ahead without forecast hours has none, and no day ahead has hours when today has none", () => {
  const days = (h: ForecastData["hourly"]) => forecastCard(data({ hourly: h }), TODAY, NOW).days!.map((d) => d.byHour !== null);
  expect(days(hourly("2026-11-10T21:40:00Z"))).toEqual([false, true, false]);
  expect(days(hourly("2026-11-10T21:40:00Z", 6))).toEqual([false, false, false]);
  expect(days(hourly(null, 30, []))).toEqual([false, false, false]);
});

test("past the last forecast hour the day isn't over until the sun has set", () => {
  // As on 2026-11-10: no sunlight forecast from 4 PM, though the panels still make a little until sunset at about 4:58.
  const rows = NOV_8.map(([hour, wm2, made]): (typeof NOV_8)[number] => [hour, hour === 16 ? 0 : wm2, hour === 14 || hour === 15 ? 500 : made]).filter(([hour]) => hour !== 16);
  expect(byHour("2026-11-11T00:05:00Z", 30, rows)!.byNow).toMatchObject({ over: false });
  expect(byHour("2026-11-11T01:30:00Z", 30, rows)!.byNow).toMatchObject({ over: true });
});

// solar-forecast, "The sky now": the sky the Distribution scene draws, the airport's low cloud over the model's.
const sample = (code: number, low: number, airport: number | null = null) =>
  ({ code, cloud_cover: low, cloud_cover_low: low, cloud_cover_mid: 0, cloud_cover_high: 0, airport_low: airport, airport_mid: airport === null ? null : 0, temperature: null });

test("the observed sky's code follows its cover: under 25% sunny, under 75% partly cloudy, then cloudy", () => {
  expect(observedCode(sample(1, 21, 0))).toBe(0);
  expect(observedCode(sample(1, 21, 44))).toBe(2);
  expect(observedCode(sample(3, 90, 75))).toBe(3);
  expect(observedCode(sample(3, 90, 100))).toBe(3);
  expect(observedCode(sample(1, 21))).toBe(0);
  expect(observedCode(sample(1, 27))).toBe(2);
});

test("fog needs an overcast low sky; rain keeps its code", () => {
  expect(observedCode(sample(45, 100))).toBe(45);
  expect(observedCode(sample(45, 100, 0))).toBe(0);
  expect(observedCode(sample(45, 100, 100))).toBe(45);
  expect(observedCode(sample(61, 100, 44))).toBe(61);
});
