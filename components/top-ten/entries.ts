import { hoursLength } from "@/lib/backup-figures";
import { pyRound } from "@/lib/intervals/python";
import { address, monthOf } from "@/lib/solar/ranges";
import type { GridDay, GridMonth, OutageDay, SolarDay } from "@/lib/top-ten";
import { kwh } from "@/lib/true-up/text";
import { energy } from "@/lib/units";

// `when` places it on the timeline; `since` is the day it became the record (a month's last day).
export type Flow = "solar" | "grid" | "powerwall";
export const FLOW_DOT: Record<Flow, string> = { solar: "bg-solar", grid: "bg-grid", powerwall: "bg-powerwall" };

export type Entry = { rank: number; figure: number; value: string; unit: "kWh" | "MWh" | ""; date: string; long: string; when: string; since: string; href: string };

const full = (day: string, options: Intl.DateTimeFormatOptions) => new Date(`${day}T00:00:00Z`).toLocaleDateString("en-US", { ...options, timeZone: "UTC" });

// An outage's length reads in days and hours, as the Backup section reads it; the words carry its units.
const day = (date: string, iso: string, figure: number, i: number, unit: Entry["unit"] = "kWh"): Entry => ({
  rank: i + 1, figure, value: unit ? kwh(figure) : hoursLength(figure), unit, date, when: iso, since: iso, href: address(monthOf(iso), iso),
  long: full(iso, { weekday: "long", month: "long", day: "numeric", year: "numeric" }),
});

export const solarEntries = (rows: SolarDay[]) => rows.map((r, i) => day(r.date, r.day, pyRound(r.solar, 1), i));
export const dayEntries = (rows: GridDay[]) => rows.map((r, i) => day(r.date, r.day, -r.net_grid, i));
export const outageEntries = (rows: OutageDay[]) => rows.map((r, i) => day(r.date, r.day, r.hours, i, ""));
// Every month reads in #1's unit, so a ten that crosses 1,000 kWh never mixes kWh and MWh.
export const monthEntries = (rows: GridMonth[]) =>
  rows.map((r, i): Entry => {
    const range = monthOf(`${r.month}-01`);
    const [value, unit] = energy(-r.net_grid, 1, -rows[0].net_grid);
    return {
      rank: i + 1, figure: -r.net_grid, value, unit, date: r.date, long: full(range.start, { month: "long", year: "numeric" }),
      when: `${r.month}-15`, since: range.end, href: address(range),
    };
  });

// None when #1 and #2 read the same. The gap takes its own unit: 2 kWh between two MWh months is "2.0 kWh", not "0.0 MWh".
export const lead = ([first, second]: Entry[]) => (first.value === second.value ? null : (first.unit ? energy(first.figure - second.figure, 1).join(" ") : hoursLength(first.figure - second.figure)));
export const withUnit = (e: Entry) => (e.unit ? `${e.value} ${e.unit}` : e.value);

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
