import { expect, test } from "vitest";
import { type CaseDay, isHeld, peakOnlyDay } from "./savings";

// A day's figures in kWh, stored as the Wh caseDays gives.
const day = (kwh: { imported?: number; exported?: number; shortfall?: number; peakExported?: number; peak?: number }): CaseDay => {
  const wh = (value = 0) => value * 1000;
  return {
    solarOnly: { imported: wh(kwh.imported), exported: wh(kwh.exported), peak_net: wh(kwh.shortfall) - wh(kwh.peakExported) },
    noSystem: { imported: 0, exported: 0, peak_net: 0 },
    shortfall: wh(kwh.shortfall), peakExported: wh(kwh.peakExported), vpp: false,
    powerwalls: { peak: wh(kwh.peak), charged: 0, discharged: 0 },
  };
};

test.each([
  ["a poor-solar day held in Savings mode", { shortfall: 6.2, peak: 0 }, true],
  ["a sunny day in Self-Powered mode", { shortfall: 6.5, peak: 6.5 }, false],
  ["nothing to cover", { shortfall: 0.8, peak: 0 }, false],
  ["discharging exactly 1 kWh counts as used", { shortfall: 5, peak: 1 }, false],
  ["a shortfall of exactly 1 kWh has nothing to hold back from", { shortfall: 1, peak: 0 }, false],
])("%s", (_, figures, held) => {
  expect(isHeld(day(figures))).toBe(held);
});

test("a summer day: the peak shortfall covered, and refilled from the off-peak exports", () => {
  const peakOnly = peakOnlyDay(day({ imported: 5, exported: 20, shortfall: 5 }), 0.9);

  expect(peakOnly.imported).toBe(0);
  expect(peakOnly.peak_net).toBe(0);
  expect(peakOnly.exported / 1000).toBeCloseTo(14.44, 2);
});

test("not enough exported to refill: the rest is imported off-peak", () => {
  const peakOnly = peakOnlyDay(day({ imported: 5, exported: 3, shortfall: 5 }), 0.9);

  expect(peakOnly.exported).toBe(0);
  expect(peakOnly.imported / 1000).toBeCloseTo(2.56, 2);
  expect(peakOnly.peak_net).toBe(0);
});

test("exports from 4 to 9 p.m. aren't used to refill", () => {
  const peakOnly = peakOnlyDay(day({ imported: 5, exported: 4, shortfall: 5, peakExported: 4 }), 1);

  expect([peakOnly.exported, peakOnly.imported, peakOnly.peak_net]).toEqual([4000, 5000, -4000]);
});

test("a day with no shortfall is unchanged", () => {
  const solarOnly = day({ imported: 2, exported: 20 });

  expect(peakOnlyDay(solarOnly, 0.9)).toEqual(solarOnly.solarOnly);
});
