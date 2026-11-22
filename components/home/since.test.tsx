// @vitest-environment jsdom
// The home page's Since 2021 chapter (home-story spec: Since 2021, its figures, the true-up explained, the Powerwalls' payback in words).
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { Since } from "./since";

const TODAY = "2026-11-21";
const MONTHS = [{ month: "2021-10", solar: 400, house: 300 }, { month: "2021-11", solar: 900, house: 1100 }, { month: "2026-11", solar: 600, house: 700 }];
const PAYBACK = {
  solar: { year: 2025, projected: false, estimated: true, month: "2025-03" },
  system: { year: 2028, projected: true, estimated: true },
  powerwalls: { year: null, wont: true },
};
const since = (over: Partial<Parameters<typeof Since>[0]> = {}) =>
  render(<Since today={TODAY} months={MONTHS} solar={75611.4} matched={100} net={609.3} trueUpStart="2026-10-01" payback={PAYBACK} {...over} />);

afterEach(cleanup);

test("the running totals, named, with today and the payback marked, and the figures in words", () => {
  since();
  expect(screen.getByRole("heading", { name: "Since 2021" })).toBeTruthy();
  expect(screen.getByRole("img", { name: /^Running totals since October 2021: solar 1,900 kWh against the house's 2,100 kWh/ })).toBeTruthy();
  expect(screen.getByText("solar made")).toBeTruthy();
  expect(document.body.textContent).toContain("Solar has made as much as the house used: 75,611 kWh, 100%.");
  expect(screen.getByText(/midday, when the surplus goes to PG&E; at night the house draws from the grid/)).toBeTruthy();
  expect(screen.getByText("more imported than sent this true-up year, since October 1")).toBeTruthy();
  expect(screen.getByText("dashed box: the whole system pays back in 2028, projected")).toBeTruthy();
  expect(screen.getByText(/Solar paid for itself in March 2025\. The Powerwalls won't pay for themselves within their warranty\./)).toBeTruthy();
  expect(screen.getByRole("link", { name: "The true-up and payback" }).getAttribute("href")).toBe("/true-up");
  expect(document.body.textContent).not.toMatch(/\$/);
});

test("without the costs file there is no payback, and a year that sent more says so", () => {
  since({ payback: null, net: -120.5, matched: 92 });
  expect(screen.queryByText(/paid for itself|pays back/)).toBeNull();
  expect(screen.getByText("more sent than imported this true-up year, since October 1")).toBeTruthy();
  expect(document.body.textContent).toContain("Solar has made 75,611 kWh, 92% of what the house used.");
});

test("a whole-system year already reached reads as paid back, not projected", () => {
  since({ payback: { ...PAYBACK, system: { year: 2026, projected: false } } });
  expect(screen.getByText("shaded box: the whole system paid back in 2026")).toBeTruthy();
});

test("a true-up year with nothing net reads as even, not as sent", () => {
  since({ net: 0.02 });
  expect(screen.getByText("as much sent as imported this true-up year, since October 1")).toBeTruthy();
});

test("the legend says the house's line includes the car", () => {
  since();
  expect(screen.getByText("house used, car included")).toBeTruthy();
});
