// @vitest-environment jsdom
// The true-up-tracker spec's tiles, on the current year's and '25 - '26's figures from mockup A.
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";

import { COST_25_26, CURRENT, CURRENT_COST, NO_COST, YEAR_25_26, yearOf } from "@/components/true-up/fixtures";
import { Tiles } from "@/components/true-up/tiles";

afterEach(cleanup);

const TODAY = "2026-11-08";
const titles = () => screen.getAllByRole("region").map((tile) => within(tile).getByRole("heading").textContent);
const tile = (name: string) => screen.getByRole("region", { name }).textContent!.replace(/ /g, " ");

test("the current year: its net so far, charges so far, projected true-up and VPP credit", () => {
  render(<Tiles cycles={CURRENT} cost={CURRENT_COST} year={yearOf(2027)} today={TODAY} />);

  expect(titles()).toEqual(["Net so far", "Charges so far", "Projected true-up", "Tesla VPP credit"]);
  expect(tile("Net so far")).toBe("Net so far408.6kWh importedImported 660.1 · Exported 251.4 kWhPeak (4 to 9 p.m.) 15.8 exported · Off-peak 424.4 imported");
  expect(tile("Charges so far")).toBe("Charges so far$106.46estimateNEM charges for 2 cycles, before taxes. No PG&E bill in yet.");
  expect(tile("Projected true-up")).toBe("Projected true-up$593–$652Year-end 2,032 to 2,362 kWh imported, if the rest of the year goes like '24 - '25 or '25 - '26");
  expect(tile("Tesla VPP credit")).toBe("Tesla VPP credit$02027 seasonNo events marked yet; the season runs May 1 to October 31. Tesla pays it, apart from PG&E's true-up.");
});

test("'25 - '26: its net for the year, true-up from the statement, bills against the estimate and VPP estimate", () => {
  render(<Tiles cycles={YEAR_25_26} cost={COST_25_26} year={yearOf(2026)} today={TODAY} />);

  expect(titles()).toEqual(["Net for the year", "True-up", "Billed against estimate", "Tesla VPP credit"]);
  expect(tile("Net for the year")).toBe("Net for the year2,422.7kWh importedImported 6,530.7 · Exported 4,107.7 kWhPeak (4 to 9 p.m.) 413.4 imported · Off-peak 2,009.3 imported");
  expect(tile("True-up")).toBe("True-up$767.73From PG&E's statement: NEM charges of $827.82, less $60.09 of minimum delivery charges already paid.");
  expect(tile("Billed against estimate")).toBe("Billed against estimate$2.82underPG&E billed $827.82 for 12 cycles; the estimate for them was $825.00.");
  expect(tile("Tesla VPP credit")).toContain("$368estimate2026 season: 183.8 kWh in VPP events");
});

test("a finished year calculated, and one with nothing due", () => {
  const calculated = YEAR_25_26.map((c) => ({ ...c, nem_source: "calculated" as const, estimated_nem_charges: null, billed_net_kwh: null }));
  render(<Tiles cycles={calculated} cost={{ ...COST_25_26, amount_due: 459.72, source: "calculated", charges_so_far: 600, minimum_delivery: 140.28 }} year={yearOf(2026)} today={TODAY} />);
  expect(tile("True-up")).toBe("True-up$459.72estimateCalculated from PG&E's published rates: NEM charges of $600.00, less $140.28 of minimum delivery charges already paid.");
  expect(titles()).not.toContain("Billed against estimate");
  cleanup();

  render(<Tiles cycles={calculated} cost={{ ...COST_25_26, amount_due: 0, source: "calculated", charges_so_far: -58.03, net_exported_kwh: 412.3, unused_credit: 58.03, nsc_estimate: 15.07 }} year={yearOf(2026)} today={TODAY} />);
  expect(tile("True-up")).toBe("True-upNothing dueestimate$58.03 of unused credit isn't paid out; PG&E pays about $15 of Net Surplus Compensation on the 412.3 kWh exported.");
});

test("a year without dollars or a VPP season says why, and has no VPP tile", () => {
  render(<Tiles cycles={YEAR_25_26} cost={NO_COST} year={yearOf(2023)} today={TODAY} />);

  expect(titles()).toEqual(["Net for the year", "True-up", "Billed against estimate"]);
  expect(tile("True-up")).toBe("True-upNot shownPG&E's statement for this year isn't available, and the rates it was billed at aren't stored.");
});

test("the projection without dollars gives the year-end net alone", () => {
  render(<Tiles cycles={CURRENT} cost={{ ...CURRENT_COST, charges_so_far: null, projections: null }} year={yearOf(2027)} today={TODAY} />);

  expect(titles()).toEqual(["Net so far", "Projected true-up", "Tesla VPP credit"]);
  expect(tile("Projected true-up")).toBe("Projected true-upYear-end 2,032 to 2,362 kWh imported, if the rest of the year goes like '24 - '25 or '25 - '26");
});

test("a paid VPP season", () => {
  render(<Tiles cycles={YEAR_25_26} cost={{ ...COST_25_26, vpp: { season: 2025, payout: 728.26, paid_on: "2026-04-02", kwh: 13.2, estimate: 26.4 } }} year={yearOf(2025)} today={TODAY} />);

  expect(tile("Tesla VPP credit")).toBe("Tesla VPP credit$728.262025 seasonPaid April 2026. Tesla pays it, apart from PG&E's true-up.");
});

test("All time or a custom range shows the net alone", () => {
  render(<Tiles cycles={[...YEAR_25_26, ...CURRENT]} cost={NO_COST} year={null} today={TODAY} />);

  expect(titles()).toEqual(["Net"]);
});

test("ahead in summer, the net reads exported", () => {
  render(<Tiles cycles={[{ ...YEAR_25_26[8], imported: 50, exported: 450, net: -400, peak_net: -100, off_peak_net: -300 }]} cost={NO_COST} year={null} today={TODAY} />);

  expect(tile("Net")).toContain("400.0kWh exported");
});

test("year names never break", () => {
  render(<Tiles cycles={CURRENT} cost={CURRENT_COST} year={yearOf(2027)} today={TODAY} />);

  expect(screen.getByRole("region", { name: "Projected true-up" }).textContent).toContain("'24 - '25");
});
