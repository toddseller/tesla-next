// @vitest-environment jsdom
// The home page's Habits chapter (home-story spec: Habits, Habits' figures).
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { latestFigures } from "@/lib/patterns";
import { Habits } from "./habits";

const TODAY = "2026-11-21";
const Y2025 = [592, 612, 700, 804, 804, 816, 696, 672, 580, 620, 643, 609];
const Y2026 = [532, 565, 648, 612, 816, 804, 840, 828, 840, 852, 864];
const MONTHS = [
  ...Y2025.map((watts, i) => ({ month: `2025-${String(i + 1).padStart(2, "0")}`, watts })),
  ...Y2026.map((watts, i) => ({ month: `2026-${String(i + 1).padStart(2, "0")}`, watts })),
];
const habits = (months = MONTHS) => render(<Habits today={TODAY} months={months} figures={latestFigures(months, TODAY)} powerwallOut={4417} />);
const figure = (label: string) => screen.getByText(label).parentElement!.querySelector("b")!.textContent;

afterEach(cleanup);

test("since when the always-on load has run above last year, with Patterns' figures and labels", () => {
  habits();
  expect(screen.getByRole("heading", { name: "Habits" })).toBeTruthy();
  expect(screen.getByText(/Since July it has run above last year\./)).toBeTruthy();
  expect(figure("November so far")).toBe("864 W");
  expect(figure("November 2025")).toBe("643 W");
  expect(figure("a day more than a year ago")).toBe("+5 kWh");
  expect(figure("out of the Powerwalls in 2026")).toBe("4,417 kWh");
  expect(screen.getByRole("link", { name: "The patterns behind it" }).getAttribute("href")).toBe("/patterns");
});

test("without three months in a row, how the latest month compares; without a year earlier, the latest month alone", () => {
  const months = MONTHS.map((m) => (m.month === "2026-09" ? { ...m, watts: 500 } : m));
  habits(months);
  expect(screen.getByText(/November so far ran 221 W above November 2025\./)).toBeTruthy();
  cleanup();
  habits(MONTHS.filter((m) => m.month.startsWith("2026")));
  expect(figure("November so far")).toBe("864 W");
  expect(screen.queryByText("November 2025")).toBeNull();
  expect(screen.queryByText(/above|below/)).toBeNull();
});

test("a month that matches last year's reads as the same, not 0 W below", () => {
  habits(MONTHS.map((m) => (m.month === "2026-11" ? { ...m, watts: 643 } : m.month === "2026-10" ? { ...m, watts: 500 } : m)));
  expect(screen.getByText(/November so far ran the same as November 2025\./)).toBeTruthy();
});
