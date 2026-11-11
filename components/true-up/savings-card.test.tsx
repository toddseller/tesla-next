// @vitest-environment jsdom
// The savings card, from the true-up-tracker spec.
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { COST_25_26, CURRENT_SAVINGS, SAVINGS_25_26 } from "@/components/true-up/fixtures";
import { SavingsCard } from "@/components/true-up/savings-card";

// These tests read what the figures say; the count-up's own tests turn reduced motion off.
const reduced = () => vi.stubGlobal("matchMedia", (query: string) => ({ matches: query.includes("reduce") }));
beforeEach(reduced);
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const parts = () => [...screen.getByRole("img").children].map((part) => [part.className, (part as HTMLElement).style.flexGrow]);

test("'25 - '26: the saving of the no-system bill, the key, and the Powerwalls beside their VPP credit", () => {
  render(<SavingsCard savings={SAVINGS_25_26} season={COST_25_26.vpp} current={false} />);

  const card = screen.getByRole("region", { name: "What the system saved" }).textContent;
  for (const text of ["$5,577", "estimate, of $6,695 without solar or Powerwalls", "Paid", "$1,118", "PG&E $825 · WestLight $293", "Solar saved", "$5,727",
    "$151 cost on the bill", "$368 VPP credit", "Under NEM2, exporting solar earns about what importing it later costs",
    "205 days before April 27, 2026 rebuilt from PG&E's meter, 1 as Tesla read it."])
    expect(card).toContain(text);
  expect(screen.getByRole("img").getAttribute("aria-label")).toBe("Of $6,695: $1,118 paid, $5,577 saved");
  expect(parts()).toEqual([["bg-grid", "1118.07"], ["bg-solar", "5576.6"]]);
});

test("'25 - '26: the Powerwalls' row splits their cost, and the what-if sits in its own panel", () => {
  render(<SavingsCard savings={SAVINGS_25_26} season={COST_25_26.vpp} current={false} />);

  const row = screen.getByRole("group", { name: "Powerwalls" }).textContent;
  for (const text of ["$151 cost on the bill", "$368 VPP credit, an estimate for the 2026 season.", "Keeping charge, 129 days", "$83 cost", "Storing solar, 232 days", "$110 cost", "VPP events, 6 days", "$43 saved"])
    expect(row).toContain(text);
  const whatIf = screen.getByRole("group", { name: "What if (simulation)" }).textContent;
  expect(whatIf).toContain("About $133 less");
  expect(whatIf).toContain("Covering only 4 to 9 p.m. on those 232 days.");
  expect(whatIf).toContain("Under NEM2, exporting solar earns about what importing it later costs");
});

test("without used days there is no what-if, and the NEM2 sentence stays under the bill", () => {
  const heldOnly = { ...CURRENT_SAVINGS, held_days: 35, used_days: 0, powerwalls_held: -23.95, powerwalls_used: 0, peak_only: null };

  render(<SavingsCard savings={heldOnly} season={null} current />);

  expect(screen.queryByRole("group", { name: "What if (simulation)" })).toBeNull();
  expect(screen.getByRole("group", { name: "Powerwalls" }).textContent).toContain("Under NEM2,");
});

test("a year the Powerwalls saved money splits the bar three ways in the flows' colors", () => {
  const year = { ...SAVINGS_25_26, actual: { pge: 700, westlight: 205.1, total: 905.1 }, solar_only: { pge: 900, westlight: 220.75, total: 1120.75 },
    no_system: { pge: 2800, westlight: 610.2, total: 3410.2 }, solar_saved: 2289.45, powerwalls_added: 215.65 };

  render(<SavingsCard savings={year} season={null} current={false} />);

  expect(parts()).toEqual([["bg-grid", "905.1"], ["bg-powerwall", "215.65"], ["bg-solar", "2289.45"]]);
  expect(screen.getByRole("region", { name: "What the system saved" }).textContent).toContain("$216 saved on the bill");
});

test("the current year reads so far", () => {
  render(<SavingsCard savings={CURRENT_SAVINGS} season={null} current />);

  expect(screen.getByRole("region", { name: "What the system saved" }).textContent).toContain("$411estimate so far, of $545");
});

// site-motion: the split bar uncovers as one piece.
test("the savings bar uncovers from the left as one piece", () => {
  render(<SavingsCard savings={SAVINGS_25_26} season={COST_25_26.vpp} current={false} />);
  expect(screen.getByRole("img").classList.contains("motion-uncover")).toBe(true);
  expect(screen.getByRole("img").querySelector(".motion-uncover")).toBeNull();
});

// site-motion, "True-Up's figures count up when first seen".
test("the card's figures count up from zero when the page is first seen", () => {
  vi.unstubAllGlobals();
  render(<SavingsCard savings={SAVINGS_25_26} season={COST_25_26.vpp} current={false} />);
  const finals = [...document.querySelectorAll("[data-part=final]")].map((figure) => figure.textContent);
  expect(finals.length).toBeGreaterThanOrEqual(4);
  for (const counting of document.querySelectorAll("[data-part=counting]")) expect(counting.textContent).toMatch(/0/);
});
