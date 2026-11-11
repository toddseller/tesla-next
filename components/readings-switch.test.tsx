// @vitest-environment jsdom
// meter-correction, "A choice of readings on each affected page" and "Saying which readings are shown".
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { ReadingsNote, ReadingsSwitch } from "./readings-switch";

const router = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));

afterEach(() => {
  cleanup();
  router.replace.mockReset();
});

const addresses = { corrected: "/impact?start=2025-10-01&end=2025-10-31", tesla: "/impact?start=2025-10-01&end=2025-10-31&readings=tesla" };
const button = (name: string) => screen.getByRole("button", { name });

test("Corrected is chosen unless the page shows Tesla's figures", () => {
  render(<ReadingsSwitch readings="corrected" addresses={addresses} />);
  expect(screen.getByRole("group", { name: "Readings" })).toBeTruthy();
  expect([button("Corrected"), button("As Tesla reported")].map((b) => b.getAttribute("aria-pressed"))).toEqual(["true", "false"]);
});

test("picking the other view replaces the address with it", () => {
  const { rerender } = render(<ReadingsSwitch readings="corrected" addresses={addresses} />);
  fireEvent.click(button("As Tesla reported"));
  expect(router.replace).toHaveBeenLastCalledWith("/impact?start=2025-10-01&end=2025-10-31&readings=tesla", { scroll: false });
  rerender(<ReadingsSwitch readings="tesla" addresses={addresses} />);
  fireEvent.click(button("Corrected"));
  expect(router.replace).toHaveBeenLastCalledWith("/impact?start=2025-10-01&end=2025-10-31", { scroll: false });
});

test("picking the view already shown does nothing", () => {
  render(<ReadingsSwitch readings="corrected" addresses={addresses} />);
  fireEvent.click(button("Corrected"));
  expect(router.replace).not.toHaveBeenCalled();
});

test("the note says which readings the figures use", () => {
  const { rerender, container } = render(<ReadingsNote readings="corrected" />);
  expect(container.textContent).toBe(
    "Grid figures from October 6, 2023 to April 26, 2026 use PG&E's meter readings: Tesla read about half of them until a service visit on April 27, 2026. Earlier dates are as Tesla reported them.",
  );
  rerender(<ReadingsNote readings="tesla" />);
  expect(container.textContent).toBe("Grid figures are as Tesla reported them. Until April 27, 2026, Tesla read about half of what PG&E's meter recorded.");
});
