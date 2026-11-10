import { describe, expect, test } from "vitest";

import { blipsPerYear, duration, outageBattery, stormDays, weatherLabel } from "./backup-figures";

const MIN = 60_000;
const STEP = 5 * MIN;
const T0 = Date.parse("2024-02-04T22:50:00Z");

type Wh = Partial<{ out: number; in: number; solarExported: number; house: number }>;
// Consecutive 5-minute intervals from `from`, each with the same flows.
const run = (from: number, count: number, wh: Wh) =>
  Array.from({ length: count }, (_, i) => ({ start: from + i * STEP, out: 0, in: 0, solarExported: 0, house: 0, ...wh }));

// An outage from T0 for so many intervals, the batteries full just before it.
const outage = (intervals: number) => ({ start: T0, end: T0 + intervals * STEP });
const fullBefore = run(T0 - 2 * STEP, 2, { solarExported: 300 });

describe("outageBattery", () => {
  test("the drop is the deepest point of energy out less energy in, in at 0.36/0.41, with its time", () => {
    // 10 kWh out overnight, then 4.1 kWh in from solar: the running total goes to 10, then back to 6.4.
    const intervals = [...fullBefore, ...run(T0, 100, { out: 100, house: 100 }), ...run(T0 + 100 * STEP, 41, { in: 100 })];
    const battery = outageBattery(intervals, outage(141));
    expect(battery.drop_kwh).toBeCloseTo(10, 6);
    expect(battery.low_at).toBe(new Date(T0 + 100 * STEP).toISOString());
  });

  test("an outage that started full gives its lowest charge, kWh left and hours left from the hour before the low", () => {
    // 20.6 kWh out at 1.1 kW for the last hour before the low.
    const intervals = [...fullBefore, ...run(T0, 206, { out: 100, house: 1100 / 12 })];
    const battery = outageBattery(intervals, outage(206));
    expect(battery.full).toBe(true);
    expect(battery.low_percent).toBeCloseTo(100 - 20.6 / 0.36, 6);
    expect(battery.left_kwh).toBeCloseTo(15.4, 6);
    expect(battery.hours_left).toBeCloseTo(15.4 / 1.1, 6);
  });

  test("a full signal 2 hours before, with 10 kWh out since, means started below full: the drop only", () => {
    const intervals = [...run(T0 - 26 * STEP, 2, { solarExported: 300 }), ...run(T0 - 24 * STEP, 24, { out: 10000 / 24 }), ...run(T0, 12, { out: 100 })];
    const battery = outageBattery(intervals, outage(12));
    expect(battery.full).toBe(false);
    expect(battery.drop_kwh).toBeCloseTo(1.2, 6);
    expect([battery.low_percent, battery.left_kwh, battery.hours_left]).toEqual([null, null, null]);
  });

  test("a full signal more than 12 hours before doesn't count, and neither does solar exported while the batteries charge", () => {
    const old = [...run(T0 - 13 * 12 * STEP, 2, { solarExported: 300 }), ...run(T0 - 11 * STEP, 1, { solarExported: 300, in: 50 }), ...run(T0, 12, { out: 100 })];
    expect(outageBattery(old, outage(12)).full).toBe(false);
  });

  test("a full evening finds the afternoon's signal, with the night's small draw allowed", () => {
    const intervals = [...run(T0 - 60 * STEP, 1, { solarExported: 300 }), ...run(T0 - 59 * STEP, 59, { out: 900 / 59 }), ...run(T0, 12, { out: 100, house: 100 })];
    expect(outageBattery(intervals, outage(12)).full).toBe(true);
  });

  test("an hour before the low with no draw gives no hours left", () => {
    const intervals = [...fullBefore, ...run(T0, 12, { out: 100 })];
    expect(outageBattery(intervals, outage(12)).hours_left).toBeNull();
  });

  test("more than 36 kWh out in all means solar refilled the batteries", () => {
    const intervals = [...fullBefore, ...run(T0, 200, { out: 150 }), ...run(T0 + 200 * STEP, 200, { in: 150 }), ...run(T0 + 400 * STEP, 100, { out: 150 })];
    const battery = outageBattery(intervals, outage(500));
    expect(battery.refilled).toBe(true);
    expect(outageBattery([...fullBefore, ...run(T0, 200, { out: 150 })], outage(200)).refilled).toBe(false);
  });

  test("fewer than 80% of the outage's intervals stored gives the drop marked incomplete, and no charge", () => {
    const intervals = [...fullBefore, ...run(T0, 24, { out: 100, house: 100 })];
    const battery = outageBattery(intervals, outage(48));
    expect(battery.complete).toBe(false);
    expect(battery.drop_kwh).toBeCloseTo(2.4, 6);
    expect([battery.low_percent, battery.left_kwh, battery.hours_left]).toEqual([null, null, null]);
  });

  test("an outage starting mid-interval counts that interval by its part inside", () => {
    const intervals = [...fullBefore, ...run(T0, 2, { out: 600 })];
    const battery = outageBattery(intervals, { start: T0 + 2.5 * MIN, end: T0 + 2 * STEP });
    expect(battery.drop_kwh).toBeCloseTo(0.9, 6);
  });

  test("a minute-long outage with no stored interval drops nothing and is incomplete", () => {
    const battery = outageBattery(fullBefore, { start: T0, end: T0 + MIN });
    expect([battery.drop_kwh, battery.complete]).toEqual([0, false]);
  });

  test("an outage the batteries never fell through has its lowest point at its start", () => {
    const battery = outageBattery([...fullBefore, ...run(T0, 1, { in: 50 })], { start: T0, end: T0 + MIN });
    expect([battery.drop_kwh, battery.low_percent, battery.low_at]).toEqual([0, 100, new Date(T0).toISOString()]);
  });
});

describe("weatherLabel", () => {
  const sample = (code: number, wind: number | null) => ({ code, wind });

  test("a winter storm: the wettest code and the strongest wind", () => {
    expect(weatherLabel([sample(3, 20), sample(65, 45), sample(61, 30)])).toBe("Heavy rain, high wind");
  });

  test("a calm summer morning: fog and a light wind", () => {
    expect(weatherLabel([sample(45, 13), sample(3, 9)])).toBe("Calm");
  });

  test("the cutoffs: heavy rain from rainFrom 0.7, high wind from 40 km/h, windy from 25", () => {
    expect(weatherLabel([sample(61, 39)])).toBe("Rain, windy");
    expect(weatherLabel([sample(63, 40)])).toBe("Heavy rain, high wind");
    expect(weatherLabel([sample(0, 25)])).toBe("Windy");
    expect(weatherLabel([sample(0, 24)])).toBe("Calm");
  });

  test("a thunderstorm outranks rain, and a missing wind is ignored", () => {
    expect(weatherLabel([sample(95, null), sample(65, null)])).toBe("Thunderstorm");
  });

  test("no samples, no label", () => {
    expect(weatherLabel([])).toBeNull();
  });
});

// Events newest first, as the history lists them, from a site wall time and a length in seconds.
const event = (start: string, seconds: number, kind = "outage") => {
  const at = Date.parse(`${start}-08:00`);
  return { start: new Date(at).toISOString(), end: new Date(at + seconds * 1000).toISOString(), kind };
};

describe("stormDays", () => {
  test("events starting less than 6 hours after the one before ended are one storm day, newest first within it", () => {
    const events = [
      event("2024-02-04T14:51:38", 188_186),
      event("2024-02-04T14:27:33", 64),
      event("2024-02-04T12:30:04", 62),
      event("2023-12-26T09:54:00", 5760),
    ];
    const [day, alone] = stormDays(events);
    expect(day).toEqual({ group: { first_day: "2024-02-04", count: 3, seconds: 188_186 + 64 + 62 }, events: events.slice(0, 3) });
    expect(alone).toEqual({ group: null, events: [events[3]] });
  });

  test("the gap counts from the previous event's end, so a long outage holds the next one", () => {
    const events = [event("2025-02-05T02:00:00", 600), event("2025-02-04T15:09:00", 5.5 * 3600)];
    expect(stormDays(events)).toHaveLength(1);
    expect(stormDays([event("2025-02-05T03:00:00", 600), event("2025-02-04T15:09:00", 5.5 * 3600)])).toHaveLength(2);
  });

  test("a test or commissioning event stays alone, and a blip groups like an outage", () => {
    const events = [event("2026-11-09T09:40:00", 30, "blip"), event("2026-11-09T08:36:41", 64, "test"), event("2026-11-09T08:00:00", 20, "blip")];
    expect(stormDays(events).map((item) => [item.group?.count ?? null, item.events.map((e) => e.kind)])).toEqual([
      [2, ["blip", "blip"]], [null, ["test"]],
    ]);
  });
});

describe("blipsPerYear", () => {
  const blips = [event("2023-03-01T10:00:00", 20, "blip"), event("2022-11-01T10:00:00", 20, "blip"), event("2022-09-30T21:00:00", 20, "blip"), event("2022-10-01T00:30:00", 3600)];

  test("one true-up year gives its count", () => {
    expect(blipsPerYear(blips, { start: "2022-10-01", end: "2023-09-30" })).toEqual([{ label: "'22 - '23", count: 2 }]);
  });

  test("All time gives each true-up year from '21 - '22, a year without blips reading 0", () => {
    expect(blipsPerYear(blips, { start: "2021-10-01", end: "2024-09-30" })).toEqual([
      { label: "'21 - '22", count: 1 }, { label: "'22 - '23", count: 2 }, { label: "'23 - '24", count: 0 },
    ]);
  });
});

test("a length of time reads in days and hours from a day up, and as before under it, each part rounded down", () => {
  expect(duration(23 * 3600 + 59 * 60 + 59)).toBe("23 h 59 m");
  expect(duration(24 * 3600)).toBe("1 d 0 h");
  expect(duration(52 * 3600 + 16 * 60 + 12)).toBe("2 d 4 h");
  expect(duration(4 * 60 + 30)).toBe("4 m 30 s");
  expect(duration(42)).toBe("42 s");
});
