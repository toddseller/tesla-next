// The live rankings read from teslasolar.report on November 8, 2026, as /api/top-ten answers them.
import type { TopTen } from "@/lib/top-ten";

const days = (list: [string, number][]) =>
  list.map(([day, figure]) => ({ date: new Date(`${day}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }), day, figure }));

export const SOLAR = days([
  ["2022-06-13", 80.9], ["2025-06-21", 80.2], ["2023-06-20", 80.1], ["2022-05-29", 79.9], ["2022-05-30", 79.7],
  ["2024-06-17", 79.5], ["2022-06-14", 78.8], ["2024-06-16", 78.6], ["2022-05-20", 78.6], ["2026-06-28", 78.5],
]).map(({ date, day, figure }) => ({ date, solar: figure, day }));

export const EXPORT_DAYS = days([
  ["2024-05-30", 60.0], ["2024-07-23", 49.6], ["2025-05-21", 45.9], ["2025-05-22", 45.5], ["2026-07-16", 44.7],
  ["2024-07-04", 44.7], ["2024-05-23", 43.9], ["2026-06-06", 43.4], ["2026-07-14", 42.1], ["2024-07-05", 42.1],
]).map(({ date, day, figure }) => ({ date, net_grid: -figure, day }));

export const EXPORT_MONTHS = ([
  ["2024-05", 510.1], ["2024-04", 479.2], ["2026-06", 460.8], ["2025-05", 439.6], ["2024-07", 417.5],
  ["2022-05", 391.2], ["2025-06", 386.3], ["2022-06", 362.6], ["2024-06", 354.7], ["2026-07", 353.2],
] as [string, number][]).map(([month, figure]) => ({
  date: new Date(`${month}-01T00:00:00Z`).toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" }), net_grid: -figure, month,
}));

export const TOP_TEN: TopTen = [{ solar: SOLAR }, { net_grid: EXPORT_DAYS }, { to_grid_months: EXPORT_MONTHS }];

// May 30 and July 23, 2024 are VPP event days.
export const WITHOUT_VPP: TopTen = [{ solar: SOLAR }, { net_grid: EXPORT_DAYS.slice(2) }, { to_grid_months: EXPORT_MONTHS }];
