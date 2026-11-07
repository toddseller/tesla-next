// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { Footer } from "./footer";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

test("shows the current year", () => {
  vi.useFakeTimers({ now: new Date("2027-03-01T12:00:00Z") });
  render(<Footer />);
  expect(screen.getByRole("contentinfo").textContent).toBe("© 2027 teslasolar.report");
});

test("uses the year in California, not UTC, on New Year's Eve evening", () => {
  // 7 p.m. on December 31 in California, already January 1 in UTC.
  vi.useFakeTimers({ now: new Date("2027-01-01T03:00:00Z") });
  render(<Footer />);
  expect(screen.getByRole("contentinfo").textContent).toBe("© 2026 teslasolar.report");
});
