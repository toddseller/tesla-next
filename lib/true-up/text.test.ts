// Ported from anton-tesla-api-ws's utils/trueUp.test.js, with the wording mockup A changed.
import { describe, expect, test } from "vitest";
import {
  billedText, chargesSoFarText, type Cycle, chargesText, cycleDates, estimateText, kwh, netLabel, projectionText, runningNet,
  startedCycles, totals, trueUpText, uncorrectedDays, vppText, yearName,
} from "./text";

const cycle = (first_day: string, last_day: string, true_up: string, net: number, extra = {}) => ({
  first_day, last_day, true_up, through: last_day as string | null, imported: net + 100, exported: 100, net,
  peak_net: net / 4, off_peak_net: (net * 3) / 4, uncorrected_days: 0,
  nem_charges: null as number | null, nem_source: null as Cycle["nem_source"], estimated_nem_charges: null as number | null, billed_net_kwh: null as number | null,
  ...extra,
});
const future = (first_day: string, last_day: string) => ({
  ...cycle(first_day, last_day, "'26 - '27", 0), through: null, imported: null, exported: null, net: null, peak_net: null, off_peak_net: null,
});

// The page's text, with non-breaking spaces read as ordinary ones.
const plain = (text: string | null | undefined) => text?.replace(/ /g, " ");

test("only cycles with data are shown, never empty future ones", () => {
  const open = cycle("2026-10-05", "2026-11-03", "'26 - '27", 50, { through: "2026-10-21" });
  expect(startedCycles([open, future("2026-11-04", "2026-12-04")])).toEqual([open]);
});

test("totals add up the cycles' grid energy", () => {
  const cycles = [cycle("2025-10-03", "2025-11-03", "'25 - '26", 200), cycle("2025-11-04", "2025-12-04", "'25 - '26", 300)];
  expect(totals(cycles)).toEqual({ imported: 700, exported: 200, net: 500, peak: 125, offPeak: 375 });
});

test("the running net starts again at each true-up year", () => {
  const cycles = [
    cycle("2025-08-05", "2025-09-03", "'24 - '25", 100), cycle("2025-09-04", "2025-10-03", "'24 - '25", 50),
    cycle("2025-10-04", "2025-11-04", "'25 - '26", 200), cycle("2025-11-05", "2025-12-05", "'25 - '26", -30),
  ];
  expect(runningNet(cycles)).toEqual([100, 150, 200, 170]);
});

test("a cycle without a net keeps its place in the running net, empty", () => {
  const cycles = [cycle("2025-10-03", "2025-11-03", "'25 - '26", 100), { ...future("2025-11-04", "2025-12-04"), true_up: "'25 - '26" }, cycle("2025-12-05", "2026-01-05", "'25 - '26", 50)];
  expect(runningNet(cycles)).toEqual([100, null, 150]);
});

test("uncorrected days add up across the cycles", () => {
  expect(uncorrectedDays([cycle("a", "b", "x", 1, { uncorrected_days: 1 }), cycle("c", "d", "x", 1, { uncorrected_days: 29 })])).toBe(30);
  expect(uncorrectedDays([])).toBe(0);
});

test.each([[500, "Imported"], [0.04, "Exported"], [0, "Exported"], [-400, "Exported"]])("a net of %d kWh reads %s", (value, label) => {
  expect(netLabel(value)).toBe(label);
});

test("kWh read to a tenth with thousands, without a sign", () => {
  expect([kwh(2422.7), kwh(-15.8), kwh(0)]).toEqual(["2,422.7", "15.8", "0.0"]);
});

test("a closed cycle shows its dates; the open one runs to its last day so far", () => {
  expect(cycleDates(cycle("2025-10-03", "2025-11-03", "'25 - '26", 1))).toBe("Oct 3 to Nov 3");
  expect(cycleDates(cycle("2026-11-03", "2026-12-03", "'26 - '27", 1, { through: "2026-11-08" }))).toBe("Nov 3 to Nov 8 (so far)");
});

test("a true-up year's name keeps its spaces from breaking", () => {
  expect(yearName("'24 - '25")).toBe("'24 - '25");
});

describe("cycle charges", () => {
  test("PG&E's figure, a credit, an estimate and none, never with a minus sign", () => {
    expect(chargesText({ nem_charges: 101.41, nem_source: "statement" })).toBe("$101.41");
    expect(chargesText({ nem_charges: -118.81, nem_source: "statement" })).toBe("$118.81 credit");
    expect(chargesText({ nem_charges: 1234.5, nem_source: "calculated" })).toBe("$1,234.50 est.");
    expect(chargesText({ nem_charges: -4, nem_source: "calculated" })).toBe("$4.00 credit est.");
    expect(chargesText({ nem_charges: null, nem_source: null })).toBeNull();
  });

  const billed = (nem_charges: number, estimated_nem_charges: number | null, billed_net_kwh = 364) =>
    ({ nem_charges, nem_source: "statement" as const, estimated_nem_charges, billed_net_kwh });

  test("under a billed cycle's charge: the estimate and PG&E's net", () => {
    expect(estimateText(billed(113.41, 113.72))).toBe("est. $113.72 · PG&E net 364 kWh");
    expect(estimateText(billed(-101.36, -102.04, -397))).toBe("est. $102.04 credit · PG&E net 397 kWh exported");
    expect(estimateText(billed(113.41, null))).toBe("PG&E net 364 kWh");
    expect(estimateText({ nem_charges: 97.22, nem_source: "calculated", estimated_nem_charges: null, billed_net_kwh: null })).toBeNull();
  });

  test("billed against estimate: under, over and exactly", () => {
    const year = Array.from({ length: 12 }, (_, i) => billed(i ? 60 : 167.82, i ? 60 : 165));
    expect(billedText(year)).toEqual({ value: "$2.82", unit: "under", line: "PG&E billed $827.82 for 12 cycles; the estimate for them was $825.00." });
    expect(billedText([billed(113.41, 120)])).toEqual({ value: "$6.59", unit: "over", line: "PG&E billed $113.41 for 1 cycle; the estimate for it was $120.00." });
    expect(billedText([billed(500, 327.82), billed(327.82, 500)])).toMatchObject({ value: "Exact", unit: null });
    expect(billedText([billed(-58.03, -60)])!.line).toBe("PG&E billed a credit of $58.03 for 1 cycle; the estimate for it was a credit of $60.00.");
    expect(billedText([billed(113.41, null), { nem_charges: 4.49, nem_source: "calculated", estimated_nem_charges: null, billed_net_kwh: null }])).toBeNull();
  });
});

describe("the projection", () => {
  const years = (...nets: number[]) => ({ years: nets.map((net, i) => ({ label: `'2${i + 4} - '2${i + 5}`, net })), band: { low: [], high: [] } });

  test("dollars to the dollar, and the year-end net naming the years", () => {
    const text = projectionText(years(2031.9, 2361.5), [{ label: "'24 - '25", amount: 592.92 }, { label: "'25 - '26", amount: 652.39 }]);
    expect(text.value).toBe("$593–$652");
    expect(plain(text.line)).toBe("Year-end 2,032 to 2,362 kWh imported, if the rest of the year goes like '24 - '25 or '25 - '26");
    expect(text.line).toContain(`like ${yearName("'24 - '25")} or ${yearName("'25 - '26")}`);
  });

  test("one year, and without dollars", () => {
    const text = projectionText({ ...years(2000), years: [{ label: "'25 - '26", net: 2000 }] }, null);
    expect(text.value).toBeNull();
    expect(plain(text.line)).toBe("Year-end 2,000 kWh imported, if the rest of the year goes like '25 - '26");
    expect(projectionText(years(1650, 2000), [{ label: "'25 - '26", amount: 830.4 }]).value).toBe("$830");
  });

  test("exports, and a range crossing zero", () => {
    expect(plain(projectionText(years(-500, -200), null).line)).toBe("Year-end 200 to 500 kWh exported, if the rest of the year goes like '24 - '25 or '25 - '26");
    expect(plain(projectionText(years(-200, 300), null).line)).toBe("Year-end between 200 kWh exported and 300 kWh imported, if the rest of the year goes like '24 - '25 or '25 - '26");
  });
});

describe("the year in dollars", () => {
  const cost = (fields: object) => ({
    charges_so_far: null, amount_due: null, source: null, minimum_delivery: null, net_exported_kwh: null,
    unused_credit: null, nsc_rate: null, nsc_estimate: null, ...fields,
  });

  test("charges so far, marked as an estimate when any cycle is calculated", () => {
    const calculated = [cycle("a", "b", "x", 1, { nem_source: "calculated" }), cycle("c", "d", "x", 1, { nem_source: "calculated" })];
    expect(chargesSoFarText(cost({ charges_so_far: 106.46 }), calculated))
      .toEqual({ value: "$106.46", unit: "estimate", line: "NEM charges for 2 cycles, before taxes. No PG&E bill in yet." });
    expect(chargesSoFarText(cost({ charges_so_far: 113.41 }), [cycle("a", "b", "x", 1, { nem_source: "statement" })]))
      .toEqual({ value: "$113.41", unit: null, line: "NEM charges for 1 cycle, before taxes." });
  });

  test("a finished year from PG&E's statement", () => {
    expect(trueUpText(cost({ charges_so_far: 827.82, amount_due: 767.73, source: "statement", minimum_delivery: 60.09 }))).toEqual({
      value: "$767.73", unit: null, line: "From PG&E's statement: NEM charges of $827.82, less $60.09 of minimum delivery charges already paid.",
    });
  });

  test("a finished year calculated from the rates", () => {
    expect(trueUpText(cost({ charges_so_far: 600, amount_due: 459.72, source: "calculated", minimum_delivery: 140.28 }))).toEqual({
      value: "$459.72", unit: "estimate", line: "Calculated from PG&E's published rates: NEM charges of $600.00, less $140.28 of minimum delivery charges already paid.",
    });
  });

  test("nothing due with credit left over, with and without Net Surplus Compensation", () => {
    const credit = { charges_so_far: -58.03, amount_due: 0, source: "calculated", minimum_delivery: 140.28, net_exported_kwh: 412.3, unused_credit: 58.03 };
    expect(trueUpText(cost({ ...credit, nsc_rate: 0.03656, nsc_estimate: 15.07 }))).toEqual({
      value: "Nothing due", unit: "estimate",
      line: "$58.03 of unused credit isn't paid out; PG&E pays about $15 of Net Surplus Compensation on the 412.3 kWh exported.",
    });
    expect(trueUpText(cost(credit))!.line).toBe("$58.03 of unused credit isn't paid out; PG&E pays Net Surplus Compensation on the 412.3 kWh exported.");
    expect(trueUpText(cost({ charges_so_far: -40, amount_due: 0, source: "statement" }))).toEqual({ value: "Nothing due", unit: null, line: "From PG&E's statement. Unused credit isn't paid out." });
  });

  test("a year without dollars", () => {
    expect(trueUpText(cost({}))).toEqual({
      value: "Not shown", unit: null, line: "PG&E's statement for this year isn't available, and the rates it was billed at aren't stored.",
    });
  });
});

describe("the VPP credit", () => {
  const season = (fields: object) => ({ season: 2026, payout: null, paid_on: null, kwh: 183.8, estimate: 367.6, ...fields });
  const tesla = "Tesla pays it, apart from PG&E's true-up.";

  test("a paid season shows its payout and the month it came", () => {
    expect(vppText(season({ season: 2025, payout: 728.26, paid_on: "2026-04-02", estimate: 26.4 }), "2026-11-08"))
      .toEqual({ value: "$728.26", unit: "2025 season", line: `Paid April 2026. ${tesla}` });
  });

  test("an unpaid season is an estimate, so far while it runs", () => {
    expect(vppText(season({}), "2026-11-08"))
      .toEqual({ value: "$368", unit: "estimate", line: "2026 season: 183.8 kWh in VPP events at $2.00. Paid by Tesla around spring 2027, apart from PG&E's true-up." });
    expect(vppText(season({}), "2026-10-22")!.line).toBe("2026 season so far: 183.8 kWh in VPP events at $2.00. Paid by Tesla around spring 2027, apart from PG&E's true-up.");
  });

  test("a season without marked events", () => {
    expect(vppText(season({ season: 2027, kwh: 0, estimate: 0 }), "2026-11-08"))
      .toEqual({ value: "$0", unit: "2027 season", line: `No events marked yet; the season runs May 1 to October 31. ${tesla}` });
  });

  test("no season", () => {
    expect(vppText(null, "2026-11-08")).toBeNull();
  });
});
