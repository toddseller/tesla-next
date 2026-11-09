// @vitest-environment jsdom
// The savings card, from the true-up-tracker spec.
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";

import { COST_25_26, CURRENT_SAVINGS, SAVINGS_25_26 } from "@/components/true-up/fixtures";
import { SavingsCard } from "@/components/true-up/savings-card";

afterEach(cleanup);

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
