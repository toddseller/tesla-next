// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { usePathname } from "next/navigation";
import { Footer } from "./footer";

vi.mock("next/navigation", () => ({ usePathname: vi.fn(() => "/") }));

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

test("shows the current year", () => {
  vi.useFakeTimers({ now: new Date("2027-03-01T12:00:00Z") });
  render(<Footer />);
  expect(screen.getByText("© 2027 teslasolar.report")).toBeTruthy();
});

test("uses the year in California, not UTC, on New Year's Eve evening", () => {
  // 7 p.m. on December 31 in California, already January 1 in UTC.
  vi.useFakeTimers({ now: new Date("2027-01-01T03:00:00Z") });
  render(<Footer />);
  expect(screen.getByText("© 2026 teslasolar.report")).toBeTruthy();
});

// A visitor at the end of a long page can go on without scrolling back up to the top bar.
test("links the seven pages by their top bar names", () => {
  render(<Footer />);
  const links = within(screen.getByRole("navigation", { name: "Footer" })).getAllByRole("link");
  expect(links.map((a) => [a.textContent, a.getAttribute("href")])).toEqual([
    ["Home", "/"], ["Solar", "/solar"], ["Impact", "/impact"], ["Distribution", "/distribution"], ["True-Up", "/true-up"], ["Top Ten", "/top"], ["Patterns", "/patterns"],
  ]);
});

test("the current page's link is marked, as in the top bar", () => {
  vi.mocked(usePathname).mockReturnValue("/impact");
  render(<Footer />);
  const current = within(screen.getByRole("navigation", { name: "Footer" })).getAllByRole("link").filter((a) => a.getAttribute("aria-current") === "page");
  expect(current.map((a) => a.textContent)).toEqual(["Impact"]);
});
