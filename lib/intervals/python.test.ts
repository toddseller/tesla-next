import { expect, test } from "vitest";
import { localIso, localMidnight, pyRound } from "./python";

test.each([
  [0.125, 2, 0.12], // exactly representable tie: to even
  [0.375, 2, 0.38],
  [2.5, 0, 2],
  [3.5, 0, 4],
  [-0.5, 0, -0],
  [-2.5, 0, -2],
  [0.135, 2, 0.14], // 0.135 is stored a little above, so not a tie
  [2.675, 2, 2.67], // stored a little below 2.675
  [1.005, 2, 1], // stored a little below 1.005
  [7.2, 1, 7.2],
  [1234.5678, 2, 1234.57],
  [0, 2, 0],
])("round(%s, %s) is %s, as in Python", (value, digits, expected) => {
  expect(pyRound(value, digits)).toBe(expected);
});

test.each([
  ["2026-11-07T08:00:00Z", "2026-11-07T00:00:00-08:00"],
  ["2026-07-01T19:05:00Z", "2026-07-01T12:05:00-07:00"],
  // The night clocks go back: 1:30 AM happens twice.
  ["2026-11-01T08:30:00Z", "2026-11-01T01:30:00-07:00"],
  ["2026-11-01T09:30:00Z", "2026-11-01T01:30:00-08:00"],
  // The night clocks go forward: 2 AM to 3 AM never happens.
  ["2026-03-08T09:55:00Z", "2026-03-08T01:55:00-08:00"],
  ["2026-03-08T10:00:00Z", "2026-03-08T03:00:00-07:00"],
])("%s is %s at the site, as Python's isoformat writes it", (instant, expected) => {
  expect(localIso(new Date(instant))).toBe(expected);
});

test.each([
  ["2026-10-16", "2026-10-16T07:00:00.000Z"],
  ["2026-11-01", "2026-11-01T07:00:00.000Z"], // clocks go back at 2 AM: midnight is still PDT
  ["2026-11-02", "2026-11-02T08:00:00.000Z"],
  ["2026-03-08", "2026-03-08T08:00:00.000Z"], // clocks go forward at 2 AM: midnight is still PST
  ["2026-03-09", "2026-03-09T07:00:00.000Z"],
])("midnight starting %s at the site is %s", (day, expected) => {
  expect(new Date(localMidnight(day)).toISOString()).toBe(expected);
});
