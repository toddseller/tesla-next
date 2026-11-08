// Ported from anton-tesla-api-ws tests/test_weather.py (the sky's arithmetic), with the same values.
import { expect, test } from "vitest";
import { coverFrom, rainFrom, shareFrom, skyFrom, windAcross, windsAloft } from "./weather";

test.each([
  [0, 0, 0],
  [3, 85, 0.85],
  [45, 40, 1],
  [61, 20, 1],
  [95, 50, 1],
  [2, 30, 0.3],
])("cover from code %s at %s%% is %s", (code, cloudCover, cover) => {
  expect(coverFrom(code, cloudCover)).toBe(cover);
});

test.each([
  [2, 55, [0, 0, 55], 0.1375], // thin cirrus, the 2026-10-25 reading
  [3, 90, [90, 0, 0], 0.9], // the marine layer
  [3, 100, [60, 50, 80], 1], // every layer, capped
  [45, 40, [40, 0, 0], 1], // fog stays overcast
  [3, 70, [null, null, null], 0.7], // stored before the split
  [3, 70, [40, null, 10], 0.7],
] as const)("cover weighs the layers: code %s, %s%%, layers %j is %s", (code, cloudCover, [low, mid, high], cover) => {
  expect(coverFrom(code, cloudCover, low, mid, high)).toBeCloseTo(cover, 12);
});

test.each([
  [2, 55, 0.55], // thin cirrus
  [3, 0, 0],
  [2, 90, 0.9], // a marine layer
  [45, 30, null], // fog hides it
  [63, 80, null], // so does rain
  [3, null, null], // stored before the split
])("share from code %s at %s%% is %s", (code, percent, share) => {
  expect(shareFrom(code, percent)).toBe(share);
});

test.each([
  [51, 0.2], [53, 0.3], [55, 0.4], // drizzle
  [56, 0.3], [57, 0.4], // freezing drizzle
  [61, 0.4], [63, 0.7], [65, 1], // rain
  [66, 0.5], [67, 0.9], // freezing rain
  [71, 0.4], [73, 0.7], [75, 1], [77, 0.3], // snow, shown as rain
  [80, 0.5], [81, 0.8], [82, 1], // showers
  [85, 0.5], [86, 0.8], // snow showers
  [95, 1], [96, 1], [99, 1], // thunderstorms
  [0, 0], [3, 0], [45, 0], [48, 0], // dry, fog included
])("rain from code %s is %s", (code, rain) => {
  expect(rainFrom(code)).toBe(rain);
});

test.each([
  [12.5, 56, -10.4], // from the northeast: toward the scene's left
  [20, 270, 20], // from the west: toward the right
  [20, 90, -20], // from the east: toward the left
  [15, 0, 0], // from the north: toward the viewer, nothing across
  [null, null, null], // stored before wind was kept
])("wind %s km/h from %s degrees blows %s across the scene", (speed, direction, across) => {
  expect(windAcross(speed, direction)).toBe(across);
});

test("north wind gives 0, not -0", () => {
  expect(Object.is(windAcross(15, 0), 0)).toBe(true);
});

test("winds aloft are each cloud band's wind across the scene", () => {
  expect(windsAloft(20, 270, 20, 90, null, null)).toEqual({ windLow: 20, windMid: -20, windHigh: null });
});

test.each([
  ["the marine layer burned off", 3, [100, 0, 0], [0, 0], { low: 0, mid: 0, cirrus: 0, cover: 0 }],
  ["a fog bank at night", 2, [10, 0, 0], [100, 0], { low: 1, mid: 0, cover: 1 }],
  ["mid and high cloud the airport can't see", 3, [0, 98, 98], [0, 0], { low: 0, mid: 0.98, cirrus: 0.98 }],
  ["mid cloud the service misses", 2, [0, 0, 0], [0, 75], { mid: 0.75, cover: 0.45 }],
  ["fog the airport doesn't see", 45, [40, 0, 0], [19, 0], { low: 0.19, cover: 0.19 }],
  ["fog the airport sees", 45, [40, 0, 0], [100, 0], { low: 1, cover: 1 }],
  ["rain still makes it overcast", 61, [60, 40, 0], [44, 0], { low: null, mid: null, cirrus: null, cover: 1 }],
  ["without the airport, fog is overcast", 45, [40, 0, 0], [null, null], { low: null, cover: 1 }],
  ["without the service's split the airport isn't used", 3, [null, null, null], [0, 0], { low: null, mid: null, cirrus: null, cover: 0.7 }],
] as const)("the sky: %s", (_, code, [low, mid, high], [airportLow, airportMid], expected) => {
  const sky = skyFrom(code, 70, low, mid, high, airportLow, airportMid);
  for (const [key, value] of Object.entries(expected)) {
    if (value === null) expect(sky[key as keyof typeof sky]).toBeNull();
    else expect(sky[key as keyof typeof sky]).toBeCloseTo(value, 12);
  }
});
