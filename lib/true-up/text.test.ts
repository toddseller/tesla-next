// Ported from anton-tesla-api-ws's utils/trueUp.test.js, with the wording mockup A changed.
import { describe, expect, test } from "vitest";
import {
  billedText, chargesSoFarText, type Cycle, chargesText, cycleDates, currentHeadline, estimateText, kwh, netLabel, pastHeadline, runningNet,
  savingsText, startedCycles, totals, trueUpText, uncorrectedDays, vppText, yearName,
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

describe("the current year's headline", () => {
  const years = (...nets: number[]) => ({ years: nets.map((net, i) => ({ label: `'2${i + 4} - '2${i + 5}`, net })), band: { low: [], high: [] } });
  const headline = (kwh_projection: ReturnType<typeof years> | null, projections: { label: string; amount: number }[] | null, charges_so_far: number | null = 180.23) =>
    currentHeadline({ kwh_projection, projections, charges_so_far }, "'26 - '27", "2027-09-30");

  test("dollars to the dollar, the true-up's month and the charges so far, over the year-end net naming the years", () => {
    const text = headline(years(2092.1, 2376.1), [{ label: "'24 - '25", amount: 611.45 }, { label: "'25 - '26", amount: 656.69 }])!;
    expect(text.headline).toBe("On track to owe {$611} to {$657} at the October 2027 true\u2011up; {$180} in charges so far.");
    expect(plain(text.line)).toBe("Year-end {2,092} to {2,376} kWh imported, if the rest of the year goes like '24 - '25 or '25 - '26");
    expect(text.line).toContain(`like ${yearName("'24 - '25")} or ${yearName("'25 - '26")}`);
  });

  test("one year", () => {
    const text = headline({ ...years(2000), years: [{ label: "'25 - '26", net: 2000 }] }, [{ label: "'25 - '26", amount: 830.4 }])!;
    expect(text.headline).toBe("On track to owe {$830} at the October 2027 true\u2011up; {$180} in charges so far.");
    expect(plain(text.line)).toBe("Year-end {2,000} kWh imported, if the rest of the year goes like '25 - '26");
  });

  test("dollars without charges so far leave the charges out", () => {
    const text = headline(years(2000), [{ label: "'25 - '26", amount: 830.4 }], null)!;
    expect(text.headline).toBe("On track to owe {$830} at the October 2027 true‑up.");
  });

  test("without dollars, the headline holds the year-end net", () => {
    const text = headline(years(2092.1, 2376.1), null, null)!;
    expect(plain(text.headline)).toBe("On track to end '26 - '27 with {2,092} to {2,376} kWh imported.");
    expect(plain(text.line)).toBe("If the rest of the year goes like '24 - '25 or '25 - '26");
    expect(plain(headline(years(-500, -200), null, null)!.headline)).toBe("On track to end '26 - '27 with {200} to {500} kWh exported.");
  });

  test("a projection crossing zero", () => {
    expect(plain(headline(years(-120, 80), null, null)!.headline)).toBe("On track to end '26 - '27 between {120} kWh exported and {80} kWh imported.");
    expect(plain(headline(years(-200, 300), [{ label: "'24 - '25", amount: 50 }, { label: "'25 - '26", amount: 90 }])!.line)).toBe(
      "Year-end between {200} kWh exported and {300} kWh imported, if the rest of the year goes like '24 - '25 or '25 - '26",
    );
  });

  test("no headline without a projection", () => {
    expect(headline(null, null)).toBeNull();
  });
});

describe("a past year's headline", () => {
  const year = (label: string, amount_due: number | null) => ({ label, amount_due });

  test("more than the year before", () => {
    expect(plain(pastHeadline(year("'25 - '26", 767.73), year("'24 - '25", 554.83)))).toBe("'25 - '26 ended owing {$768} at the true\u2011up, {$213} more than '24 - '25.");
  });

  test("less, the same, and nothing due", () => {
    expect(plain(pastHeadline(year("'26 - '27", 500), year("'25 - '26", 767.73)))).toBe("'26 - '27 ended owing {$500} at the true\u2011up, {$268} less than '25 - '26.");
    expect(plain(pastHeadline(year("'26 - '27", 767.6), year("'25 - '26", 767.73)))).toBe("'26 - '27 ended owing {$768} at the true\u2011up, the same as '25 - '26.");
    expect(plain(pastHeadline(year("'26 - '27", 0), year("'25 - '26", 767.73)))).toBe("'26 - '27 ended with nothing due at the true\u2011up, {$768} less than '25 - '26.");
  });

  test("no headline without both amounts", () => {
    expect(pastHeadline(year("'23 - '24", 0), year("'22 - '23", null))).toBeNull();
    expect(pastHeadline(year("'22 - '23", null), year("'21 - '22", null))).toBeNull();
    expect(pastHeadline(year("'22 - '23", 400), null)).toBeNull();
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

  test("a season that hasn't begun says so rather than $0", () => {
    expect(vppText(season({ season: 2027, kwh: 0, estimate: 0 }), "2026-11-08"))
      .toEqual({ value: "Not started", unit: "2027 season", line: `The season runs May 1 to October 31. ${tesla}` });
  });

  test("a season under way without marked events", () => {
    expect(vppText(season({ season: 2027, kwh: 0, estimate: 0 }), "2027-06-10"))
      .toEqual({ value: "$0", unit: "2027 season", line: `No events marked yet; the season runs May 1 to October 31. ${tesla}` });
  });

  test("no season", () => {
    expect(vppText(null, "2026-11-08")).toBeNull();
  });
});

// --- The savings card -------------------------------------------------------------------

// '25 - '26 as the real run priced it on November 8, 2026.
const YEAR_25_26 = {
  actual: { pge: 825, westlight: 293.07, total: 1118.07 }, solar_only: { pge: 678.61, westlight: 288.62, total: 967.23 },
  no_system: { pge: 5207.64, westlight: 1487.03, total: 6694.67 }, solar_saved: 5727.44, powerwalls_added: -150.84,
  powerwalls_held: -83.08, powerwalls_vpp: 42.5, powerwalls_storm: 0, powerwalls_used: -110.26, held_days: 129, vpp_days: 6, storm_days: 0, used_days: 232,
  peak_only: { pge: 731.49, westlight: 253.9, total: 985.39 } as { pge: number; westlight: number; total: number } | null, efficiency: 0.85 as number | null,
  rebuilt_days: 205, uncorrected_days: 1, through: "2026-10-04", pge_rates: "2026-06-01", westlight_rates: "2026-07-01", estimated_rates: false,
};
const SEASON_2026 = { season: 2026, payout: null, paid_on: null, kwh: 183.8, estimate: 367.6 };

describe("savingsText", () => {
  test("'25 - '26: the Powerwalls cost money, beside their VPP credit estimate", () => {
    const text = savingsText(YEAR_25_26, SEASON_2026, false);

    // Every shown dollar adds up: $1,118 + $5,577 = $6,695, and $5,727 less the Powerwalls' $150 = $5,577, so the
    // Powerwalls show $150 though their $150.84 would round alone to $151.
    expect(text).toMatchObject({ saved: "$5,577", unit: "estimate, of $6,695 without solar or Powerwalls", paid: "$1,118", paidSplit: "PG&E $825 · WestLight $293", solar: "$5,727",
      solarLess: "Solar $5,727 against buying it all from the grid, less the Powerwalls' $150" });
    expect(text.bar).toEqual({ parts: [["paid", 1118.07], ["saved", 5576.6]], label: "Of $6,695: $1,118 paid, $5,577 saved" });
    expect(text.powerwalls).toEqual({
      bill: "$150 cost on the bill",
      vpp: "$368 VPP credit, an estimate for the 2026 season.",
      parts: [["Keeping charge, 129 days", "$83 cost"], ["Storing solar, 232 days", "$110 cost"], ["VPP events, 6 days", "$43 saved"]],
      whatIf: { value: "About $133 less", line: "Covering only 4 to 9 p.m. on those 232 days." },
      nem2: "Under NEM2, exporting solar earns about what importing it later costs, so storing it pays only between 4 and 9 p.m.",
    });
    expect(text.estimates).toBe("Estimates of PG&E's and WestLight Energy's charges. 205 days before April 27, 2026 rebuilt from PG&E's meter, 1 as Tesla read it.");
  });

  test("the Powerwalls' effect under a dollar: cost or saved is decided by the dollars shown, so the card can't contradict itself", () => {
    const year = { ...YEAR_25_26, actual: { pge: 100.4, westlight: 0, total: 100.4 }, no_system: { pge: 200.6, westlight: 0, total: 200.6 }, solar_saved: 100.4, powerwalls_added: -0.2 };
    const text = savingsText(year, null, false);
    // $201 less $100 paid is $101 saved; solar's $100 leaves the Powerwalls $1 saved, not a cost.
    expect([text.saved, text.solar, text.powerwalls.bill, text.solarLess, text.powerwallsCost]).toEqual(["$101", "$100", "$1 saved on the bill", null, false]);
    expect(text.bar.parts.every(([, dollars]) => dollars >= 0)).toBe(true);
  });

  test("a year the Powerwalls saved money splits the bar three ways", () => {
    const year = { ...YEAR_25_26, actual: { pge: 700, westlight: 205.1, total: 905.1 }, solar_only: { pge: 900, westlight: 220.75, total: 1120.75 },
      no_system: { pge: 2800, westlight: 610.2, total: 3410.2 }, solar_saved: 2289.45, powerwalls_added: 215.65 };

    const text = savingsText(year, null, false);

    expect(text.bar).toEqual({
      parts: [["paid", 905.1], ["powerwalls", 215.65], ["solar", 2289.45]],
      label: "Of $3,410: $905 paid, $216 saved by the Powerwalls, $2,289 saved by solar",
    });
    expect([text.powerwalls.bill, text.powerwalls.vpp, text.powerwalls.nem2]).toEqual(["$216 saved on the bill", null, null]);
    expect(text.solarLess).toBeNull();
    expect(text.powerwallsCost).toBe(false);
  });

  test("a WestLight credit reads as a credit, not a charge", () => {
    const text = savingsText({ ...YEAR_25_26, actual: { pge: 143.74, westlight: -71.91, total: 71.83 } }, null, false);

    expect([text.paid, text.paidSplit]).toEqual(["$72", "PG&E $144 · WestLight $72 credit"]);
    expect(savingsText({ ...YEAR_25_26, actual: { pge: 120, westlight: -150, total: -30 } }, null, false).paid).toBe("$30 credit");
  });

  test("a paid season gives its payout", () => {
    const text = savingsText(YEAR_25_26, { season: 2025, payout: 728.26, paid_on: "2026-04-15", kwh: 364.1, estimate: 728.2 }, false);

    expect(text.powerwalls.vpp).toBe("$728 VPP credit, the 2025 season's payout.");
  });

  test.each([
    ["peak-only would have cost more", 1130.47, "About $12 more"],
    ["peak-only within a dollar", 1118.4, "About the same"],
  ])("%s", (_, total, value) => {
    const text = savingsText({ ...YEAR_25_26, peak_only: { pge: 0, westlight: 0, total } }, null, false);

    expect(text.powerwalls.whatIf!.value).toBe(value);
  });

  test("VPP event days are their own part, after storing solar", () => {
    const text = savingsText({ ...YEAR_25_26, vpp_days: 21, powerwalls_vpp: 25.01, used_days: 217, powerwalls_used: -92.77 }, SEASON_2026, false);

    expect(text.powerwalls.parts).toEqual([
      ["Keeping charge, 129 days", "$83 cost"], ["Storing solar, 217 days", "$93 cost"], ["VPP events, 21 days", "$25 saved"],
    ]);
  });

  test("storm watch days are their own part, after VPP events, and left out with none", () => {
    const text = savingsText({ ...YEAR_25_26, storm_days: 3, powerwalls_storm: -18.4, used_days: 229, powerwalls_used: -91.86 }, SEASON_2026, false);

    expect(text.powerwalls.parts.slice(-2)).toEqual([["VPP events, 6 days", "$43 saved"], ["Storm watch, 3 days", "$18 cost"]]);
    expect(savingsText(YEAR_25_26, SEASON_2026, false).powerwalls.parts.map(([label]) => label)).not.toContain("Storm watch, 0 days");
  });

  test("no used days: the held part alone and no what-if", () => {
    const text = savingsText({ ...YEAR_25_26, held_days: 35, used_days: 0, vpp_days: 0, powerwalls_held: -23.95, powerwalls_used: 0, powerwalls_vpp: 0, peak_only: null }, null, true);

    expect(text.powerwalls.parts).toEqual([["Keeping charge, 35 days", "$24 cost"]]);
    expect(text.powerwalls.whatIf).toBeNull();
  });

  test("one day of each reads in the singular, and a part that saved says so", () => {
    const text = savingsText({ ...YEAR_25_26, held_days: 1, used_days: 1, vpp_days: 0, powerwalls_held: -1.2, powerwalls_used: 3.4, powerwalls_vpp: 0 }, null, true);

    expect(text.powerwalls.parts).toEqual([["Keeping charge, 1 day", "$1 cost"], ["Storing solar, 1 day", "$3 saved"]]);
    expect(text.powerwalls.whatIf!.line).toBe("Covering only 4 to 9 p.m. on that day.");
  });

  test("a season with no events yet gives no VPP credit", () => {
    expect(savingsText(YEAR_25_26, { ...SEASON_2026, season: 2027, kwh: 0, estimate: 0 }, true).powerwalls.vpp).toBeNull();
  });

  test("the current year reads so far, and days after the fix need no note", () => {
    const text = savingsText({ ...YEAR_25_26, rebuilt_days: 0, uncorrected_days: 0, through: "2026-11-08" }, null, true);

    expect([text.saved, text.unit]).toEqual(["$5,577", "estimate so far, of $6,695 without solar or Powerwalls"]);
    expect(text.estimates).toBe("Estimates of PG&E's and WestLight Energy's charges.");
  });

  test("one rebuilt day, and WestLight rates more than a year old", () => {
    const text = savingsText({ ...YEAR_25_26, rebuilt_days: 1, uncorrected_days: 0, through: "2027-11-01", westlight_rates: "2026-03-01" }, null, true);

    expect(text.estimates).toBe(
      "Estimates of PG&E's and WestLight Energy's charges. 1 day before April 27, 2026 rebuilt from PG&E's meter. WestLight's rates are from March 2026.",
    );
  });

  test("a year priced at estimated WestLight rates says so", () => {
    const text = savingsText({ ...YEAR_25_26, rebuilt_days: 361, uncorrected_days: 5, estimated_rates: true }, null, false);

    expect(text.estimates).toBe(
      "Estimates of PG&E's and WestLight Energy's charges. 361 days before April 27, 2026 rebuilt from PG&E's meter, 5 as Tesla read it. WestLight's generation rates this year are estimated from PG&E's.",
    );
  });
});
