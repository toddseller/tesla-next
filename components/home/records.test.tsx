// @vitest-environment jsdom
// The home page's Records chapter (home-story spec: the records, how each record was beaten).
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import type { TopTen } from "@/lib/top-ten";
import { recordTabs } from "@/lib/home/records";
import { Records } from "./records";

const TODAY = "2026-11-21";
const RANKINGS: TopTen = [
  { solar: [["Jun 13, 2022", 80.9, "2022-06-13"], ["Jun 21, 2025", 80.2, "2025-06-21"], ["Jun 20, 2023", 80.1, "2023-06-20"], ["May 29, 2022", 79.9, "2022-05-29"], ["May 30, 2022", 79.7, "2022-05-30"], ["Jun 17, 2024", 79.5, "2024-06-17"]].map(([date, solar, day]) => ({ date: date as string, solar: solar as number, day: day as string })) },
  { net_grid: [{ date: "May 21, 2025", net_grid: -45.9, day: "2025-05-21" }] },
  { to_grid_months: [{ date: "Apr 2024", net_grid: -479.2, month: "2024-04" }] },
  { outages: [] },
];
const SERIES = {
  solar: [{ at: "2022-05-29", value: 79.9 }, { at: "2022-06-13", value: 80.9 }, { at: "2023-06-20", value: 80.1 }, { at: "2024-06-17", value: 79.5 }, { at: "2025-06-21", value: 80.2 }],
  exportDays: [{ at: "2025-05-21", value: 45.9 }],
  exportMonths: [{ at: "2024-04", value: 479.2 }],
  outages: [],
};
const records = () => render(<Records today={TODAY} tabs={recordTabs(RANKINGS, SERIES)} />);
const panel = () => screen.getByRole("tabpanel");

afterEach(cleanup);

test("four tabs, best solar day chosen: its top five linking to their days, its record and how long it has stood", () => {
  records();
  expect(screen.getAllByRole("tab").map((tab) => [tab.textContent, tab.getAttribute("aria-selected")])).toEqual([
    ["Best solar day", "true"], ["Most sent to PG&E in a day", "false"], ["Most sent to PG&E in a month", "false"], ["Longest outage", "false"],
  ]);
  const rows = within(panel()).getAllByRole("link").filter((link) => link.getAttribute("href")!.startsWith("/solar"));
  expect(rows.map((row) => [row.textContent, row.getAttribute("href")])).toEqual([
    ["1June 13, 202280.9", "/solar?start=2022-06-01&end=2022-06-30&day=2022-06-13"],
    ["2June 21, 202580.2", "/solar?start=2025-06-01&end=2025-06-30&day=2025-06-21"],
    ["3June 20, 202380.1", "/solar?start=2023-06-01&end=2023-06-30&day=2023-06-20"],
    ["4May 29, 202279.9", "/solar?start=2022-05-01&end=2022-05-31&day=2022-05-29"],
    ["5May 30, 202279.7", "/solar?start=2022-05-01&end=2022-05-31&day=2022-05-30"],
  ]);
  expect(within(panel()).getByText("80.9 kWh on June 13, 2022 · set 4 years ago")).toBeTruthy();
  expect(within(panel()).getByText("Three days since have come within 2% of it.")).toBeTruthy();
  expect(screen.getByRole("link", { name: "Every top ten" }).getAttribute("href")).toBe("/top");
});

test("the month tab links its month, and the outage tab with no outages says so", () => {
  records();
  fireEvent.click(screen.getByRole("tab", { name: "Most sent to PG&E in a month" }));
  expect(within(panel()).getByRole("link", { name: /April 2024/ }).getAttribute("href")).toBe("/solar?start=2024-04-01&end=2024-04-30");
  expect(within(panel()).getByText("479.2 kWh in April 2024 · set 2 years ago")).toBeTruthy();
  expect(within(panel()).getByText("No month since has come within 2% of it.")).toBeTruthy();
  fireEvent.click(screen.getByRole("tab", { name: "Longest outage" }));
  expect(screen.getByRole("tab", { name: "Longest outage" }).getAttribute("aria-selected")).toBe("true");
  expect(within(panel()).getByText("The house hasn't been off the grid since October 2021.")).toBeTruthy();
});

test("two top outages on the same day both list, each its own row", () => {
  const errors = vi.spyOn(console, "error").mockImplementation(() => {});
  const outages = [{ date: "", hours: 5.2, day: "2023-01-05" }, { date: "", hours: 1.4, day: "2023-01-05" }];
  render(<Records today={TODAY} tabs={recordTabs([RANKINGS[0], RANKINGS[1], RANKINGS[2], { outages }], { ...SERIES, outages: [{ at: "2023-01-05", value: 5.2 }, { at: "2023-01-05", value: 1.4 }] })} />);
  fireEvent.click(screen.getByRole("tab", { name: "Longest outage" }));
  expect(within(panel()).getAllByRole("link", { name: /January 5, 2023/ })).toHaveLength(2);
  expect(errors.mock.calls.flat().join(" ")).not.toMatch(/same key/);
  errors.mockRestore();
});

test("a tab with no figures yet says so, and only the outage tab talks about the grid", () => {
  render(<Records today={TODAY} tabs={recordTabs([{ solar: [] }, RANKINGS[1], RANKINGS[2], { outages: [] }], { ...SERIES, solar: [] })} />);
  expect(within(panel()).getByText("No days with figures yet.")).toBeTruthy();
  expect(within(panel()).queryByText(/off the grid/)).toBeNull();
});

test("the outage tab reads lengths in days and hours, as Top Ten and the Backup section do", () => {
  const outages = [{ date: "", hours: 52.3, day: "2024-02-04" }, { date: "", hours: 35.4, day: "2024-12-14" }];
  render(<Records today={TODAY} tabs={recordTabs([RANKINGS[0], RANKINGS[1], RANKINGS[2], { outages }], { ...SERIES, outages: [{ at: "2024-02-04", value: 52.3 }, { at: "2024-12-14", value: 35.4 }] })} />);
  fireEvent.click(screen.getByRole("tab", { name: "Longest outage" }));
  expect(within(panel()).getByText("2 d 4 h on February 4, 2024 · set 2 years ago")).toBeTruthy();
  expect(within(panel()).getAllByRole("link").map((row) => row.textContent)).toEqual(["1February 4, 20242 d 4 h", "2December 14, 20241 d 11 h"]);
});
