// Ported from anton-tesla-api-ws tesla-api-frontend/client/src/utils/nightSky.test.js.
import { describe, test, expect } from "vitest";
import catalog from "@/lib/scene/stars.json";
import { extinction, limitingMagnitude, nightSky, planets, type SkyPoint, twinkle } from "@/lib/scene/night-sky";

// Right ascension, declination, magnitude and color index (null when unknown).
const stars = catalog as [number, number, number, number | null][];
import { sceneState } from "@/lib/scene/live-scene";

describe("star catalog", () => {
  test("holds the stars to magnitude 4.5 that rise at the site", () => {
    expect(stars.length).toBeGreaterThan(700);
    expect(stars.length).toBeLessThan(1000);
    stars.forEach(([, declination, magnitude]) => {
      expect(magnitude).toBeLessThanOrEqual(4.5);
      expect(declination).toBeGreaterThan(-52.5);
    });
  });

  test("Sirius is in it, with its position, magnitude and color", () => {
    const sirius = stars.find(([, , magnitude]) => magnitude < -1)!;

    expect(sirius[0]).toBeCloseTo(101.29, 1);
    expect(sirius[1]).toBeCloseTo(-16.72, 1);
    expect(sirius[2]).toBeCloseTo(-1.46, 2);
    expect(sirius[3]!).toBeCloseTo(0, 2);
  });
});

describe("planets", () => {
  // JPL Horizons, geocentric astrometric J2000 right ascension and declination
  // and visual magnitude (Saturn's with its rings), looked up for these tests.
  const HORIZONS = {
    "2026-10-25T05:00:00Z": {
      venus: [205.32745, -17.28917, -4.195], mars: [137.66679, 17.80368, 0.942],
      jupiter: [145.63553, 14.45615, -1.968], saturn: [9.65664, 1.22509, 0.43],
    },
    "2027-06-01T05:00:00Z": {
      venus: [48.61325, 16.7303, -3.865], mars: [159.0702, 10.16623, 0.761],
      jupiter: [142.77619, 15.69532, -1.925], saturn: [22.78193, 7.0414, 0.682],
    },
  };
  // Saturn's rings, which the formula leaves out, can brighten it by about half a magnitude.
  const MAGNITUDE_TOLERANCE: Record<string, number> = { venus: 0.3, mars: 0.3, jupiter: 0.3, saturn: 0.6 };

  Object.entries(HORIZONS).forEach(([iso, expected]) => {
    test.each(Object.keys(expected))(`%s at ${iso}`, (name) => {
      const [ascension, declination, magnitude] = (expected as Record<string, number[]>)[name];
      const planet = planets(new Date(iso))[name as keyof ReturnType<typeof planets>];
      const r = Math.PI / 180;
      const apart = Math.acos(Math.sin(planet.declination * r) * Math.sin(declination * r)
        + Math.cos(planet.declination * r) * Math.cos(declination * r) * Math.cos((planet.ascension - ascension) * r)) / r;

      expect(apart).toBeLessThan(0.25);
      expect(Math.abs(planet.magnitude - magnitude)).toBeLessThan(MAGNITUDE_TOLERANCE[name]);
    });
  });

  test("Mars is far brighter at its 2027-02-19 opposition than six months later", () => {
    // Horizons: -1.29 at opposition, +1.36 on 2027-08-19.
    const opposition = planets(new Date("2027-02-19T05:00:00Z")).mars.magnitude;
    const later = planets(new Date("2027-08-19T05:00:00Z")).mars.magnitude;

    expect(later - opposition).toBeGreaterThan(1.5);
  });
});

describe("how faint a star can show", () => {
  const noMoon = { altitude: -10, phase: 0.5 };

  test.each([
    [10, -5], // day: not even Venus at its brightest
    [0, -5],
    [-6, 1.5],
    [-12, 3.5],
    [-18, 4.5],
    [-30, 4.5],
  ])("with the sun at %i degrees the limit is %d", (sunAltitude, limit) => {
    expect(limitingMagnitude(sunAltitude, noMoon)).toBeCloseTo(limit, 5);
  });

  test("halfway through nautical twilight it is between the two", () => {
    expect(limitingMagnitude(-9, noMoon)).toBeCloseTo(2.5, 5);
  });

  test("a full moon 60 degrees up hides the faintest stars, a new or set moon none", () => {
    expect(limitingMagnitude(-30, noMoon) - limitingMagnitude(-30, { altitude: 60, phase: 0.5 })).toBeCloseTo(1.3, 1);
    expect(limitingMagnitude(-30, { altitude: 60, phase: 0 })).toBeCloseTo(4.5, 5);
  });

  test("near the horizon a star dims through more air", () => {
    expect(extinction(90)).toBeCloseTo(0, 5);
    expect(extinction(5)).toBeCloseTo(2.25, 2);
    expect(extinction(30)).toBeCloseTo(0.25, 2);
  });
});

describe("the night sky at a moment", () => {
  const at = (iso: string) => nightSky(new Date(iso));
  const star = (ascension: number, declination: number) => stars.findIndex(([a, d]) => Math.abs(a - ascension) < 0.1 && Math.abs(d - declination) < 0.1);
  const point = (sky: SkyPoint[], index: number) => sky.find((p) => p.index === index)!;
  const [FOMALHAUT, ALTAIR, VEGA, ALDEBARAN] = [star(344.41, -29.62), star(297.7, 8.87), star(279.23, 38.78), star(68.98, 16.51)];
  const [SIRIUS, BETELGEUSE, RIGEL, POLARIS] = [star(101.29, -16.72), star(88.79, 7.41), star(78.63, -8.2), star(37.95, 89.26)];

  test("an October evening: Fomalhaut low in the middle, Altair and Vega to the left, Aldebaran rising on the right", () => {
    const sky = at("2026-10-25T05:00:00Z"); // 10 PM on 2026-10-24

    expect(point(sky, FOMALHAUT).x).toBeCloseTo(0.5, 1);
    expect(point(sky, ALTAIR).x).toBeLessThan(0.4);
    expect(point(sky, VEGA).x).toBeLessThan(point(sky, ALTAIR).x);
    expect(point(sky, VEGA).altitude).toBeGreaterThan(point(sky, FOMALHAUT).altitude);
    expect(point(sky, ALDEBARAN).x).toBeGreaterThan(0.8);
  });

  test("mirrored like the moon: at 4 AM Sirius is right of and below Betelgeuse", () => {
    const sky = at("2026-10-25T11:00:00Z");

    expect(point(sky, SIRIUS).x).toBeGreaterThan(point(sky, BETELGEUSE).x);
    expect(point(sky, SIRIUS).altitude).toBeLessThan(point(sky, BETELGEUSE).altitude);
  });

  test("Polaris never shows: the scene looks over the southern sky", () => {
    ["2026-10-25T05:00:00Z", "2026-10-25T11:00:00Z", "2027-04-15T06:00:00Z"].forEach((iso) => expect(point(at(iso), POLARIS)).toBeUndefined());
  });

  test("none by day, only a few points just after sunset", () => {
    expect(at("2026-10-24T19:00:00Z")).toEqual([]); // noon
    expect(at("2026-10-25T01:23:00Z").length).toBeLessThan(10); // 6:23 PM, 10 minutes after sunset
  });

  test("the same moment gives the same sky", () => {
    expect(at("2026-10-25T05:00:00Z")).toEqual(at("2026-10-25T05:00:00Z"));
  });

  test("brighter stars are larger, and every point is above the horizon and visible", () => {
    const sky = at("2026-10-25T11:00:00Z");

    expect(point(sky, SIRIUS).radius).toBeGreaterThan(point(sky, BETELGEUSE).radius);
    sky.forEach((p) => {
      expect(p.altitude).toBeGreaterThan(0);
      expect(p.opacity).toBeGreaterThan(0);
      expect(p.opacity).toBeLessThanOrEqual(1);
    });
  });

  test("tinted by color: Rigel bluish, Betelgeuse and Mars orange", () => {
    const sky = at("2026-10-25T11:00:00Z"); // Mars is up in the east at 4 AM
    const rgb = (p: SkyPoint) => p.color.match(/\d+/g)!.map(Number);
    const [mars] = sky.filter((p) => p.planet === "mars");

    expect(rgb(point(sky, RIGEL))[2]).toBeGreaterThan(rgb(point(sky, RIGEL))[0]);
    expect(rgb(point(sky, BETELGEUSE))[0]).toBeGreaterThan(rgb(point(sky, BETELGEUSE))[2]);
    expect(rgb(mars)[0]).toBeGreaterThan(rgb(mars)[2]);
  });

  test("the scene state carries it", () => {
    const now = new Date("2026-10-25T05:00:00Z");

    expect(sceneState({ liveReceived: false }, now).stars).toEqual(nightSky(now));
  });
});

describe("twinkling", () => {
  const over = (index: number, altitude: number) => Array.from({ length: 100 }, (_, i) => twinkle({ index, altitude }, i * 10));
  const spread = (values: number[]) => Math.max(...values) - Math.min(...values);

  test("a star's brightness flickers within its depth, never above full", () => {
    const values = over(5, 40);

    values.forEach((value) => {
      expect(value).toBeLessThanOrEqual(1);
      expect(value).toBeGreaterThan(0.5);
    });
    expect(spread(values)).toBeGreaterThan(0.02);
  });

  test("each star on its own", () => {
    expect(twinkle({ index: 5, altitude: 40 }, 1234)).not.toBeCloseTo(twinkle({ index: 6, altitude: 40 }, 1234), 3);
  });

  test("far more near the horizon than high up", () => {
    expect(spread(over(5, 10))).toBeGreaterThan(3 * spread(over(5, 70)));
  });

  test("planets shine steadily", () => {
    [0, 333, 777].forEach((ms) => expect(twinkle({ planet: "jupiter", altitude: 10 }, ms)).toBe(1));
  });
});
