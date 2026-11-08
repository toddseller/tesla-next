// Ported from anton-tesla-api-ws tesla-api-frontend/client/src/utils/sun.test.js.
import { describe, test, expect } from "vitest";
import { horizontal, moonOrientation, moonPhase, moonPosition, SITE, skyAt, sunPosition, sunTimes } from "@/lib/scene/sun";

const local = (date: Date) => date.toLocaleTimeString("en-US", { timeZone: "America/Los_Angeles", hour: "numeric", minute: "2-digit" });

test("the site is Half Moon Bay, rounded to one decimal", () => {
  expect(SITE).toEqual({ lat: 37.5, lon: -122.4 });
});

test.each([
  // Published times for Half Moon Bay (sunrise-sunset.org) are within about two minutes.
  ["2026-09-28T19:00:00Z", "7:03 AM", "6:59 PM"],
  ["2026-06-21T19:00:00Z", "5:50 AM", "8:35 PM"],
  ["2026-12-21T20:00:00Z", "7:21 AM", "4:56 PM"],
])("sun times on %s", (iso, sunrise, sunset) => {
  const times = sunTimes(new Date(iso));

  expect(local(times.sunrise)).toBe(sunrise);
  expect(local(times.sunset)).toBe(sunset);
});

test.each([
  ["2026-10-19T14:00:00Z", "night"], // 7:00 AM, before the 7:22 sunrise
  ["2026-10-19T14:30:00Z", "day"],
  ["2026-10-20T01:20:00Z", "day"], // 6:20 PM, before the 6:28 sunset
  ["2026-10-20T01:40:00Z", "night"],
  ["2026-10-20T06:30:00Z", "night"], // 11:30 PM
  ["2026-10-20T09:00:00Z", "night"], // 2 AM
])("at %s it is %s", (iso, sky) => {
  expect(skyAt(new Date(iso))).toBe(sky);
});

test.each([
  // NOAA's solar calculator for the site.
  ["2026-12-21T20:00:00Z", 29, 178], // noon, low in the south
  ["2026-06-21T16:00:00Z", 35, 86], // 9 AM, in the east
  ["2026-06-21T23:00:00Z", 51, 261], // 4 PM, in the west
])("the sun at %s is %i degrees up, from %i degrees", (iso, altitude, azimuth) => {
  const sun = sunPosition(new Date(iso));

  expect(Math.abs(sun.altitude - altitude)).toBeLessThan(1);
  expect(Math.abs(sun.azimuth - azimuth)).toBeLessThan(1);
});

test.each([
  ["2026-06-21T16:00:00Z", 76], // 9 AM
  ["2026-06-22T03:00:00Z", 76], // 8 PM
  ["2025-12-21T20:00:00Z", 29],
  ["2026-10-21T22:00:00Z", 41.5],
])("on the day of %s the noon sun is %d degrees up", (iso, noonAltitude) => {
  expect(Math.abs(sunPosition(new Date(iso)).noonAltitude - noonAltitude)).toBeLessThan(0.5);
});

test("the sun is below the horizon at night", () => {
  expect(sunPosition(new Date("2026-10-20T06:30:00Z")).altitude).toBeLessThan(0);
});

describe("moon", () => {
  // From JPL Horizons' geocentric apparent right ascension and declination, placed at the site.
  test.each([
    ["2026-10-25T04:00:00Z", 41.8, 111.6], // 9 PM PDT on 2026-10-24
    ["2026-10-17T23:00:00Z", 16.4, 142.7], // 4 PM PDT on 2026-10-17, an afternoon moon
  ])("at %s it is %d degrees up at azimuth %d", (iso, altitude, azimuth) => {
    const moon = moonPosition(new Date(iso));

    expect(moon.altitude).toBeCloseTo(altitude, 0);
    expect(moon.azimuth).toBeCloseTo(azimuth, 0);
  });

  // JPL Horizons' geocentric apparent right ascension and declination, placed at the site.
  test.each([
    ["2026-10-25T04:00:00Z", 15.48485, 10.83568],
    ["2026-11-01T08:00:00Z", 124.9432, 21.74338],
    ["2026-11-08T12:00:00Z", 213.03188, -18.30049],
    ["2026-11-25T02:00:00Z", 66.80963, 26.62505],
  ])("at %s it is within half a degree of JPL Horizons", (iso, ascension, declination) => {
    const at = new Date(iso);
    const [moon, expected] = [moonPosition(at), horizontal(ascension, declination, at)];
    const r = Math.PI / 180;
    const apart = Math.acos(Math.sin(moon.altitude * r) * Math.sin(expected.altitude * r)
      + Math.cos(moon.altitude * r) * Math.cos(expected.altitude * r) * Math.cos((moon.azimuth - expected.azimuth) * r)) / r;
    expect(apart).toBeLessThan(0.5);
  });

  test("below the horizon at 2 PM on 2026-10-21", () => {
    expect(moonPosition(new Date("2026-10-21T21:00:00Z")).altitude).toBeLessThan(0);
  });

  test("during the 2024 eclipse it stands in front of the sun", () => {
    const at = new Date("2024-04-08T18:18:00Z");
    const [moon, sun] = [moonPosition(at), sunPosition(at)];

    // Their angle apart on the sky: a degree of azimuth spans less sky the higher it is.
    const r = Math.PI / 180;
    const apart = Math.acos(Math.sin(moon.altitude * r) * Math.sin(sun.altitude * r)
      + Math.cos(moon.altitude * r) * Math.cos(sun.altitude * r) * Math.cos((moon.azimuth - sun.azimuth) * r)) / r;
    expect(apart).toBeLessThan(1.5);
  });

  test.each([
    ["2024-04-23T23:49:00Z", 0.5], // full
    ["2026-10-14T02:00:00Z", 0.11], // 7 PM PDT on 2026-10-13, a waxing crescent
    ["2026-10-29T10:00:00Z", 0.62], // 3 AM PDT on 2026-10-29, a waning gibbous
  ])("its phase at %s is about %d", (iso, phase) => {
    expect(moonPhase(new Date(iso))).toBeCloseTo(phase, 2);
  });

  test("new at the 2024 eclipse", () => {
    const phase = moonPhase(new Date("2024-04-08T18:18:00Z"));
    expect(Math.min(phase, 1 - phase)).toBeLessThan(0.01);
  });
});

describe("moon's orientation", () => {
  // Degrees between two angles, the short way round.
  const off = (a: number, b: number) => Math.abs((((a - b) % 360) + 540) % 360 - 180);

  // Libration: Meeus example 53.a, then JPL Horizons' sub-Earth point (geocentric, east positive).
  test.each([
    ["1992-04-12T00:00:00Z", -1.206, 4.194],
    ["2026-11-01T08:00:00Z", 4.253, -2.726],
    ["2026-11-25T02:00:00Z", -1.58, -6.311],
    ["2027-05-20T08:00:00Z", 4.388, 6.409], // full, Mare Crisium turned in, the north tipped toward us
    ["2027-10-15T12:00:00Z", -4.584, -6.272], // full, Crisium turned out, the south tipped toward us
  ])("at %s the side facing Earth is centered on %d, %d", (iso, longitude, latitude) => {
    const { libration } = moonOrientation(new Date(iso));

    expect(Math.abs(libration.longitude - longitude)).toBeLessThan(0.5);
    expect(Math.abs(libration.latitude - latitude)).toBeLessThan(0.5);
  });

  // Counterclockwise from straight up in the unmirrored sky at the site: the pole's
  // position angle (Meeus 53.a, then Horizons) and the bright limb's (Meeus 48.a, then
  // from Horizons' sun and moon), each less the parallactic angle at the moon's
  // reference place, so a wrong parallactic sign shows as tens of degrees.
  test.each([
    ["1992-04-12T00:00:00Z", 68.8, -21.3],
    ["2026-11-01T08:00:00Z", 67.0, 158.1], // 1 AM PDT, a waning half moon rising, lit from below
    ["2026-11-13T01:30:00Z", -31.3, -117.8], // 5:30 PM, a crescent low in the southwest after sunset
    ["2026-11-25T02:00:00Z", 44.3, 98.2], // 6 PM on 2026-11-24, the full moon rising
    ["2026-11-25T15:00:00Z", -61.7, 11.3], // 7 AM, the same moon setting
  ])("at %s its axis is %d degrees from up and its lit side %d", (iso, axis, brightLimb) => {
    const moon = moonOrientation(new Date(iso));

    expect(off(moon.axis, axis)).toBeLessThan(1);
    expect(off(moon.brightLimb, brightLimb)).toBeLessThan(1);
  });
});

describe("a fixed point in the sky", () => {
  // Computed for the site from the stars' J2000 positions.
  test.each([
    ["Fomalhaut", 344.41, -29.62, 22.9, 181.2],
    ["Vega", 279.23, 38.78, 38.9, 293.3],
  ])("%s at 10 PM on 2026-10-24", (name, ascension, declination, altitude, azimuth) => {
    const at = horizontal(ascension, declination, new Date("2026-10-25T05:00:00Z"));

    expect(Math.abs(at.altitude - altitude)).toBeLessThan(0.3);
    expect(Math.abs(at.azimuth - azimuth)).toBeLessThan(0.3);
  });

  test("Polaris stands about 38 degrees up, due north", () => {
    const polaris = horizontal(37.95, 89.26, new Date("2026-10-25T05:00:00Z"));

    expect(Math.abs(polaris.altitude - 38)).toBeLessThan(0.5);
    expect(Math.min(polaris.azimuth, 360 - polaris.azimuth)).toBeLessThan(1.5);
  });
});
