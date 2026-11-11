// @vitest-environment jsdom
// The Always-on load section (patterns-page spec, mockup C).
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";

import { AlwaysOnSection } from "@/components/patterns/always-on";
import { PATTERNS } from "@/components/patterns/fixtures";

afterEach(cleanup);

const section = () => within(screen.getByRole("region", { name: "Always-on load" }));

test("the latest month, the same month a year earlier and the difference in kWh a day", () => {
  render(<AlwaysOnSection months={PATTERNS.months} today="2026-11-10" />);
  for (const text of ["November so far", "November 2025", "+14 kWh", "a day"]) expect(section().getByText(text)).toBeTruthy();
  // Each figure is also its year's row below.
  for (const text of ["864 W", "276 W"]) expect(section().getAllByText(text)).toHaveLength(2);
});

test("the footnote says a charge or spike that doesn't last the whole night doesn't move the figure", () => {
  render(<AlwaysOnSection months={PATTERNS.months} today="2026-11-10" />);
  expect(section().getByText(/A car charge or spike that doesn.t last the whole night doesn.t move it\./)).toBeTruthy();
});

test("a row for each year's November, oldest first, only the latest in the home color", () => {
  render(<AlwaysOnSection months={PATTERNS.months} today="2026-11-10" />);
  const table = within(section().getByRole("table", { name: "November in each year" }));
  const rows = table.getAllByRole("row");
  expect(rows.map((row) => row.textContent)).toEqual(["2021132 W", "2022384 W", "2023264 W", "2024300 W", "2025276 W", "2026864 W"]);
  expect(rows.map((row) => !!row.querySelector(".bg-home"))).toEqual([false, false, false, false, false, true]);
});

test("the last 12 months, each told with its year-earlier figure, marked only where there is one", () => {
  const months = PATTERNS.months.filter((m) => m.month !== "2025-10");
  render(<AlwaysOnSection months={months} today="2026-11-10" />);
  const items = within(section().getByRole("list", { name: "The last 12 months" })).getAllByRole("listitem");
  expect(items).toHaveLength(12);
  expect(items[0].textContent).toContain("December 2025: 312 W, a year earlier 336 W");
  expect(items[9].textContent).toContain("September 2026: 840 W, a year earlier 264 W");
  expect(items[10].textContent).toContain("October 2026: 852 W, no figure a year earlier");
  expect(items.map((item) => !!item.querySelector("[data-part=year-earlier]"))).toEqual([...Array(10).fill(true), false, true]);
});

test("a month with no counted nights has no bar", () => {
  const months = PATTERNS.months.filter((m) => m.month !== "2026-10");
  render(<AlwaysOnSection months={months} today="2026-11-10" />);
  const october = within(section().getByRole("list", { name: "The last 12 months" })).getAllByRole("listitem")[10];
  expect(october.textContent).toContain("October 2026: no counted nights");
  expect(october.querySelector("[data-part=bar]")).toBeNull();
});

test("without a year-earlier month only the latest figure shows", () => {
  render(<AlwaysOnSection months={[{ month: "2026-11", watts: 864 }]} today="2026-11-10" />);
  expect(section().queryByText("Difference")).toBeNull();
});

test("with no counted nights the section says so", () => {
  render(<AlwaysOnSection months={[]} today="2026-11-10" />);
  expect(section().getByText("No overnight readings yet")).toBeTruthy();
  expect(section().queryByRole("table")).toBeNull();
});

// site-motion, "Charts draw in when the view changes".
test("each year's bar uncovers from the left and each month's column rises, one after another", () => {
  const { container } = render(<AlwaysOnSection months={PATTERNS.months} today="2026-11-10" />);
  const rows = [...container.querySelectorAll<HTMLElement>('[role="table"] [role="row"] span[aria-hidden] > span')];
  expect(rows.length).toBeGreaterThan(1);
  expect(rows.every((bar) => bar.classList.contains("motion-uncover"))).toBe(true);
  expect(rows.map((bar) => bar.style.getPropertyValue("--i"))).toEqual(rows.map((_, i) => String(i)));
  const columns = [...container.querySelectorAll<HTMLElement>('[data-part="bar"]')];
  expect(columns.every((bar) => bar.classList.contains("motion-rise") && bar.classList.contains("origin-bottom"))).toBe(true);
  expect(columns[1].style.getPropertyValue("--i")).toBe("1");
  expect([...container.querySelectorAll('[data-part="year-earlier"]')].every((mark) => mark.classList.contains("motion-pop"))).toBe(true);
});
