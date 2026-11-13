// Ported from anton-tesla-api-ws tesla-api-frontend/client/src/utils/weather.test.js.
import { test, expect } from "vitest";
import { turn, weatherAt, windText, withSplit } from "@/lib/scene/weather";

// As /api/intervals returns them, in the site's time zone.
const READINGS = [
  { start: "2026-10-21T09:00:00-07:00", cover: 0.2, rain: 0 },
  { start: "2026-10-21T10:00:00-07:00", cover: 0.8, rain: 0.4 },
  { start: "2026-10-21T10:15:00-07:00", cover: 1, rain: 1 },
];
const t = (iso: string) => new Date(iso).getTime();

test("blends linearly between the readings around the time", () => {
  expect(weatherAt(READINGS, t("2026-10-21T09:30:00-07:00"), "cover")).toBeCloseTo(0.5);
  expect(weatherAt(READINGS, t("2026-10-21T10:05:00-07:00"), "cover")).toBeCloseTo(0.8 + 0.2 / 3);
});

test("an exact reading gives its own cover", () => {
  expect(weatherAt(READINGS, t("2026-10-21T10:00:00-07:00"), "cover")).toBe(0.8);
});

test("before the first and after the last reading, the nearest one", () => {
  expect(weatherAt(READINGS, t("2026-10-21T00:00:00-07:00"), "cover")).toBe(0.2);
  expect(weatherAt(READINGS, t("2026-10-21T23:00:00-07:00"), "cover")).toBe(1);
});

test("no readings, no cover", () => {
  expect(weatherAt([], t("2026-10-21T10:00:00-07:00"), "cover")).toBeNull();
  expect(weatherAt(undefined, t("2026-10-21T10:00:00-07:00"), "cover")).toBeNull();
});

test("rain blends between readings like the cover", () => {
  expect(weatherAt(READINGS, t("2026-10-21T09:30:00-07:00"), "rain")).toBeCloseTo(0.2);
  expect(weatherAt(READINGS, t("2026-10-21T10:15:00-07:00"), "rain")).toBe(1);
  expect(weatherAt([], t("2026-10-21T10:00:00-07:00"), "rain")).toBeNull();
});

test("the wind across the scene blends through zero when it turns", () => {
  const turning = [
    { start: "2026-10-21T09:00:00-07:00", cover: 1, rain: 0, wind: -10 },
    { start: "2026-10-21T10:00:00-07:00", cover: 1, rain: 0, wind: 10 },
  ];
  expect(weatherAt(turning, t("2026-10-21T09:30:00-07:00"), "wind")).toBeCloseTo(0);
  expect(weatherAt(turning, t("2026-10-21T09:15:00-07:00"), "wind")).toBeCloseTo(-5);
});

// Rain, and fog without the airport's report, arrive without the split.
test("a reading without the split is its cover as low cloud", () => {
  expect(withSplit({ start: "x", cover: 1, rain: 0.4, low: null, mid: null, cirrus: null })).toEqual({ start: "x", cover: 1, rain: 0.4, low: 1, mid: 0, cirrus: 0 });
});

test("a reading with the split, or without a cover, is unchanged", () => {
  const split = { cover: 0.5, low: 0.4, mid: null, cirrus: 0.2 };
  expect(withSplit(split)).toBe(split);
  const none = { cover: null, low: null, mid: null };
  expect(withSplit(none)).toBe(none);
});

test("the wind readout in mph, from the reading in km/h", () => {
  expect(windText(29, 56, 225)).toBe("18 mph, gusts 35 mph, from SW");
  expect(windText(29, null, 225)).toBe("18 mph from SW");
  expect(windText(3, 6, 90)).toBe("Calm"); // 1.9 mph
  expect(windText(4, null, 90)).toBe("2 mph from E");
});

test("no wind reading without a speed or a direction", () => {
  expect(windText(null, null, null)).toBe("No wind reading");
  expect(windText(undefined, 40, 225)).toBe("No wind reading");
  expect(windText(29, 56, null)).toBe("No wind reading");
});

test.each([
  [0, "N"], [22, "N"], [23, "NE"], [67, "NE"], [68, "E"], [135, "SE"], [180, "S"], [225, "SW"], [270, "W"], [315, "NW"], [337, "NW"], [338, "N"], [359, "N"],
])("wind from %i degrees reads from %s", (direction, point) => {
  expect(windText(20, null, direction)).toBe(`12 mph from ${point}`);
});

test("a direction turns the shorter way round, through north", () => {
  expect(turn(350, 10, 0.5)).toBe(0);
  expect(turn(10, 350, 0.5)).toBe(0);
  expect(turn(350, 10, 0.25)).toBe(355);
  expect(turn(90, 180, 0.5)).toBe(135);
  expect(turn(0, 180, 1)).toBe(180);
});

test("replay blends the wind's direction through north and its speed linearly", () => {
  const turning = [
    { start: "2026-10-21T09:00:00-07:00", windSpeed: 20, windDirection: 340 },
    { start: "2026-10-21T10:00:00-07:00", windSpeed: 40, windDirection: 20 },
  ];
  expect(weatherAt(turning, t("2026-10-21T09:30:00-07:00"), "windDirection")).toBe(0);
  expect(weatherAt(turning, t("2026-10-21T09:15:00-07:00"), "windDirection")).toBe(350);
  expect(weatherAt(turning, t("2026-10-21T09:30:00-07:00"), "windSpeed")).toBe(30);
});

test("a direction missing on one side keeps the other's", () => {
  const older = [
    { start: "2026-10-21T09:00:00-07:00", windDirection: null },
    { start: "2026-10-21T10:00:00-07:00", windDirection: 200 },
  ];
  expect(weatherAt(older, t("2026-10-21T09:30:00-07:00"), "windDirection")).toBe(200);
});

test("gusts missing on both sides stay missing, and missing on one side keep the other's", () => {
  const none = [
    { start: "2026-10-21T09:00:00-07:00", windSpeed: 20, windGusts: null },
    { start: "2026-10-21T10:00:00-07:00", windSpeed: 30, windGusts: null },
  ];
  expect(weatherAt(none, t("2026-10-21T09:30:00-07:00"), "windGusts")).toBeNull();
  const later = [none[0], { ...none[1], windGusts: 50 }];
  expect(weatherAt(later, t("2026-10-21T09:30:00-07:00"), "windGusts")).toBe(50);
});
