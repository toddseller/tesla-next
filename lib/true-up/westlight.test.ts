import { expect, test } from "vitest";
import type { DayGrid } from "./pricing";
import { generationCharges, WESTLIGHT, westlightIn } from "./westlight";

// A day's grid in Wh from its peak and off-peak nets in kWh, as the bills print them.
const day = (peakKwh: number, offPeakKwh: number): DayGrid => {
  const net = (peakKwh + offPeakKwh) * 1000;
  return { imported: Math.max(net, 0), exported: Math.max(-net, 0), peak_net: peakKwh * 1000 };
};

test("the October 2026 bill: September 3 to October 4, 2026", () => {
  const days = { "2026-09-30": day(-58.9291, 340.5411), "2026-10-01": day(-0.0372, 70.1781) };

  expect(generationCharges("2026-09-03", "2026-10-04", days)).toEqual({ generation: 13.08, eco100: 4.11, bonus: -0.59, total: 16.6 });
});

test("the November 2024 bill: October 4 to November 3, 2024", () => {
  const days = { "2024-10-04": day(56, 104) };

  expect(generationCharges("2024-10-04", "2024-11-03", days)).toEqual({ generation: 20.24, eco100: 1.6, bonus: 0, total: 21.84 });
});

test("the June 2025 bill: May 5 to June 3, 2025, ECO100 at 1.5 cents and the bonus at 1", () => {
  const days = { "2025-05-31": day(-92, -395), "2025-06-01": day(-13, -50) };

  expect(generationCharges("2025-05-05", "2025-06-03", days)).toEqual({ generation: -64.67, eco100: 0, bonus: -5.5, total: -70.17 });
});

test("a cycle across a revision prices each side at its own rates", () => {
  // 100 kWh off-peak on each side of ECO100's rise on January 1, 2025.
  const days = { "2024-12-31": day(0, 100), "2025-01-01": day(0, 100) };

  expect(generationCharges("2024-12-20", "2025-01-10", days)).toEqual({ generation: 23.52, eco100: 2.5, bonus: 0, total: 26.02 });
});

test("a day before the first revision has no rates", () => {
  expect(generationCharges("2023-08-20", "2023-09-10", { "2023-08-31": day(0, 10) })).toBeNull();
});

test("the revision in effect on a day, the newest past the last", () => {
  expect(westlightIn("2023-08-31")).toBeUndefined();
  expect(westlightIn("2025-02-09")!.effective_date).toBe("2025-01-01");
  expect(westlightIn("2025-02-10")!.effective_date).toBe("2025-02-10");
  expect(westlightIn("2027-11-01")).toBe(WESTLIGHT.at(-1));
});

test("'23 - '24 is priced at estimated revisions: PG&E's generation times each period's August 2024 ratio", () => {
  expect(westlightIn("2024-03-15")).toMatchObject({ effective_date: "2024-03-01", summer_peak: 0.20777, winter_off_peak: 0.13722, estimated: true });
  expect(westlightIn("2023-09-01")).toMatchObject({ effective_date: "2023-09-01", estimated: true });
});

test("from August 2024 the rates are WestLight's own, not estimated", () => {
  expect(westlightIn("2024-08-15")!.estimated).toBeFalsy();
  // The ratio is taken where both are known, so the last estimate equals the first known sheet.
  const [july, august] = WESTLIGHT.filter((r) => r.effective_date === "2024-07-01" || r.effective_date === "2024-08-01");
  expect([july.summer_peak, july.summer_off_peak, july.winter_peak, july.winter_off_peak]).toEqual([august.summer_peak, august.summer_off_peak, august.winter_peak, august.winter_off_peak]);
});
