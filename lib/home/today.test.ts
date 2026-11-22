// Today against the forecast (home-story spec): still to come is the forecast hours left after now.
import { expect, test } from "vitest";

import { stillToCome, todayRows } from "./today";

// 2 and 3 PM PST, 2.4 and 0.4 kWh expected.
const LEFT = [{ start: "2026-11-21T22:00:00.000Z", expected: 2.4, made: 2 }, { start: "2026-11-21T23:00:00.000Z", expected: 0.4, made: null }];
const at = (time: string, over = false) => ({ hours: LEFT, byNow: { made: 0, expected: 0, at: time, over } });

test("the forecast hours left after now: the rest of the current hour and every hour after it", () => {
  expect(stillToCome(at("2026-11-21T23:35:00.000Z"), 18)).toBe(0.2);
  expect(stillToCome(at("2026-11-21T22:30:00.000Z"), 18)).toBe(1.6);
  expect(stillToCome({ hours: LEFT, byNow: null }, 18)).toBe(2.8);
});

test("after the last hour or after sundown nothing is still to come, however the day's expected rounds", () => {
  expect(stillToCome(at("2026-11-22T00:10:00.000Z"), 20)).toBe(0);
  expect(stillToCome(at("2026-11-21T23:25:00.000Z", true), 20)).toBe(0);
});

test("without hours, the day's expected; without a forecast, none", () => {
  expect(stillToCome(null, 18)).toBe(18);
  expect(stillToCome(null, null)).toBeNull();
});

// Two 5 minute records at 10:00 and 10:05 AM, and the forecast's 9 and 10 AM hours (PST, so 17:00 and 18:00 UTC).
const DAY = {
  data: [
    { minute: 600, solar_to_home_kw: 1, solar_to_powerwall_kw: 2, solar_to_grid_kw: 3, grid_to_powerwall_kw: 0.5, powerwall_to_grid_kw: 0 },
    { minute: 605, solar_to_home_kw: 1.5, solar_to_powerwall_kw: 0, solar_to_grid_kw: 0, grid_to_powerwall_kw: 0, powerwall_to_grid_kw: 0.4 },
  ],
};
const HOURS = [{ start: "2026-11-21T17:00:00.000Z", expected: 2.4, made: 2 }, { start: "2026-11-21T18:00:00.000Z", expected: 3.6, made: 1 }];

test("the chart: solar up to the latest record, the Powerwalls charging and exports below zero, the forecast as kW at each hour's middle", () => {
  expect(todayRows(DAY, HOURS)).toEqual({
    records: [
      { minute: 600, solar: 6, charging: -2.5, exporting: -3 },
      { minute: 605, solar: 1.5, charging: -0, exporting: -0.4 },
    ],
    forecast: [{ minute: 570, kw: 2.4 }, { minute: 630, kw: 3.6 }],
    latest: 610,
  });
});
