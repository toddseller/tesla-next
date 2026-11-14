// @vitest-environment jsdom
// The admin-page spec's bill figures section.
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import type { StoredCycle } from "@/lib/admin/statement";
import { fixture, table } from "@/test/statement";

const mocks = vi.hoisted(() => ({ saveBill: vi.fn(), push: vi.fn() }));
vi.mock("@/app/admin/actions", () => ({ saveBill: mocks.saveBill }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push }) }));

const { BillSection } = await import("./bill-section");

const YEARS = [{ year: 2027, label: "'26 - '27" }, { year: 2026, label: "'25 - '26" }];
const [ROWS_2026, TOTAL_2026] = table(fixture(2026));
const STORED_2026: StoredCycle[] = ROWS_2026.map((row) => {
  const [month, day, year] = row.end_date.split("/");
  return {
    end_read: `${year}-${month}-${day}`, net_peak_kwh: Number(row.peak_kwh), net_off_peak_kwh: Number(row.off_peak_kwh),
    net_kwh: Number(row.net_kwh), nem_charges: Number(row.nem_charges), minimum_delivery: Number(row.minimum_delivery),
  };
});

beforeEach(() => {
  mocks.saveBill.mockReset();
  mocks.push.mockReset();
});
afterEach(cleanup);

const FIGURES_TYPED = [["end date", "end_date"], ["peak kWh", "peak_kwh"], ["off-peak kWh", "off_peak_kwh"], ["net kWh", "net_kwh"],
  ["NEM charges", "nem_charges"], ["minimum delivery", "minimum_delivery"]] as const;
const input = (name: string) => screen.getByLabelText(name) as HTMLInputElement;
const type = (name: string, value: string) => fireEvent.change(input(name), { target: { value } });

test("a year without cycles says so, and the picker starts at it", () => {
  render(<BillSection years={YEARS} year={2027} cycles={[]} amountDue={null} />);
  expect(screen.getByText(/No cycles stored for '26 - '27 yet/)).toBeTruthy();
  expect(screen.getByText("No true-up statement yet")).toBeTruthy();
  expect((screen.getByLabelText("True-up year") as HTMLSelectElement).value).toBe("2027");
});

test("a stored year lists its cycles by read, with PG&E's figures, and its amount due", () => {
  render(<BillSection years={YEARS} year={2026} cycles={STORED_2026} amountDue={767.73} />);
  const list = within(screen.getByRole("list", { name: "Stored cycles" }));
  const items = list.getAllByRole("listitem").map((item) => item.textContent);
  expect(items).toHaveLength(12);
  expect(items[0]).toBe("Nov 4, 2025Peak 64Off-peak 300Net 364$113.41");
  expect(items[7]).toBe("Jun 5, 2026Peak -104Off-peak -293Net -397−$101.36");
  expect(screen.getByText("True-up statement stored: $767.73 due")).toBeTruthy();
});

test("picking a year goes to its address", () => {
  render(<BillSection years={YEARS} year={2027} cycles={[]} amountDue={null} />);
  fireEvent.change(screen.getByLabelText("True-up year"), { target: { value: "2026" } });
  expect(mocks.push).toHaveBeenCalledWith("/admin?year=2026", { scroll: false });
});

test("a refused table keeps every typed value and marks the row it names", async () => {
  const typed = ROWS_2026.map((row, i) => (i === 0 ? { ...row, peak_kwh: "46" } : row));
  mocks.saveBill.mockResolvedValue({
    ok: false, message: "Stored nothing. 11/04/2025: peak and off-peak sum to 346, not its net of 364.", values: { rows: typed, total: TOTAL_2026 },
  });
  render(<BillSection years={YEARS} year={2026} cycles={[]} amountDue={null} />);
  typed.forEach((row, i) => {
    type(`Cycle ${i + 1} end date`, row.end_date);
    type(`Cycle ${i + 1} peak kWh`, row.peak_kwh);
  });

  fireEvent.click(screen.getByRole("button", { name: "Save bill" }));

  expect((await screen.findByRole("alert")).textContent).toBe("Stored nothing. 11/04/2025: peak and off-peak sum to 346, not its net of 364.");
  const sent = mocks.saveBill.mock.calls[0][1] as FormData;
  expect(sent.getAll("peak_kwh")[0]).toBe("46");
  typed.forEach((row, i) => {
    expect(input(`Cycle ${i + 1} end date`).value).toBe(row.end_date);
    expect(input(`Cycle ${i + 1} NEM charges`).value).toBe(row.nem_charges);
  });
  expect(input("TOTAL NEM charges").value).toBe("827.82");
  for (const name of FIGURES_TYPED.map(([label]) => label)) {
    expect(input(`Cycle 1 ${name}`).getAttribute("aria-invalid")).toBe("true");
    expect(input(`Cycle 2 ${name}`).getAttribute("aria-invalid")).toBeNull();
  }
});

test("a stored table says what it stored and empties the form", async () => {
  mocks.saveBill.mockResolvedValue({ ok: true, message: "Stored 1 cycle of '25 - '26 from PG&E's bill: $113.41 of NEM charges." });
  render(<BillSection years={YEARS} year={2026} cycles={[]} amountDue={null} />);
  type("Cycle 1 end date", "11/04/2025");

  fireEvent.click(screen.getByRole("button", { name: "Save bill" }));

  expect((await screen.findByRole("status")).textContent).toBe("Stored 1 cycle of '25 - '26 from PG&E's bill: $113.41 of NEM charges.");
  expect(input("Cycle 1 end date").value).toBe("");
});

test("loading a stored statement fills the form with its cycles, minimum delivery and their sums, and stores nothing", async () => {
  render(<BillSection years={YEARS} year={2026} cycles={STORED_2026} amountDue={767.73} />);

  fireEvent.click(screen.getByRole("button", { name: "Load into form" }));

  await screen.findByDisplayValue("11/04/2025");
  expect(input("Cycle 1 end date").value).toBe("11/04/2025");
  expect(input("Cycle 1 NEM charges").value).toBe("113.41");
  expect(input("Cycle 1 minimum delivery").value).toBe("12.9");
  expect(input("Cycle 12 end date").value).toBe("10/05/2026");
  expect(input("Cycle 8 net kWh").value).toBe("-397");
  expect([input("TOTAL net kWh").value, input("TOTAL NEM charges").value, input("TOTAL minimum delivery").value]).toEqual(["2437", "827.82", "60.09"]);
  expect(mocks.saveBill).not.toHaveBeenCalled();
});

test("loading a year of monthly bills leaves minimum delivery blank", async () => {
  render(<BillSection years={YEARS} year={2027} cycles={STORED_2026.slice(0, 2)} amountDue={null} />);

  fireEvent.click(screen.getByRole("button", { name: "Load into form" }));

  await screen.findByDisplayValue("12/05/2025");
  expect(input("Cycle 1 minimum delivery").value).toBe("");
  expect(input("TOTAL minimum delivery").value).toBe("");
  expect(input("TOTAL NEM charges").value).toBe("286.33");
  expect(input("Cycle 3 end date").value).toBe("");
});

const sums = () => within(screen.getByRole("list", { name: "Rows add to" })).getAllByRole("listitem").map((item) => item.textContent);

test("the rows' sums show under the TOTAL as they are typed, marked where a save would refuse them", () => {
  render(<BillSection years={YEARS} year={2027} cycles={[]} amountDue={null} />);
  ROWS_2026.forEach((row, i) => FIGURES_TYPED.forEach(([name, figure]) => type(`Cycle ${i + 1} ${name}`, row[figure])));
  FIGURES_TYPED.slice(1).forEach(([name, figure]) => type(`TOTAL ${name}`, TOTAL_2026[figure as keyof typeof TOTAL_2026]));

  expect(sums()).toEqual(["Peak kWh 419", "Off-peak kWh 2020", "Net kWh 2437", "NEM charges ($) 827.82", "Min. delivery ($) 60.09"]);

  // A cent a row is allowed, as a save allows it: 101.51 for 101.41 is within it, a mistyped digit isn't.
  type("Cycle 12 NEM charges", "101.51");
  expect(sums()[3]).toBe("NEM charges ($) 827.92");
  type("Cycle 1 NEM charges", "131.41");
  expect(sums()[3]).toBe("NEM charges ($) 845.92 ≠ total");
  expect(input("TOTAL NEM charges").value).toBe("827.82");
});

test("a monthly bill's blank minimum delivery isn't marked", () => {
  render(<BillSection years={YEARS} year={2027} cycles={[]} amountDue={null} />);
  type("Cycle 1 net kWh", "364");
  type("Cycle 1 NEM charges", "113.41");
  type("TOTAL net kWh", "364");
  type("TOTAL NEM charges", "113.41");
  expect(sums()).toEqual(["Peak kWh 0", "Off-peak kWh 0", "Net kWh 364", "NEM charges ($) 113.41", "Min. delivery ($) 0.00"]);
});
