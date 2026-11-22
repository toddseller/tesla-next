import { shiftDay } from "@/lib/scene/replay";
import type { TopTen } from "@/lib/top-ten";

export type Point = { at: string; value: number };

// The record as it stood over time: each figure that beat every one before it, oldest first.
export function steps(series: Point[]) {
  const rising: Point[] = [];
  for (const point of [...series].sort((a, b) => a.at.localeCompare(b.at))) {
    if (!rising.length || point.value > rising.at(-1)!.value) rising.push(point);
  }
  return rising;
}

// 2% reads the same for kWh and for hours, so every tab's near misses come from one rule.
const NEAR = 0.98;
export const nearMisses = (series: Point[], record: Point) =>
  series.filter((point) => point.at > record.at && point.value >= record.value * NEAR).length;

const DAYS_THEN_MONTHS = 60;
const MONTHS_THEN_YEARS = 24;
const plural = (n: number, unit: string) => `${n} ${unit}${n === 1 ? "" : "s"}`;

// A month's record stood from its last day, as Top Ten counts it.
export function setAgo(at: string, today: string) {
  const day = at.length === 7 ? shiftDay(`${shiftDay(`${at}-28`, 4).slice(0, 7)}-01`, -1) : at;
  const days = Math.round((Date.parse(today) - Date.parse(day)) / 86_400_000);
  if (days === 0) return "set today";
  if (days < DAYS_THEN_MONTHS) return `set ${plural(days, "day")} ago`;
  const [y, m, d] = day.split("-").map(Number);
  const [ty, tm, td] = today.split("-").map(Number);
  const months = (ty - y) * 12 + (tm - m) - (td < d ? 1 : 0);
  return months < MONTHS_THEN_YEARS ? `set ${plural(months, "month")} ago` : `set ${plural(Math.floor(months / 12), "year")} ago`;
}

type Series = { solar: Point[]; exportDays: Point[]; exportMonths: Point[]; outages: Point[] };

// Each tab's top five, staircase and near misses, worked out on the server so the page doesn't ship every day since
// 2021 to draw four small charts.
export function recordTabs([{ solar }, { net_grid }, { to_grid_months }, { outages }]: TopTen, series: Series) {
  // The record is the day that set it, the staircase's last step: Top Ten lists figures that tie to a tenth newest first.
  const tab = (top: Point[], points: Point[]) => {
    const rising = steps(points);
    const record = rising.at(-1);
    return { top: top.slice(0, 5), steps: rising, record, near: record ? nearMisses(points, record) : 0 };
  };
  return [
    tab(solar.map((r) => ({ at: r.day, value: r.solar })), series.solar),
    tab(net_grid.map((r) => ({ at: r.day, value: -r.net_grid })), series.exportDays),
    tab(to_grid_months.map((r) => ({ at: r.month, value: -r.net_grid })), series.exportMonths),
    tab(outages.map((r) => ({ at: r.day, value: r.hours })), series.outages),
  ];
}

// Each January 1 after `from` up to `to`, so a time axis names every year once, at its start.
export function yearTicks(from: number, to: number) {
  const first = new Date(from).getUTCFullYear() + 1;
  return Array.from({ length: Math.max(0, new Date(to).getUTCFullYear() - first + 1) }, (_, i) => Date.UTC(first + i, 0, 1));
}

export const tenthTick = (value: number) => String(Math.round(value * 10) / 10);

// Only figures that mean something: 0, the record, and the lowest figure when a series starts below 0 (a month that
// imported more than it sent). Ticks in between land on odd values whenever the axis starts below 0. The axis runs
// from the first tick to the last, so 0 is always on it.
export function valueTicks(values: number[]) {
  if (!values.length) return [];
  return [...new Set([Math.min(0, ...values), 0, Math.max(0, ...values)])];
}
