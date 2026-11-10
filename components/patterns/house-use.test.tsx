// @vitest-environment jsdom
// The When the house uses power section (patterns-page spec, mockup D).
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";

import { HouseUseSection } from "@/components/patterns/house-use";

afterEach(cleanup);

const HOURS = [
  { month: "2025-09", hour: 1, watts: 1781 },
  { month: "2025-09", hour: 13, watts: 3731 },
  { month: "2026-09", hour: 1, watts: 6153 },
  { month: "2026-09", hour: 13, watts: 1852 },
];
const section = () => within(screen.getByRole("region", { name: "When the house uses power" }));
const grid = (name: string) => within(section().getByRole("table", { name }));
// A month's row: its 24 hour cells, after the row header.
const cells = (name: string, month: string) =>
  within(grid(name).getByRole("rowheader", { name: month }).closest("tr")!).getAllByRole("cell");
const step = (cell: HTMLElement) => cell.querySelector("[data-part=square]")!.className.match(/bg-use-\d/)?.[0] ?? null;

test("two grids of 12 months by 24 hours, months as row headers and hours as column headers", () => {
  render(<HouseUseSection hours={HOURS} today="2026-11-10" />);
  for (const [name, first, last] of [["The last 12 months", "December 2025", "November 2026"], ["The 12 months before", "December 2024", "November 2025"]]) {
    const months = grid(name).getAllByRole("rowheader");
    expect(months).toHaveLength(12);
    expect([months[0].textContent, months[11].textContent]).toEqual([expect.stringContaining(first), expect.stringContaining(last)]);
    const hours = grid(name).getAllByRole("columnheader").map((header) => header.textContent);
    expect(hours).toHaveLength(24);
    expect([hours[0], hours[6], hours[12], hours[18]]).toEqual([
      expect.stringContaining("12 AM"), expect.stringContaining("6 AM"), expect.stringContaining("12 PM"), expect.stringContaining("6 PM"),
    ]);
  }
});

test("each square takes the step of its watts and tells its value to a screen reader", () => {
  render(<HouseUseSection hours={HOURS} today="2026-11-10" />);
  const september = cells("The last 12 months", "September 2026");
  expect([step(september[1]), september[1].textContent]).toEqual(["bg-use-7", "6.2 kW"]);
  expect([step(september[13]), september[13].textContent]).toEqual(["bg-use-3", "1.9 kW"]);
  const before = cells("The 12 months before", "September 2025");
  expect([step(before[13]), step(before[1])]).toEqual(["bg-use-7", "bg-use-3"]);
});

test("an hour without readings is an empty square, unlike any step", () => {
  render(<HouseUseSection hours={HOURS} today="2026-11-10" />);
  const october = cells("The last 12 months", "October 2026")[0];
  expect([step(october), october.textContent]).toEqual([null, "no readings"]);
});

test("the key shows the seven steps, palest to deepest", () => {
  render(<HouseUseSection hours={HOURS} today="2026-11-10" />);
  const key = document.querySelector("[data-part=key]")!;
  expect([...key.querySelectorAll("[data-part=step]")].map((swatch) => [swatch.textContent, swatch.querySelector("span")!.className.match(/bg-use-\d/)![0]])).toEqual([
    ["0.5", "bg-use-1"], ["1", "bg-use-2"], ["1.5", "bg-use-3"], ["2", "bg-use-4"], ["2.5", "bg-use-5"], ["3", "bg-use-6"], ["3.5+", "bg-use-7"],
  ]);
});

test("with no readings the section says so", () => {
  render(<HouseUseSection hours={[]} today="2026-11-10" />);
  expect(section().getByText("No readings yet")).toBeTruthy();
  expect(section().queryByRole("table")).toBeNull();
});
