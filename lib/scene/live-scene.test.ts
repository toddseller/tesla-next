// Ported from anton-tesla-api-ws tesla-api-frontend/client/src/utils/liveScene.test.js.
import { describe, test, expect } from "vitest";
import { azimuthX } from "@/lib/scene/night-sky";
import { type Link, type LiveInput, type SceneOptions, sceneState, staleWarning, type Sunlight, type Vehicle } from "@/lib/scene/live-scene";
import { moonOrientation, moonPosition, sunPosition, sunTimes } from "@/lib/scene/sun";

const NOW = new Date("2026-10-17T22:10:00Z");
const midday: LiveInput = {
  liveReceived: true, solarPower: 6.1, homePower: 4.1, batteryPower: 0, battery: 100, gridPower: 2.0, vehicle: null,
};
const r2d2 = (overrides: Partial<Vehicle> = {}): Vehicle => ({
  name: "R2D2", color: "#C0C4C8", charging_power: 0,
  battery_level: 80, charging_state: "Complete", battery_level_at: "2026-10-17T22:01:59Z", ...overrides,
});

describe("labels", () => {
  test("midday values as in the Tesla app", () => {
    expect(sceneState(midday, NOW).labels).toEqual({
      solar: "6.1 kW", home: "4.1 kW", powerwall: "0 kW · 100%", grid: "2.0 kW", car: null,
    });
  });

  test("dashes before the first update", () => {
    expect(sceneState({ ...midday, liveReceived: false }, NOW).labels).toEqual({
      solar: "—", home: "—", powerwall: "—", grid: "—", car: null,
    });
  });

  test("exporting shows the magnitude, not a sign", () => {
    expect(sceneState({ ...midday, gridPower: -2.0 }, NOW).labels.grid).toBe("2.0 kW");
  });

  test("plugged-in car not charging", () => {
    expect(sceneState({ ...midday, vehicle: r2d2() }, NOW).labels.car).toEqual({ name: "R2D2", value: "0 kW · 80%", age: null });
  });

  test("car with unknown battery level shows name and power only", () => {
    const vehicle = r2d2({ charging_power: 7.2, battery_level: null, battery_level_at: null });

    expect(sceneState({ ...midday, vehicle }, NOW).labels.car).toEqual({ name: "R2D2", value: "7.2 kW", age: null });
  });

  test("battery level reported more than 6 hours ago shows its age", () => {
    const vehicle = r2d2({ name: "Tesla T.I.E. Fighter", battery_level: 76, battery_level_at: "2026-10-17T14:05:00Z" });

    expect(sceneState({ ...midday, vehicle }, NOW).labels.car).toEqual({ name: "Tesla T.I.E. Fighter", value: "0 kW · 76%", age: "8 h ago" });
  });

  test("a level 5 hours old has no age", () => {
    const vehicle = r2d2({ battery_level_at: "2026-10-17T17:10:00Z" });

    expect(sceneState({ ...midday, vehicle }, NOW).labels.car).toEqual({ name: "R2D2", value: "0 kW · 80%", age: null });
  });

  test("no car: no label", () => {
    expect(sceneState(midday, NOW).labels.car).toBeNull();
  });
});

describe("flows and sky", () => {
  test("exporting solar while charging the car", () => {
    const state = sceneState({ ...midday, gridPower: -2.0, vehicle: r2d2({ charging_power: 3.2 }) }, NOW);

    expect(state.flows).toEqual({ solar: "in", powerwall: null, grid: "out", car: "in" });
  });

  test("night on battery", () => {
    const state = sceneState({ ...midday, solarPower: 0, batteryPower: 1.2, gridPower: 0 }, new Date("2026-10-18T05:00:00Z"));

    expect(state.flows).toEqual({ solar: null, powerwall: "out", grid: null, car: null });
    expect(state.dusk).toBe(0);
  });

  test("Powerwall charging flows in; grid import flows in", () => {
    expect(sceneState({ ...midday, batteryPower: -4.3 }, NOW).flows.powerwall).toBe("in");
    expect(sceneState(midday, NOW).flows.grid).toBe("in");
  });

  test("0.04 kW is idle", () => {
    const state = sceneState({ ...midday, solarPower: 0.04, gridPower: 0.04, batteryPower: -0.04 }, NOW);

    expect(state.flows).toEqual({ solar: null, powerwall: null, grid: null, car: null });
  });

  test("day and night follow the sun at the site, not solar output", () => {
    // 3:10 PM and 10 PM in Half Moon Bay on 2026-10-17.
    expect(sceneState({ ...midday, solarPower: 0 }, NOW).dusk).toBe(1);
    expect(sceneState({ ...midday, solarPower: 6.1 }, new Date("2026-10-18T05:00:00Z")).dusk).toBe(0);
  });

  test("day and night are known before the first live update", () => {
    expect(sceneState({ liveReceived: false }, NOW).dusk).toBe(1);
  });

  test("no day or night switch: dusk alone carries it", () => {
    expect(sceneState(midday, NOW)).not.toHaveProperty("sky");
  });
});

describe("Powerwall charge", () => {
  const charge = (values: LiveInput) => sceneState({ ...midday, ...values }, NOW).charge;

  test("follows the battery percentage, below the reserve too", () => {
    expect(charge({ battery: 50 })).toBe(50);
    expect(charge({ battery: 8 })).toBe(8);
  });

  test("stays within 0 to 100", () => {
    expect(charge({ battery: 120 })).toBe(100);
    expect(charge({ battery: -3 })).toBe(0);
  });

  test("shows 20% before the first reading", () => {
    expect(charge({ battery: undefined })).toBe(20);
    expect(charge({ liveReceived: false })).toBe(20);
  });
});

describe("solar glow", () => {
  const glow = (values: LiveInput, options?: SceneOptions) => sceneState({ ...midday, ...values }, NOW, options).glow;

  test("none without solar, under 0.1 kW, or before the first live update", () => {
    expect(glow({ solarPower: 0 })).toBe(0);
    expect(glow({ solarPower: 0.05 })).toBe(0);
    expect(glow({ liveReceived: false })).toBe(0);
  });

  test("2% per kW up to 20% at 10 kW, then capped", () => {
    expect(glow({ solarPower: 2 })).toBeCloseTo(0.04);
    expect(glow({ solarPower: 5 })).toBeCloseTo(0.1);
    expect(glow({ solarPower: 10 })).toBeCloseTo(0.2);
    expect(glow({ solarPower: 11.3 })).toBeCloseTo(0.2);
  });

  test("follows replayed solar power", () => {
    expect(glow({ solarPower: 6, liveReceived: false }, { links: [], replay: true })).toBeCloseTo(0.12);
  });
});

describe("sunlight", () => {
  const brightest = ({ strength, peak, ...light }: Sunlight) => (Object.keys(light) as (keyof typeof light)[]).reduce((a, b) => (light[a] >= light[b] ? a : b));
  const at = (iso: string, options?: SceneOptions) => sceneState({ liveReceived: false }, new Date(iso), options).sunlight!;

  test("a summer morning lights the east faces most and the west least", () => {
    const light = at("2026-06-21T16:00:00Z"); // 9 AM

    expect(brightest(light)).toBe("east");
    expect(light.east).toBeGreaterThan(0.99);
    expect(light.west).toBe(0);
  });

  test("each face brightens and fades on its own: by 1 PM in June south is full and east has faded", () => {
    const light = at("2026-06-21T20:00:00Z");

    expect(light.south).toBeGreaterThan(0.95);
    expect(light.east).toBeLessThan(0.15);
  });

  test("a winter noon lights the south faces most", () => {
    const light = at("2026-12-21T20:00:00Z");

    expect(brightest(light)).toBe("south");
    expect(light.east).toBeLessThan(at("2026-06-21T16:00:00Z").east);
  });

  test("an afternoon lights the west faces most", () => {
    const light = at("2026-06-21T23:00:00Z"); // 4 PM

    expect(brightest(light)).toBe("west");
    expect(light.east).toBeLessThan(light.south);
  });

  test("the light's strength grows with the sun's height up to 25 degrees, in every season", () => {
    expect(at("2026-06-21T14:00:00Z").strength).toBeLessThan(0.5); // 7 AM, sun 12 degrees up
    expect(at("2026-06-21T16:00:00Z").strength).toBe(1); // 9 AM, 35 degrees
    expect(at("2025-12-21T20:00:00Z").strength).toBe(1); // noon, 29 degrees
  });

  test.each([
    ["2026-06-21T20:00:00Z", 1],
    ["2026-03-20T20:00:00Z", 0.82],
    ["2026-09-22T20:00:00Z", 0.82],
    ["2026-10-21T20:00:00Z", 0.68],
    ["2025-12-21T20:00:00Z", 0.5],
  ])("the light's peak at %s follows the season: %d", (iso, peak) => {
    expect(at(iso).peak).toBeCloseTo(peak, 1);
  });

  test("the peak changes smoothly, with no step between seasons", () => {
    expect(Math.abs(at("2026-09-21T20:00:00Z").peak - at("2026-09-23T20:00:00Z").peak)).toBeLessThan(0.01);
  });

  test("there is no sunlight at night", () => {
    expect(at("2026-06-22T05:00:00Z")).toBeNull(); // 10 PM
  });

  test("replay lights the house for the replayed time", () => {
    expect(brightest(at("2026-06-21T16:00:00Z", { links: [], replay: true }))).toBe("east");
    expect(at("2026-06-22T05:00:00Z", { links: [], replay: true })).toBeNull();
    expect(at("2025-12-21T20:00:00Z", { links: [], replay: true }).peak).toBeCloseTo(0.5, 1);
  });
});

describe("weather", () => {
  const NOON = new Date("2026-06-21T20:00:00Z");
  const state = (options?: SceneOptions) => sceneState({ liveReceived: false }, NOON, options);

  test("cloud lowers the sunlight's strength in proportion, light and shade alike", () => {
    expect(state({ cover: 0 }).sunlight!.strength).toBe(1);
    expect(state({ cover: 0.3 }).sunlight!.strength).toBeCloseTo(0.7);
    expect(state({ cover: 1 }).sunlight!.strength).toBe(0);
    expect(state({ cover: 0.3 }).sunlight!.south).toBe(state({ cover: 0 }).sunlight!.south);
  });

  test("no reading, or none yet, draws as a clear sky", () => {
    expect(state().cover).toBeUndefined();
    expect(state({ cover: null }).sunlight!.strength).toBe(1);
  });

  test("the state carries the cover, live and in replay", () => {
    expect(state({ cover: 0.85 }).cover).toBe(0.85);
    expect(state({ links: [], replay: true, cover: 0.4 }).cover).toBe(0.4);
  });

  test("night still has no sunlight", () => {
    expect(sceneState({ liveReceived: false }, new Date("2026-06-22T05:00:00Z"), { cover: 0.5 }).sunlight).toBeNull();
  });
});

describe("sun glow", () => {
  // The render looks at the house from the southeast: east on the right, west on the left.
  const glow = (date: Date) => sceneState({ liveReceived: false }, date).sunGlow!;

  test("crosses from right after sunrise to left in the evening, lower toward sunset", () => {
    const afternoon = glow(new Date("2026-10-21T21:00:00Z")); // 2 PM
    const evening = glow(new Date("2026-10-21T23:45:00Z")); // 4:45 PM

    expect(afternoon.x).toBeLessThan(0.5);
    expect(evening.x).toBeLessThan(afternoon.x);
    expect(evening.altitude).toBeLessThan(afternoon.altitude);
  });

  test("starts on the right at the horizon", () => {
    const { sunrise } = sunTimes(new Date("2026-10-21T20:00:00Z"));
    const dawn = glow(new Date(sunrise.getTime() + 60000));

    expect(dawn.x).toBeCloseTo(0.95, 2);
    expect(dawn.altitude).toBeLessThan(1);
  });

  test("its daylight grows with the sun's height, full at 25 degrees", () => {
    expect(glow(new Date("2026-10-17T23:00:00Z")).daylight).toBeGreaterThan(0.75); // 4 PM, about 21 degrees
    expect(glow(new Date("2026-10-18T01:00:00Z")).daylight).toBeCloseTo(5 / 25, 1); // 6 PM, about 5 degrees
    expect(glow(new Date("2026-10-17T20:00:00Z")).daylight).toBe(1); // 1 PM
  });

  test("there is no glow at night", () => {
    expect(glow(new Date("2026-10-22T05:00:00Z"))).toBeNull(); // 10 PM
  });

  test("at its real height: lower at noon in winter than in summer", () => {
    expect(glow(new Date("2026-12-21T20:00:00Z")).altitude).toBeCloseTo(29, 0);
    expect(glow(new Date("2026-06-21T20:00:00Z")).altitude).toBeCloseTo(76, 0);
  });
});

describe("moon", () => {
  const moon = (iso: string, options?: SceneOptions) => sceneState({ liveReceived: false }, new Date(iso), options).moon!;

  test("rises on the right (east) and sets on the left (west)", () => {
    const evening = moon("2026-10-25T04:00:00Z"); // 9 PM on 2026-10-24, 42 degrees up in the east-southeast
    const crescent = moon("2026-10-14T02:00:00Z"); // 7 PM on 2026-10-13, low in the southwest

    expect(evening.x).toBeGreaterThan(0.5);
    expect(evening.night).toBe(1);
    expect(evening.phase).toBeCloseTo(0.46, 2);
    expect(crescent.x).toBeLessThan(0.5);
    expect(crescent.altitude).toBeLessThan(evening.altitude);
  });

  test("due south is the middle; east-northeast and west-northwest near the edges, and on past them", () => {
    expect(azimuthX(180)).toBeCloseTo(0.5);
    expect(azimuthX(60)).toBeCloseTo(0.95);
    expect(azimuthX(300)).toBeCloseTo(0.05);
    expect(azimuthX(20)).toBeGreaterThan(1);
    expect(azimuthX(340)).toBeLessThan(0);
  });

  test("an afternoon moon is drawn by day, as faint as the sun is high", () => {
    const afternoon = moon("2026-10-17T23:00:00Z"); // 4 PM, sun about 21 degrees up
    const dusk = moon("2026-10-18T01:00:00Z"); // 6 PM, sun about 5 degrees up

    expect(afternoon.night).toBe(0);
    expect(afternoon.daylight).toBeGreaterThan(0.75);
    expect(dusk.daylight).toBeCloseTo(5 / 25, 1);
    expect(moon("2026-10-25T04:00:00Z").daylight).toBe(0); // 9 PM
  });

  test("its night look fades in through dusk, as the scene turns to night", () => {
    const { sunset } = sunTimes(new Date("2026-10-19T19:00:00Z"));
    const state = sceneState({ liveReceived: false }, sunset);

    expect(state.moon!.night).toBeCloseTo(1 - state.dusk, 5);
    expect(state.moon!.night).toBeGreaterThan(0);
    expect(state.moon!.night).toBeLessThan(1);
    expect(state.moon!.daylight).toBe(0);
  });

  test("at its real height: a winter full moon high, a summer one low", () => {
    expect(moon("2026-12-24T08:00:00Z").altitude).toBeGreaterThan(75); // midnight on Christmas Eve
    expect(moon("2026-06-30T09:00:00Z").altitude).toBeLessThan(27); // 2 AM, as high as it gets that night
  });

  test("no moon below the horizon, as near new moon at night", () => {
    expect(moon("2026-10-21T21:00:00Z")).toBeNull(); // 2 PM, not yet risen
    expect(moon("2026-11-09T05:00:00Z")).toBeNull(); // 10 PM on 2026-11-08, new
  });

  test("turned as it faces us in the sky", () => {
    const at = "2026-11-01T08:00:00Z"; // 1 AM PDT, a waning half moon rising, lit from below
    const { libration, axis, brightLimb } = moon(at);

    expect({ libration, axis, brightLimb }).toEqual(moonOrientation(new Date(at)));
  });

  test("replay shows the moon of the replayed time", () => {
    expect(moon("2026-10-25T04:00:00Z", { links: [], replay: true })).toEqual(moon("2026-10-25T04:00:00Z"));
  });
});

describe("twilight", () => {
  const { sunrise, sunset } = sunTimes(new Date("2026-10-21T20:00:00Z"));
  const twilight = (date: Date, options?: SceneOptions) => sceneState({ liveReceived: false }, date, options).twilight;
  const minutes = (date: Date, m: number) => new Date(date.getTime() + m * 60000);

  test("strongest around sunset and sunrise, on the sun's side", () => {
    expect(twilight(sunset).strength).toBeGreaterThan(0.8);
    expect(twilight(sunset).x).toBeLessThan(0.5);
    expect(twilight(sunrise).strength).toBeGreaterThan(0.8);
    expect(twilight(sunrise).x).toBeGreaterThan(0.5);
  });

  test("fades through dusk, gone by the end of civil twilight", () => {
    const dusk = twilight(minutes(sunset, 15)).strength;

    expect(dusk).toBeGreaterThan(0.3);
    expect(dusk).toBeLessThan(twilight(sunset).strength);
    expect(twilight(minutes(sunset, 45)).strength).toBe(0);
  });

  test("none at noon or midnight", () => {
    expect(twilight(new Date("2026-10-21T19:00:00Z")).strength).toBe(0);
    expect(twilight(new Date("2026-10-22T07:00:00Z")).strength).toBe(0);
  });

  test("dusk runs from 1 by day to 0 at night across twilight, rising again at sunrise", () => {
    const dusk = (date: Date, options?: SceneOptions) => sceneState({ liveReceived: false }, date, options).dusk;

    expect(dusk(new Date("2026-10-21T19:00:00Z"))).toBe(1); // noon
    expect(dusk(new Date("2026-10-22T07:00:00Z"))).toBe(0); // midnight
    expect(dusk(sunset)).toBeCloseTo(0.42, 1); // the sun about 1 degree down
    expect(dusk(minutes(sunset, 15))).toBeLessThan(dusk(sunset));
    expect(dusk(minutes(sunset, 15))).toBeGreaterThan(0);
    expect(dusk(minutes(sunrise, 15))).toBeGreaterThan(dusk(sunrise));
    expect(dusk(sunset, { links: [], replay: true })).toBe(dusk(sunset));
  });

  test("replay has the replayed time's twilight", () => {
    expect(twilight(sunset, { links: [], replay: true })).toEqual(twilight(sunset));
  });
});

describe("rain and the day's clouds", () => {
  const state = (iso: string, options?: SceneOptions) => sceneState({ liveReceived: false }, new Date(iso), options);

  test("the state carries the rain, live and in replay", () => {
    expect(state("2026-10-21T19:00:00Z", { cover: 1, rain: 0.7 }).rain).toBe(0.7);
    expect(state("2026-10-21T19:00:00Z", { links: [], replay: true, cover: 1, rain: 0.4 }).rain).toBe(0.4);
    expect(state("2026-10-21T19:00:00Z").rain).toBeUndefined();
    expect(state("2026-10-21T19:00:00Z", { cover: 1, rain: 0, wind: -9.9 }).wind).toBe(-9.9);
    const aloft = state("2026-10-21T19:00:00Z", { cover: 1, rain: 0, windLow: 20.5, windMid: -2.3, windHigh: 74 });
    expect([aloft.windLow, aloft.windMid, aloft.windHigh]).toEqual([20.5, -2.3, 74]);
  });

  test("the state carries the high cloud share, undefined when not given", () => {
    expect(state("2026-10-21T19:00:00Z", { cover: 0.2, cirrus: 0.8 }).cirrus).toBe(0.8);
    expect(state("2026-10-21T19:00:00Z", { links: [], replay: true, cover: 0.2, cirrus: 0.6 }).cirrus).toBe(0.6);
    expect(state("2026-10-21T19:00:00Z", { cover: 0.2 }).cirrus).toBeUndefined();
  });

  test("the state carries the low and mid cloud shares, undefined when not given", () => {
    expect(state("2026-10-21T19:00:00Z", { cover: 0.5, low: 0.4, mid: 0.2 })).toMatchObject({ low: 0.4, mid: 0.2 });
    expect(state("2026-10-21T19:00:00Z", { links: [], replay: true, cover: 0.5, low: 0.3, mid: 0.1 })).toMatchObject({ low: 0.3, mid: 0.1 });
    const without = state("2026-10-21T19:00:00Z", { cover: 0.2 });
    expect([without.low, without.mid]).toEqual([undefined, undefined]);
  });

  test("one cloud seed per day at the site, changing at its midnight", () => {
    const morning = state("2026-10-21T15:00:00Z").cloudSeed; // 8 AM PDT
    const lateEvening = state("2026-10-22T06:30:00Z").cloudSeed; // 11:30 PM PDT, already the 22nd in UTC
    const nextDay = state("2026-10-22T07:30:00Z").cloudSeed; // 12:30 AM PDT on the 22nd

    expect(Number.isInteger(morning)).toBe(true);
    expect(lateEvening).toBe(morning);
    expect(nextDay).toBe(morning + 1);
  });
});

describe("setting and rising", () => {
  const at = (iso: string) => sceneState({ liveReceived: false }, new Date(iso));
  const clamp = (v: number) => Math.min(1, Math.max(0, v));

  test("the moon fades over its last 2 degrees and is dim and warm when low", () => {
    const setting = new Date("2026-10-18T06:31:00Z"); // 11:31 PM on 2026-10-17, minutes before moonset
    const { altitude } = moonPosition(setting);

    expect(altitude).toBeGreaterThan(0);
    expect(altitude).toBeLessThan(2);
    expect(at(setting.toISOString()).moon!.fade).toBeCloseTo(altitude / 2, 5);
    expect(at(setting.toISOString()).moon!.low).toBeCloseTo(1 - altitude / 10, 5);

    const high = at("2026-10-25T04:00:00Z").moon!; // 9 PM on 2026-10-24, 42 degrees up
    expect(high.fade).toBe(1);
    expect(high.low).toBe(0);
  });

  test("the sun glow fades over the sun's last 2 degrees", () => {
    const before = new Date("2026-10-22T01:20:00Z"); // six minutes before sunset on 2026-10-21

    expect(at(before.toISOString()).sunGlow!.fade).toBeCloseTo(clamp(sunPosition(before).altitude / 2), 5);
    expect(at(before.toISOString()).sunGlow!.fade).toBeLessThan(0.5);
    expect(at("2026-10-21T19:00:00Z").sunGlow!.fade).toBe(1);
  });
});

describe("replay", () => {
  test("recorded links replace the assigned ones", () => {
    const links: Link[] = [{ from: "grid", to: "home", kw: 0.5 }];
    expect(sceneState(midday, NOW, { links, replay: true }).links).toBe(links);
  });

  test("no charge bar without a reading, where live shows 20%", () => {
    expect(sceneState({ ...midday, battery: null }, NOW, { replay: true }).charge).toBeNull();
    expect(sceneState({ ...midday, battery: 51 }, NOW, { replay: true }).charge).toBe(51);
    expect(sceneState({ ...midday, battery: null }, NOW).charge).toBe(20);
  });

  test("a replayed car is labeled with its name and kW only", () => {
    const vehicle = { name: "R2D2", charging_power: 7.2 };
    expect(sceneState({ ...midday, vehicle }, NOW, { replay: true }).labels.car).toEqual({ name: "R2D2", value: "7.2 kW", age: null });
  });
});

describe("links", () => {
  const links = (values: LiveInput) => sceneState({ ...midday, ...values }, NOW).links.map(({ from, to }) => `${from}-${to}`);

  test("exporting solar while charging the car", () => {
    expect(links({ solarPower: 6.1, homePower: 0.9, gridPower: -2.0, vehicle: r2d2({ charging_power: 3.2 }) })).toEqual([
      "solar-home", "solar-car", "solar-grid",
    ]);
  });

  test("night on battery", () => {
    expect(links({ solarPower: 0, homePower: 1.2, batteryPower: 1.2, gridPower: 0 })).toEqual(["powerwall-home"]);
  });

  test("solar charging the Powerwall", () => {
    expect(links({ solarPower: 6.1, homePower: 1.8, batteryPower: -4.3, gridPower: 0 })).toEqual(["solar-powerwall", "solar-home"]);
  });

  test("solar charges the Powerwall while the grid covers home (2026-10-19)", () => {
    // Tesla attributes Powerwall charging to solar before the grid.
    expect(links({ solarPower: 1.0, homePower: 1.2, batteryPower: -0.9, gridPower: 1.2 })).toEqual(["solar-powerwall", "grid-home"]);
  });

  test("solar and grid both feed home", () => {
    expect(links({ solarPower: 2.0, homePower: 3.5, gridPower: 1.5 })).toEqual(["solar-home", "grid-home"]);
  });

  test("a source the totals don't account for still links to home", () => {
    // Midday: 6.1 kW solar and 2.0 kW grid import against 4.1 kW of home.
    expect(links({})).toEqual(["solar-home", "grid-home"]);
  });

  test("each link carries the kW it is allotted", () => {
    const state = sceneState({ ...midday, solarPower: 6.0, homePower: 1.0, batteryPower: 3.0, gridPower: -8.0 }, NOW);

    expect(state.links).toEqual([
      { from: "solar", to: "home", kw: 1.0 },
      { from: "solar", to: "grid", kw: 5.0 },
      { from: "powerwall", to: "grid", kw: 3.0 },
    ]);
  });

  test("nothing links below 0.1 kW", () => {
    expect(links({ solarPower: 0.04, homePower: 0.04, batteryPower: -0.04, gridPower: 0.04 })).toEqual([]);
  });
});

describe("stale warning", () => {
  const STAMP = new Date("2026-10-19T19:33:37Z");
  const after = (seconds: number) => staleWarning(STAMP, new Date(STAMP.getTime() + seconds * 1000));

  test.each([
    [-2, null],
    [38, null],
    [119, null],
    [120, "No update for 2 min"],
    [190, "No update for 3 min"],
    [3600, "No update for 60 min"],
  ])("%i s after the timestamp", (seconds, warning) => {
    expect(after(seconds)).toBe(warning);
  });
});

describe("the roof's sunshine caps the cloud by day", () => {
  const drawn = (weather: SceneOptions) => {
    const { cover, low, mid, cirrus } = sceneState(midday, NOW, weather);
    return { cover, low, mid, cirrus };
  };

  test("in full sun the cloud is held to scattered", () => {
    expect(drawn({ cover: 0.62, low: 0.62, mid: 0, cirrus: 0, sun: 1 })).toEqual({ cover: 0.3, low: 0.3, mid: 0, cirrus: 0 });
    expect(drawn({ cover: 1, low: 0.9, mid: 0.6, cirrus: 0, sun: 0.8 })).toEqual({ cover: 0.3, low: 0.3, mid: 0.3, cirrus: 0 });
  });

  test("the cap eases off evenly as the roof dims", () => {
    expect(drawn({ cover: 0.9, low: 0.9, mid: 0, cirrus: 0, sun: 0.6 }).low).toBeCloseTo(0.65);
  });

  test("a dull roof leaves the service's cloud", () => {
    expect(drawn({ cover: 1, low: 1, mid: 0, cirrus: 0, sun: 0.4 })).toEqual({ cover: 1, low: 1, mid: 0, cirrus: 0 });
    expect(drawn({ cover: 1, low: 1, mid: 0, cirrus: 0, sun: 0.2 })).toEqual({ cover: 1, low: 1, mid: 0, cirrus: 0 });
  });

  test("the roof never adds cloud", () => {
    expect(drawn({ cover: 0.1, low: 0.1, mid: 0, cirrus: 0, sun: 0.2 }).low).toBe(0.1);
  });

  test("high cloud follows the service", () => {
    expect(drawn({ cover: 0.175, low: 0, mid: 0, cirrus: 0.7, sun: 1 }).cirrus).toBe(0.7);
  });

  test("without sunshine the service's cloud stands", () => {
    expect(drawn({ cover: 0.9, low: 0.9, mid: 0, cirrus: 0, sun: null })).toEqual({ cover: 0.9, low: 0.9, mid: 0, cirrus: 0 });
    expect(drawn({ cover: 0.9, low: 0.9, mid: 0, cirrus: 0 })).toEqual({ cover: 0.9, low: 0.9, mid: 0, cirrus: 0 });
    expect(drawn({ cover: 0.9, low: 0.9, mid: 0, cirrus: 0, sun: NaN })).toEqual({ cover: 0.9, low: 0.9, mid: 0, cirrus: 0 });
  });

  test("a reading without the split is capped through its cover, and unknown weather stays unknown", () => {
    expect(drawn({ cover: 0.7, sun: 1 })).toEqual({ cover: 0.3, low: undefined, mid: undefined, cirrus: undefined });
    expect(drawn({ cover: null, low: null, mid: null, cirrus: null, sun: 1 })).toEqual({ cover: null, low: null, mid: null, cirrus: null });
  });

  test("the house is lit as for the capped cover", () => {
    expect(sceneState(midday, NOW, { cover: 0.62, low: 0.62, sun: 1 }).sunlight!.strength)
      .toBeCloseTo(sceneState(midday, NOW, { cover: 0.3, low: 0.3 }).sunlight!.strength);
  });
});
