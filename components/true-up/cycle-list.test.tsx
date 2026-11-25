// @vitest-environment jsdom
// The true-up-tracker spec's cycle list and metering fault note.
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";

import { CycleList, MeteringNote } from "@/components/true-up/cycle-list";
import { CURRENT, YEAR_25_26 } from "@/components/true-up/fixtures";

afterEach(cleanup);

const items = () => screen.getAllByRole("listitem").map((item) => item.textContent);

test("the current year lists its started cycles, the open one so far, with charges marked est.", () => {
  render(<CycleList cycles={CURRENT} />);
  expect(items()).toEqual([
    "Oct 5 to Nov 2$97.22 est.Imported 576.6Exported 206.7Net 369.8 imported",
    "Nov 3 to Nov 8 (so far)$9.24 est.Imported 83.5Exported 44.7Net 38.8 imported",
  ]);
  expect(screen.getByText(/^est\.: calculated/).textContent).toBe(
    "est.: calculated from PG&E's published rates. Before taxes; the Base Services Charge and WestLight Energy's generation charges are billed separately.",
  );
});

test("a billed year shows PG&E's charges, credits without a minus, and the estimate under each", () => {
  render(<CycleList cycles={YEAR_25_26} />);
  expect(items()[0]).toBe("Oct 3 to Nov 3$113.41est. $113.72 · PG&E net 364 kWhImported 885.7Exported 522.1Net 363.6 imported");
  expect(items()[7]).toBe("May 6 to Jun 4$101.36 creditest. $102.04 credit · PG&E net 397 kWh exportedImported 50.4Exported 449.5Net 399.1 exported");
  expect(screen.getByText(/^Charges are PG&E's/).textContent).toBe(
    "Charges are PG&E's, from its bills, with the estimate for the same cycle under each. Before taxes; the Base Services Charge and WestLight Energy's generation charges are billed separately.",
  );
});

const noCharges = { nem_charges: null, nem_source: null, estimated_nem_charges: null, billed_net_kwh: null };
const years = (container: HTMLElement) => [...container.querySelectorAll("details")];
const summary = (year: HTMLDetailsElement) => year.querySelector("summary")!;

test("All time: a row for each year with its totals and charges, only the last open, the footnote once", () => {
  const { container } = render(<CycleList cycles={[...YEAR_25_26, ...CURRENT]} allTime />);
  expect(years(container).map((y) => summary(y).textContent)).toEqual([
    "2025\u201126$827.82Imported 6,530.7Exported 4,107.7Net 2,422.7 imported",
    "2026\u201127$106.46 est.Imported 660.1Exported 251.4Net 408.6 imported",
  ]);
  expect(years(container).map((y) => y.open)).toEqual([false, true]);
  expect(years(container).map((y) => y.querySelectorAll("li").length)).toEqual([12, 2]);
  expect(screen.getAllByText(/Before taxes/)).toHaveLength(1);
});

// A custom range can cut a year short, so its row's totals must show the cycles they come from.
test("a custom range across true-up years starts with every year open", () => {
  const { container } = render(<CycleList cycles={[...YEAR_25_26.slice(-2), ...CURRENT]} allTime={false} />);
  expect(years(container).map((y) => y.open)).toEqual([true, true]);
});

test("a year with a cycle without charges gives no charges on its row", () => {
  const { container } = render(<CycleList cycles={[{ ...YEAR_25_26[0], ...noCharges }, ...YEAR_25_26.slice(1), ...CURRENT]} />);
  expect(summary(years(container)[0]).textContent).toBe("2025\u201126Imported 6,530.7Exported 4,107.7Net 2,422.7 imported");
});

test("a year's row sets its figures in the cycles' columns", () => {
  const { container } = render(<CycleList cycles={[...YEAR_25_26, ...CURRENT]} />);
  const template = (e: Element) => e.className.split(" ").find((c) => c.startsWith("sm:grid-cols-"));
  expect(template(summary(years(container)[0]))).toBe(template(container.querySelector("li")!));
});

test("one true-up year has no year rows", () => {
  const { container } = render(<CycleList cycles={YEAR_25_26} />);
  expect(years(container)).toEqual([]);
  cleanup();
  const current = render(<CycleList cycles={CURRENT} />);
  expect(years(current.container)).toEqual([]);
});

test("from 640 pixels every row has the same five columns, with or without charges", () => {
  render(<CycleList cycles={[YEAR_25_26[0], { ...YEAR_25_26[1], ...noCharges }]} />);
  const templates = screen.getAllByRole("listitem").map((item) => item.className.split(" ").find((c) => c.startsWith("sm:grid-cols-")));
  expect(templates).toEqual(Array(2).fill("sm:grid-cols-[minmax(0,1.3fr)_repeat(4,minmax(0,1fr))]"));
});

// The charge is what people look for, so on a phone it shares the first line with the dates.
test("below 640 pixels a row is two columns, its charges second and placed last from 640", () => {
  const { container } = render(<CycleList cycles={[YEAR_25_26[0], { ...YEAR_25_26[1], ...noCharges }, ...CURRENT]} />);
  const rows = [...container.querySelectorAll("li, summary")];
  expect(rows.map((row) => row.children.length)).toEqual(Array(rows.length).fill(5));
  for (const row of rows) {
    expect(row.className.split(" ")).toContain("grid-cols-2");
    expect(row.children[1].className.split(" ")).toEqual(expect.arrayContaining(["sm:col-start-5", "sm:row-start-1"]));
  }
  expect(screen.getByText(/^est\. \$113\.72/).className).toContain("text-balance");
});

// Only the dates move, so a year's cycles keep the year row's columns.
test("a year's cycles indent their dates under its name; one year's do not", () => {
  const indented = (e: Element) => e.className.split(" ").includes("pl-5");
  const { container } = render(<CycleList cycles={[...YEAR_25_26, ...CURRENT]} />);
  const cycles = [...container.querySelectorAll("details li")];
  expect(cycles.map((li) => indented(li.children[0]))).toEqual(Array(14).fill(true));
  expect([...container.querySelectorAll("ul")].some(indented)).toBe(false);
  cleanup();
  const one = render(<CycleList cycles={YEAR_25_26} />);
  expect([...one.container.querySelectorAll("li")].some((li) => indented(li.children[0]))).toBe(false);
});

test("nothing is shown in red", () => {
  const { container } = render(<CycleList cycles={YEAR_25_26} />);
  expect(container.innerHTML).not.toMatch(/destructive|text-red|text-primary/);
});

test("cycles without charges have no charges or footnote", () => {
  render(<CycleList cycles={YEAR_25_26.map((c) => ({ ...c, ...noCharges }))} />);
  expect(items()[0]).toBe("Oct 3 to Nov 3Imported 885.7Exported 522.1Net 363.6 imported");
  expect(screen.queryByText(/Before taxes/)).toBeNull();
});

test("the metering note counts the days still on Tesla's readings", () => {
  render(<MeteringNote cycles={YEAR_25_26} />);
  expect(screen.getByRole("note").textContent).toBe(
    "1 day before April 27, 2026 still uses Tesla's grid readings, which read about half of what PG&E's meter recorded because of a Tesla metering fault since corrected.",
  );
  cleanup();
  render(<MeteringNote cycles={YEAR_25_26.map((c) => ({ ...c, uncorrected_days: 3 }))} />);
  expect(screen.getByRole("note").textContent).toMatch(/^36 days before April 27, 2026 still use Tesla's/);
});

test("the current year has no metering note", () => {
  const { container } = render(<MeteringNote cycles={CURRENT} />);
  expect(container.innerHTML).toBe("");
});

// DESIGN.md's Mono Means Measured rule: the figures in mono, the words beside them in sans.
test("a cycle's net and charges set their words in sans", () => {
  const { container } = render(<CycleList cycles={YEAR_25_26} />);
  const words = [...container.querySelectorAll(".font-mono")].map((e) => e.textContent).filter((t) => /[a-z]{2,}/.test(t!));
  expect(words).toEqual([]);
});
