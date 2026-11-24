// @vitest-environment jsdom
// The home page's Since 2021 chapter (home-story spec: Since 2021, its figures, the true-up explained, the Powerwalls' payback in words).
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { Since } from "./since";

// jsdom can't lay a chart out, so the shaded box is caught as Since asks for it.
const areas = vi.hoisted(() => [] as Record<string, unknown>[]);
vi.mock("recharts", async (original) => ({
  ...(await original<typeof import("recharts")>()),
  ReferenceArea: (props: Record<string, unknown>) => { areas.push(props); return null; },
}));

const TODAY = "2026-11-21";
const MONTHS = [{ month: "2021-10", solar: 400, house: 300 }, { month: "2021-11", solar: 900, house: 1100 }, { month: "2026-11", solar: 600, house: 700 }];
const PAYBACK = {
  solar: { year: 2025, projected: false, estimated: true, month: "2025-03" },
  system: { year: 2028, projected: true, estimated: true },
  powerwalls: { year: null, wont: true },
};
const since = (over: Partial<Parameters<typeof Since>[0]> = {}) =>
  render(<Since today={TODAY} months={MONTHS} solar={75611.4} matched={100} net={609.3} share={73} owed={null} trueUpEnd="2027-09-30" payback={PAYBACK} {...over} />);

afterEach(cleanup);

test("the running totals, named, with today and the payback marked, and the figures in words", () => {
  since();
  expect(screen.getByRole("heading", { name: "Since 2021" })).toBeTruthy();
  expect(screen.getByRole("img", { name: /^Running totals since October 10, 2021: solar 1.9 MWh against the house's 2.1 MWh; Solar paid for itself in March 2025\./ })).toBeTruthy();
  expect(screen.getByText("solar generated")).toBeTruthy();
  expect(document.body.textContent).toContain("Solar has generated as much as the house used: 75.6 MWh, 100%.");
  expect(screen.queryByText(/this true-up year, since/)).toBeNull();
  expect(document.body.textContent!.split("609.3 kWh")).toHaveLength(2);
  expect(screen.getByText("dotted line: solar paid back, March 2025")).toBeTruthy();
  expect(screen.queryByText(/Solar paid for itself/)).toBeNull();
  expect(screen.getByText("The Powerwalls won't pay for themselves within their warranty.")).toBeTruthy();
  expect(screen.getByRole("link", { name: "The true-up and payback" }).getAttribute("href")).toBe("/true-up");
  expect(document.body.textContent).not.toMatch(/\$/);
});

test("a projected solar payback, with no line to key, is said in words", () => {
  since({ payback: { ...PAYBACK, solar: { year: 2027, projected: true, month: null } } });
  expect(screen.queryByText(/dotted line/)).toBeNull();
  expect(screen.getByText("Solar should pay for itself in 2027, projected. The Powerwalls won't pay for themselves within their warranty.")).toBeTruthy();
});

test("without the costs file there is no payback, and a year that sent more says so", () => {
  since({ payback: null, net: -120.5, matched: 92 });
  expect(screen.queryByText(/paid for itself|pays back/)).toBeNull();
  expect(document.body.textContent).toContain("the house has sent 120.5 kWh more to PG&E than it drew.");
  expect(document.body.textContent).toContain("Solar has generated 75.6 MWh, 92% of what the house used.");
});

test("a whole-system year already reached reads as paid back, not projected", () => {
  since({ payback: { ...PAYBACK, system: { year: 2026, projected: false } } });
  expect(screen.getByText("shaded box: the whole system paid back in 2026")).toBeTruthy();
});

test("a true-up year with nothing net reads as even, not as sent", () => {
  since({ net: 0.02 });
  expect(document.body.textContent).toContain("the house has sent as much to PG&E as it drew.");
});

test("the legend says the house's line includes the car", () => {
  since();
  expect(screen.getByText("house used, car included")).toBeTruthy();
});

// home-story, "Since 2021": the chart ends at today, so a projected year is said in words, not drawn in an empty future.
test("a projected whole-system year is a sentence under the chart, not a box past today", () => {
  since();
  expect(screen.getByText("The whole system is projected to pay back in 2028.")).toBeTruthy();
  expect(screen.queryByText(/dashed box/)).toBeNull();
  expect(screen.getByText("dotted line: solar paid back, March 2025")).toBeTruthy();
});

test("a whole-system year reached this year is drawn up to today, not dropped for running past it", () => {
  areas.length = 0;
  since({ payback: { ...PAYBACK, system: { year: 2026, projected: false } } });
  expect(areas.at(-1)).toMatchObject({ x1: Date.UTC(2026, 0, 1), ifOverflow: "hidden" });
});

test("a projected whole-system year draws no box", () => {
  areas.length = 0;
  since();
  expect(areas).toEqual([]);
});

// home-story, "Since 2021 explains the true-up": this year's figures, as True-Up explains them.
test("a matched 100% rests on the early years, and this year's sentence says what it left with PG&E", () => {
  since();
  expect(screen.getByText(/^That 100% rests on/).textContent).toBe(
    "That 100% rests on the early years, when solar covered more than the house used. This true-up year solar has covered 73% of the house's use so far, so the house has drawn 609.3 kWh more from PG&E than it sent.",
  );
  expect(screen.queryByText(/midday/)).toBeNull();
});

test("not yet matched, this year's sentence stands alone", () => {
  since({ matched: 96 });
  expect(screen.queryByText(/rests on the early years/)).toBeNull();
  expect(screen.getByText(/^This true-up year solar has covered 73%/)).toBeTruthy();
});

// home-story, "Since 2021's dollar estimate".
test("True-Up's estimate leads the figures, with its true-up month", () => {
  since({ owed: [610, 654] });
  expect(screen.getByText("$610 to $654")).toBeTruthy();
  expect(screen.getByText("on track to owe at the October 2027 true-up")).toBeTruthy();
});

test("one projected amount reads alone", () => {
  since({ owed: [610, 610] });
  expect(screen.getByText("$610")).toBeTruthy();
});

test("without this year's share there is no explanation", () => {
  since({ share: null });
  expect(screen.queryByText(/rests on the early years|This true-up year/)).toBeNull();
});

test("the axis reads in MWh once its top tick passes 1,000 kWh, the unit on the top tick", () => {
  const { container } = since();
  const labels = [...container.querySelectorAll("svg.recharts-surface text")].map((text) => text.textContent).filter((text) => /^[\d,.]+( [kM]Wh)?$/.test(text!) && !/^20\d\d$/.test(text!));
  expect(labels).toEqual(["0", "1", "2", "3 MWh"]);
});

test("the solar figure keeps its unit on its line", () => {
  since();
  expect(screen.getByText("75.6 MWh").className).toContain("whitespace-nowrap");
});
