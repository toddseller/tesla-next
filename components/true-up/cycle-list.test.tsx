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
    "Oct 5 to Nov 2Imported 576.6Exported 206.7Net 369.8 imported$97.22 est.",
    "Nov 3 to Nov 8 (so far)Imported 83.5Exported 44.7Net 38.8 imported$9.24 est.",
  ]);
  expect(screen.getByText(/^est\.: calculated/).textContent).toBe(
    "est.: calculated from PG&E's published rates. Before taxes; the Base Services Charge and WestLight Energy's generation charges are billed separately.",
  );
});

test("a billed year shows PG&E's charges, credits without a minus, and the estimate under each", () => {
  render(<CycleList cycles={YEAR_25_26} />);
  expect(items()[0]).toBe("Oct 3 to Nov 3Imported 885.7Exported 522.1Net 363.6 imported$113.41est. $113.72 · PG&E net 364 kWh");
  expect(items()[7]).toBe("May 6 to Jun 4Imported 50.4Exported 449.5Net 399.1 exported$101.36 creditest. $102.04 credit · PG&E net 397 kWh exported");
  expect(screen.getByText(/^Charges are PG&E's/).textContent).toBe(
    "Charges are PG&E's, from its bills, with the estimate for the same cycle under each. Before taxes; the Base Services Charge and WestLight Energy's generation charges are billed separately.",
  );
});

test("nothing is shown in red", () => {
  const { container } = render(<CycleList cycles={YEAR_25_26} />);
  expect(container.innerHTML).not.toMatch(/destructive|text-red|text-primary/);
});

test("cycles without charges have no charges or footnote", () => {
  render(<CycleList cycles={YEAR_25_26.map((c) => ({ ...c, nem_charges: null, nem_source: null, estimated_nem_charges: null, billed_net_kwh: null }))} />);
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
