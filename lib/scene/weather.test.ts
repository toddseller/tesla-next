// Ported from anton-tesla-api-ws tesla-api-frontend/client/src/utils/weather.test.js.
import { test, expect } from "vitest";
import { weatherAt, withSplit } from "@/lib/scene/weather";

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
