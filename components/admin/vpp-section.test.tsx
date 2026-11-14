// @vitest-environment jsdom
// The admin-page spec's VPP days section; the picker is shadcn's Calendar in a Popover, driven as the owner would.
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({ markVppDay: vi.fn(), unmarkVppDay: vi.fn() }));
vi.mock("@/app/admin/actions", () => mocks);

const { VppSection } = await import("./vpp-section");

beforeEach(() => {
  mocks.markVppDay.mockReset();
  mocks.unmarkVppDay.mockReset();
});
afterEach(cleanup);

const DAYS = [{ date: "2026-08-12", kwh: 21.4 }, { date: "2026-09-03", kwh: 18.9 }];
const openPicker = () => act(() => fireEvent.click(screen.getByRole("button", { name: /Day to mark/ })));
const dayButton = (name: RegExp) => screen.getByRole("button", { name }) as HTMLButtonElement;

test("a season without marked days says so", () => {
  render(<VppSection season={2026} today="2026-11-14" days={[]} />);
  expect(screen.getByRole("heading", { name: "VPP days, 2026 season" })).toBeTruthy();
  expect(screen.getByText("No days marked in the 2026 season yet.")).toBeTruthy();
});

test("the season's marked days, each with its export and an Unmark", () => {
  render(<VppSection season={2026} today="2026-11-14" days={DAYS} />);
  const items = within(screen.getByRole("list", { name: "Marked days" })).getAllByRole("listitem");
  expect(items.map((item) => item.textContent)).toEqual(["Wednesday, August 12, 202621.4 kWhUnmark", "Thursday, September 3, 202618.9 kWhUnmark"]);
  expect(within(items[1]).getByRole("button", { name: "Unmark Thursday, September 3, 2026" })).toBeTruthy();
});

test("unmarking sends the day", async () => {
  mocks.unmarkVppDay.mockResolvedValue({ ok: true, message: "Unmarked Thursday, September 3, 2026." });
  render(<VppSection season={2026} today="2026-11-14" days={DAYS} />);

  fireEvent.click(screen.getByRole("button", { name: "Unmark Thursday, September 3, 2026" }));

  expect((await screen.findByRole("status")).textContent).toBe("Unmarked Thursday, September 3, 2026.");
  expect((mocks.unmarkVppDay.mock.calls[0][1] as FormData).get("day")).toBe("2026-09-03");
});

test("days after today can't be picked", () => {
  render(<VppSection season={2026} today="2026-09-10" days={DAYS} />);
  openPicker();
  expect(dayButton(/September 10th, 2026/).disabled).toBe(false);
  expect(dayButton(/September 11th, 2026/).disabled).toBe(true);
});

test("days outside the season can't be picked", () => {
  render(<VppSection season={2026} today="2026-11-14" days={DAYS} />);
  openPicker();
  expect(dayButton(/October 31st, 2026/).disabled).toBe(false);
  act(() => fireEvent.click(screen.getByRole("button", { name: /previous month/i })));
  act(() => fireEvent.click(screen.getByRole("button", { name: /previous month/i })));
  act(() => fireEvent.click(screen.getByRole("button", { name: /previous month/i })));
  act(() => fireEvent.click(screen.getByRole("button", { name: /previous month/i })));
  act(() => fireEvent.click(screen.getByRole("button", { name: /previous month/i })));
  expect(dayButton(/May 1st, 2026/).disabled).toBe(false);
  expect(screen.getByRole("button", { name: /previous month/i }).getAttribute("aria-disabled")).toBe("true");
});

test("a picked day is marked", async () => {
  mocks.markVppDay.mockResolvedValue({ ok: true, message: "Marked Friday, September 18, 2026 as a VPP day." });
  render(<VppSection season={2026} today="2026-11-14" days={DAYS} />);
  openPicker();
  act(() => fireEvent.click(screen.getByRole("button", { name: /previous month/i })));
  act(() => fireEvent.click(dayButton(/September 18th, 2026/)));
  expect(screen.getByRole("button", { name: /Day to mark/ }).textContent).toBe("Friday, September 18, 2026");

  fireEvent.click(screen.getByRole("button", { name: "Mark VPP day" }));

  expect((await screen.findByRole("status")).textContent).toBe("Marked Friday, September 18, 2026 as a VPP day.");
  expect((mocks.markVppDay.mock.calls[0][1] as FormData).get("day")).toBe("2026-09-18");
});
