import { pyRound } from "@/lib/intervals/python";
import { address, monthOf } from "@/lib/solar/ranges";
import type { GridDay, GridMonth, OutageDay, SolarDay } from "@/lib/top-ten";
import { kwh } from "@/lib/true-up/text";

// `when` places it on the timeline; `since` is the day it became the record (a month's last day).
export type Flow = "solar" | "grid" | "powerwall";
export const FLOW_DOT: Record<Flow, string> = { solar: "bg-solar", grid: "bg-grid", powerwall: "bg-powerwall" };

export type Entry = { rank: number; figure: number; value: string; unit: "kWh" | "h"; date: string; long: string; when: string; since: string; href: string };

const full = (day: string, options: Intl.DateTimeFormatOptions) => new Date(`${day}T00:00:00Z`).toLocaleDateString("en-US", { ...options, timeZone: "UTC" });

const day = (date: string, iso: string, figure: number, i: number, unit: Entry["unit"] = "kWh"): Entry => ({
  rank: i + 1, figure, value: kwh(figure), unit, date, when: iso, since: iso, href: address(monthOf(iso), iso),
  long: full(iso, { weekday: "long", month: "long", day: "numeric", year: "numeric" }),
});

export const solarEntries = (rows: SolarDay[]) => rows.map((r, i) => day(r.date, r.day, pyRound(r.solar, 1), i));
export const dayEntries = (rows: GridDay[]) => rows.map((r, i) => day(r.date, r.day, -r.net_grid, i));
export const outageEntries = (rows: OutageDay[]) => rows.map((r, i) => day(r.date, r.day, r.hours, i, "h"));
export const monthEntries = (rows: GridMonth[]) =>
  rows.map((r, i): Entry => {
    const range = monthOf(`${r.month}-01`);
    return {
      rank: i + 1, figure: -r.net_grid, value: kwh(r.net_grid), unit: "kWh", date: r.date, long: full(range.start, { month: "long", year: "numeric" }),
      when: `${r.month}-15`, since: range.end, href: address(range),
    };
  });

export const lead = ([first, second]: Entry[]) => kwh(first.figure - second.figure);

const plural = (n: number, unit: string) => `${n} ${unit}${n === 1 ? "" : "s"}`;

// Whole months from `since` to `today`, a month counted once its day of the month comes round.
export function held(since: string, today: string) {
  const [y0, m0, d0] = since.split("-").map(Number);
  const [y1, m1, d1] = today.split("-").map(Number);
  const months = (y1 - y0) * 12 + m1 - m0 - (d1 < d0 ? 1 : 0);
  const [years, rest] = [Math.floor(months / 12), months % 12];
  if (months <= 0) return "less than a month";
  return [years && plural(years, "year"), rest && plural(rest, "month")].filter(Boolean).join(", ");
}
