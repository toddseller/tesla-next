// @vitest-environment jsdom
// meter-correction: Patterns reaches back to 2021, so it always offers the readings.
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

import { PATTERNS } from "@/components/patterns/fixtures";
import { PatternsPage } from "@/components/patterns/patterns-page";

const router = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));

afterEach(cleanup);

test("the readings sit beside the title, with the note, and picking one replaces the address", () => {
  render(<PatternsPage patterns={PATTERNS} today="2026-11-10" readings="corrected" />);
  expect(screen.getByRole("button", { name: "Corrected" }).getAttribute("aria-pressed")).toBe("true");
  expect(screen.getByText(/use PG&E's meter readings/)).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "As Tesla reported" }));
  expect(router.replace).toHaveBeenLastCalledWith("/patterns?readings=tesla", { scroll: false });
});
