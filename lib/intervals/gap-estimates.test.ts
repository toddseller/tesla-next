// Ported from anton-tesla-api-ws tests/test_gap_estimates.py, with the same values.
import { expect, test } from "vitest";
import { fill, placeSessions, STEP } from "./gap-estimates";

const MINUTE = 60_000;

// A time on 2026-10-`day` in PDT (UTC-7), as UTC milliseconds.
const at = (hour: number, minute: number, day = 17) => Date.UTC(2026, 9, day, hour + 7, minute);

const asLocal = (estimates: Map<number, number>) =>
  Object.fromEntries(
    [...estimates].map(([t, v]) => {
      const local = new Date(t - 7 * 60 * MINUTE);
      return [`${String(local.getUTCHours()).padStart(2, "0")}:${String(local.getUTCMinutes()).padStart(2, "0")}`, v];
    }),
  );

const expectClose = (actual: Record<string, number>, expected: Record<string, number>) => {
  expect(Object.keys(actual)).toEqual(Object.keys(expected));
  for (const key of Object.keys(expected)) expect(actual[key]).toBeCloseTo(expected[key], 9);
};

test("battery gap from the spec", () => {
  expectClose(asLocal(fill(new Map([[at(1, 55), 60], [at(2, 20), 56]]))), { "02:00": 59.2, "02:05": 58.4, "02:10": 57.6, "02:15": 56.8 });
});

test("charging ended during an outage", () => {
  expectClose(asLocal(fill(new Map([[at(3, 0), 600], [at(3, 20), 0]]))), { "03:05": 450, "03:10": 300, "03:15": 150 });
});

test("exactly 24 missing boundaries are filled", () => {
  const start = at(1, 0);
  expect(fill(new Map([[start, 50], [start + 125 * MINUTE, 75]])).size).toBe(24);
});

test("25 missing boundaries are not filled", () => {
  const start = at(1, 0);
  expect(fill(new Map([[start, 50], [start + 130 * MINUTE, 76]])).size).toBe(0);
});

test("nothing after the last point", () => {
  expect(fill(new Map([[at(13, 0), 80], [at(13, 5), 81]])).size).toBe(0);
});

test("adjacent points produce nothing", () => {
  expect(fill(new Map([[at(10, 0), 50], [at(10, 5), 51], [at(10, 10), 52]])).size).toBe(0);
});

test("mixed gaps only fill the short one", () => {
  const points = new Map([[at(0, 0), 40], [at(0, 15), 43], [at(3, 0), 70]]);
  expect(Object.keys(asLocal(fill(points)))).toEqual(["00:05", "00:10"]);
});

test("the fall-back night fills across the repeated hour", () => {
  // 2026-11-01: 01:55 PDT (08:55 UTC) to 01:05 PST (09:05 UTC) is 10 real minutes, one missing boundary.
  const estimates = fill(new Map([[Date.UTC(2026, 10, 1, 8, 55), 70], [Date.UTC(2026, 10, 1, 9, 5), 72]]));
  expect([...estimates]).toEqual([[Date.UTC(2026, 10, 1, 9, 0), 71]]);
});

const kwWh = (kw: number) => (kw * 1000) / 12;

// Excess over a `base` kW baseline for each interval from `from` up to `to`, at `kw` home load.
function flat(from: number, to: number, kw: number, base = 1.0) {
  const excess = new Map<number, number>();
  for (let t = from; t < to; t += STEP) excess.set(t, kwWh(kw - base));
  return excess;
}

const merge = (...maps: Map<number, number>[]) => new Map(maps.flatMap((m) => [...m]));
const sum = (m: Map<number, number>) => [...m.values()].reduce((a, b) => a + b, 0);

test("a charge starting at plug-in", () => {
  const excess = merge(flat(at(9, 0), at(12, 0), 1.0), new Map([[at(10, 0), kwWh(8)], [at(10, 5), kwWh(8)]]));
  expectClose(asLocal(placeSessions([[at(9, 58), 420, 1000, null]], excess, new Map(), new Map())[0]), { "10:00": 2000 / 3, "10:05": 1000 / 3 });
});

test("a scheduled charge found after midnight", () => {
  const excess = merge(flat(at(19, 0), at(0, 0, 18), 1.0), flat(at(0, 5, 18), at(7, 0, 18), 8.7));
  const placed = placeSessions([[at(19, 22), 21855, 46300, null]], excess, new Map(), new Map())[0];
  expect(Math.min(...placed.keys())).toBe(at(0, 5, 18));
  expect(sum(placed)).toBeCloseTo(46300, 6);
});

test("a later session gets only the load left", () => {
  const excess = new Map([[at(8, 0), 600]]);
  expectClose(asLocal(placeSessions([[at(7, 58), 300, 400, null], [at(8, 3), 300, 900, null]], excess, new Map(), new Map())[0]), { "08:00": 600 });
});

test("nothing is placed outside the session's stretch", () => {
  const excess = merge(flat(at(14, 0), at(18, 0), 1.0), flat(at(14, 45), at(15, 5), 8.0), new Map([[at(17, 40), kwWh(3)]]));
  const placed = placeSessions([[at(14, 44), 1200, 2600, null]], excess, new Map(), new Map())[0];
  expect(placed.has(at(17, 40))).toBe(false);
  expect(sum(placed)).toBeCloseTo(4 * kwWh(7), 6);
});

test("no matching load within 24 hours places nothing", () => {
  const excess = merge(flat(at(8, 0), at(8, 0, 18), 2.5), new Map([[at(8, 30, 18), kwWh(9)]]));
  expect(placeSessions([[at(8, 0), 3600, 5000, null]], excess, new Map(), new Map())[0].size).toBe(0);
});

test("a charge the next day, past a brief load the evening before", () => {
  const excess = merge(flat(at(16, 0), at(18, 0, 18), 1.0), flat(at(17, 0), at(17, 40), 4.0), flat(at(10, 0, 18), at(16, 0, 18), 6.0));
  const placed = placeSessions([[at(16, 50), 20736, 30115, null]], excess, new Map(), new Map())[0];
  expect(Math.min(...placed.keys())).toBe(at(10, 0, 18));
  expect(sum(placed)).toBeCloseTo(71 * kwWh(5), 6);
});

test("of two equal stretches, the earlier", () => {
  const excess = new Map([[at(8, 0), 600], [at(12, 0), 600]]);
  expectClose(asLocal(placeSessions([[at(7, 58), 300, 500, null]], excess, new Map(), new Map())[0]), { "08:00": 500 });
});

test("known charging counts toward the session", () => {
  const excess = flat(at(14, 50), at(15, 10), 8.0);
  const placed = placeSessions([[at(14, 50), 900, 900, null]], excess, new Map([[at(14, 50), 396]]), new Map())[0];
  expect(placed.has(at(14, 50))).toBe(false);
  expect(sum(placed)).toBeCloseTo(504, 6);
});

test("each interval names the session that placed most", () => {
  const excess = new Map([[at(8, 0), 600], [at(8, 5), 600]]);
  const [wh, cars] = placeSessions([[at(7, 58), 300, 700, "Y"], [at(8, 3), 300, 900, "3"]], excess, new Map(), new Map());
  expectClose(asLocal(wh), { "08:00": 600, "08:05": 600 });
  expect([...cars]).toEqual([[at(8, 0), "Y"], [at(8, 5), "3"]]);
});

test("a measured car replaces the inferred one", () => {
  const excess = flat(at(23, 0), at(2, 0, 18), 8.0);
  const known = new Map([[at(23, 0), 600], [at(23, 5), 600], [at(23, 10), 600]]);
  const [wh, cars] = placeSessions([[at(22, 58), 3600, 10000, "3"]], excess, known, new Map([...known.keys()].map((t) => [t, "Y"])));
  expect(wh.has(at(23, 0))).toBe(false);
  expect(wh.size).toBeGreaterThan(0);
  expect(new Set(cars.values())).toEqual(new Set(["Y"]));
});

test("a session's stretch ends before the next session starts, so it can't take that charge", () => {
  const excess = merge(flat(at(14, 0), at(14, 0, 18), 1.0), flat(at(14, 5), at(14, 45), 7.0), flat(at(11, 20, 18), at(13, 0, 18), 9.3));
  const [placed] = placeSessions([[at(14, 2), 6840, 9600, null], [at(11, 14, 18), 6120, 16200, null]], excess, new Map(), new Map());
  expect(sum(new Map([...placed].filter(([t]) => t < at(0, 0, 18))))).toBeCloseTo(8 * kwWh(6), 6);
  expect(sum(new Map([...placed].filter(([t]) => t >= at(11, 0, 18))))).toBeCloseTo(20 * kwWh(8.3), 6);
});
