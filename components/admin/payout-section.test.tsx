// @vitest-environment jsdom
// The admin-page spec's VPP payout section.
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({ savePayout: vi.fn() }));
vi.mock("@/app/admin/actions", () => mocks);

const { PayoutSection } = await import("./payout-section");

beforeEach(() => mocks.savePayout.mockReset());
afterEach(cleanup);

const LATEST = { season: 2025, amount: 728.26, paid_on: "2026-04-15" };

test("it shows the latest recorded payout, and offers each season to today's, the last ended one first", () => {
  render(<PayoutSection seasons={[2024, 2025, 2026]} today="2026-11-14" latest={LATEST} />);
  expect(screen.getByText(/Recorded for the 2025 season/).textContent)
    .toBe("Recorded for the 2025 season: $728.26, paid April 15, 2026. Recording a season again replaces it.");
  const season = screen.getByLabelText("Season") as HTMLSelectElement;
  expect([...season.options].map((option) => option.value)).toEqual(["2026", "2025", "2024"]);
  expect(season.value).toBe("2026");
});

test("before any payout it says none is recorded", () => {
  render(<PayoutSection seasons={[2024]} today="2025-01-10" latest={null} />);
  expect(screen.getByText("No payout recorded yet.")).toBeTruthy();
});

test("a refusal shows its reason and keeps what was typed", async () => {
  mocks.savePayout.mockResolvedValue({
    ok: false, message: "Stored nothing: the 2026 season hadn't ended by September 1, 2026.",
    values: { season: "2026", amount: "512.40", paid_on: "2026-09-01" },
  });
  render(<PayoutSection seasons={[2024, 2025, 2026]} today="2026-11-14" latest={LATEST} />);
  fireEvent.change(screen.getByLabelText("Amount ($)"), { target: { value: "512.40" } });

  act(() => fireEvent.click(screen.getByRole("button", { name: "Record payout" })));

  expect((await screen.findByRole("alert")).textContent).toBe("Stored nothing: the 2026 season hadn't ended by September 1, 2026.");
  expect((mocks.savePayout.mock.calls[0][1] as FormData).get("amount")).toBe("512.40");
  expect((screen.getByLabelText("Amount ($)") as HTMLInputElement).value).toBe("512.40");
  expect((screen.getByLabelText("Season") as HTMLSelectElement).value).toBe("2026");
  expect(screen.getByRole("button", { name: /Paid on/ }).textContent).toBe("Tuesday, September 1, 2026");
});

test("a recorded payout says so", async () => {
  mocks.savePayout.mockResolvedValue({ ok: true, message: "Recorded the 2025 season: $728.26, paid April 15, 2026." });
  render(<PayoutSection seasons={[2024, 2025, 2026]} today="2026-11-14" latest={null} />);

  act(() => fireEvent.click(screen.getByRole("button", { name: "Record payout" })));

  expect((await screen.findByRole("status")).textContent).toBe("Recorded the 2025 season: $728.26, paid April 15, 2026.");
});
