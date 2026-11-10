// @vitest-environment jsdom
// The Powerwall use section (health-page spec, mockup C).
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";

import { HEALTH } from "@/components/health/fixtures";
import { PowerwallSection } from "@/components/health/powerwall-use";

afterEach(cleanup);

const section = () => within(screen.getByRole("region", { name: "Powerwall use" }));

test("this year's cycles, round trip and energy out, with totals since the first year", () => {
  render(<PowerwallSection years={HEALTH.years} today="2026-11-10" />);
  for (const text of ["Cycles in 2026", "109", "511 since 2021", "Round trip in 2026", "86%", "Out of the Powerwalls in 2026", "4,416 kWh", "20,715 kWh since 2021"])
    expect(section().getAllByText(text).length).toBeGreaterThan(0);
  expect(section().getByText(/A cycle is 40.5 kWh out/)).toBeTruthy();
});

test("a row per year with its note, kWh, cycles and round trip", () => {
  render(<PowerwallSection years={HEALTH.years} today="2026-11-10" />);
  const rows = within(section().getByRole("table", { name: "Powerwall use by year" })).getAllByRole("row").slice(1);
  expect(rows).toHaveLength(6);
  const cells = (row: HTMLElement) => [within(row).getByRole("rowheader"), ...within(row).getAllByRole("cell")].map((cell) => cell.textContent);
  expect(cells(rows[0])).toEqual(["2021 from Oct 10", "659 kWh", "16 cycles", "· 80% round trip"]);
  expect(cells(rows[4])).toEqual(["2025", "3,030 kWh", "75 cycles", "· 83% round trip"]);
  expect(cells(rows[5])[0]).toBe("2026 so far");
});

test("a year with nothing into the Powerwalls shows a dash for its round trip", () => {
  render(<PowerwallSection years={[{ year: 2026, out_wh: 0, in_wh: 0, first_day: "2026-01-01" }]} today="2026-11-10" />);
  expect(section().getAllByText(/–/).length).toBeGreaterThan(0);
});

test("with no intervals the section says so", () => {
  render(<PowerwallSection years={[]} today="2026-11-10" />);
  expect(section().getByText("No Powerwall data yet")).toBeTruthy();
  expect(section().queryByRole("table")).toBeNull();
});
