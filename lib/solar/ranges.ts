import { redirect } from "next/navigation";

import { dateError } from "@/lib/request-dates";
import { FIRST_DAY, shiftDay, siteToday } from "@/lib/scene/replay";

export type Range = { start: string; end: string };
type Param = string | string[] | undefined;

// Dates are "yyyy-MM-dd" strings, so plain string comparison orders them correctly.
export const rangeIncludes = (range: Range, date: string) => range.start <= date && date <= range.end;

const monthEnd = (date: string) => {
  const [y, m] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
};

export const monthOf = (date: string): Range => ({ start: `${date.slice(0, 7)}-01`, end: monthEnd(date) });

const day = (year: number, month: number, date: number) => new Date(Date.UTC(year, month, date)).toISOString().slice(0, 10);
const parts = (date: string) => date.split("-").map(Number);
const monthLength = (year: number, month: number) => new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

// anton's next_month: Jan 31 gives Feb 28 (29 in a leap year).
const nextMonth = (date: string) => {
  const [y, m, d] = parts(date);
  const [year, month] = m === 12 ? [y + 1, 0] : [y, m];
  return day(year, month, Math.min(d, monthLength(year, month)));
};

// anton's get_time_range_list: month-long periods when neither end is a month boundary, calendar months otherwise.
export function periods(start: string, end: string): [string, string][] {
  const endsOnBoundary = parts(end)[2] >= 28;
  const list: [string, string][] = [];
  for (let first = start; ; ) {
    const last = parts(first)[2] !== 1 && !endsOnBoundary ? shiftDay(nextMonth(first), -1) : monthEnd(first);
    const next = shiftDay(last, 1);
    if (next > end) return [...list, [first, end]];
    list.push([first, last]);
    first = next;
  }
}

// The true-up year runs October 1 to September 30.
export type Preset = { label: string; range: Range };

export const presets = (today: string): Preset[] => {
  const year = Number(today.slice(0, 4));
  const trueUpStart = today.slice(5) >= "10-01" ? year : year - 1;
  return [
    { label: "This month", range: monthOf(today) },
    { label: "This year", range: { start: `${year}-01-01`, end: `${year}-12-31` } },
    { label: "True-up year", range: { start: `${trueUpStart}-10-01`, end: `${trueUpStart + 1}-09-30` } },
    { label: "All time", range: { start: FIRST_DAY, end: today } },
  ];
};

// Weeks run Sunday to Saturday, as anton's Impact page's did.
export const impactPresets = (today: string): Preset[] => {
  const sunday = shiftDay(today, -new Date(`${today}T00:00:00Z`).getUTCDay());
  return [
    { label: "Today", range: { start: today, end: today } },
    { label: "This week", range: { start: sunday, end: shiftDay(sunday, 6) } },
    ...presets(today),
  ];
};

// The True-Up Tracker's years, from /api/true-up-years (oldest first, the current one last). Its current year turns at the
// October read, not on October 1, so it comes from the list rather than from today.
export function trueUpPresets(years: { start_date: string; end_date: string }[]): Preset[] {
  const current = years.at(-1)!;
  return [
    { label: "True-up year", range: { start: current.start_date, end: current.end_date } },
    { label: "All time", range: { start: years[0].start_date, end: current.end_date } },
  ];
}

const single = (value: Param) => (typeof value === "string" ? value : null);

export function parseRange(params: { start?: Param; end?: Param }, fallback: Range): Range {
  const [start, end] = [single(params.start), single(params.end)];
  const valid = !dateError("start", start) && !dateError("end", end) && start! <= end!;
  return valid ? { start: start!, end: end! } : fallback;
}

export function parseDay(value: Param): string | null {
  const day = single(value);
  return !dateError("day", day) && day! >= FIRST_DAY && day! <= siteToday() ? day : null;
}

const NONE: Range = { start: "", end: "" };

// A shared link must name what it shows, so a range or day the page can't show is dropped from the address, not ignored.
// 307 rather than 308: the dates allowed move with today, so an address refused now may be valid later.
export function dropUnshown(path: string, params: Record<string, Param>, hasDay: boolean) {
  const badRange = (params.start !== undefined || params.end !== undefined) && parseRange(params, NONE) === NONE;
  const badDay = hasDay && params.day !== undefined && !parseDay(params.day);
  if (!badRange && !badDay) return;
  const dropped = [...(badRange ? ["start", "end"] : []), ...(badDay ? ["day"] : [])];
  const kept = Object.entries(params).flatMap(([name, value]) => (dropped.includes(name) || value === undefined ? [] : [value].flat().map((v) => [name, v])));
  const query = new URLSearchParams(kept).toString();
  redirect(query ? `${path}?${query}` : path);
}

export const address = (range: Range, day?: string | null) =>
  `/solar?start=${range.start}&end=${range.end}${day ? `&day=${day}` : ""}`;

// The range switches to periods when the end is more than 31 days after the start.
export const isDaily = (range: Range) => range.end <= shiftDay(range.start, 31);

const part = (date: string, month: "long" | "short") => ({
  month: new Date(`${date}T00:00:00Z`).toLocaleString("en-US", { month, timeZone: "UTC" }),
  day: Number(date.slice(8)),
  year: date.slice(0, 4),
});

// Built by hand rather than with Intl's formatRange, whose spacing differs between Node and browsers, so the server's
// text matches the page's.
export function datesLabel({ start, end }: Range, month: "long" | "short") {
  const [a, b] = [part(start, month), part(end, month)];
  if (start === end) return `${a.month} ${a.day}, ${a.year}`;
  if (a.year !== b.year) return `${a.month} ${a.day}, ${a.year} – ${b.month} ${b.day}, ${b.year}`;
  return `${a.month} ${a.day} – ${a.month === b.month ? "" : `${b.month} `}${b.day}, ${b.year}`;
}

export function rangeLabel(range: Range) {
  const whole = monthOf(range.start);
  if (whole.start === range.start && whole.end === range.end) return `${part(range.start, "long").month} ${range.start.slice(0, 4)}`;
  return datesLabel(range, "short");
}

// The days strip holds the range's days while the day is one of them, and otherwise the day's month up to today.
export function stripRange(range: Range, day: string, today: string): Range {
  if (isDaily(range) && rangeIncludes(range, day)) return range;
  const month = monthOf(day);
  return { start: month.start, end: month.end < today ? month.end : today };
}

const yearBefore = (date: string) => {
  const [y, m, d] = parts(date);
  return day(y - 1, m - 1, Math.min(d, monthLength(y - 1, m - 1)));
};

// Today is only partly over, so a range reaching it compares the days before it on both sides, and one starting today,
// today alone included, has nothing to compare yet. A year before the first day has nothing to compare either.
export function comparedDays(range: Range, today: string): { now: Range; then: Range } | null {
  const end = range.end < today ? range.end : shiftDay(today, -1);
  const then = { start: yearBefore(range.start), end: yearBefore(end) };
  return end < range.start || then.start < FIRST_DAY ? null : { now: { start: range.start, end }, then };
}

const trueUpName = (start: string) => `'${start.slice(2, 4)} - '${String(Number(start.slice(2, 4)) + 1).padStart(2, "0")}`;

// A whole calendar year or true-up year by name, as both a title and a sentence call it.
const yearName = ({ start, end }: Range) =>
  start.endsWith("-01-01") && end === `${start.slice(0, 4)}-12-31` ? start.slice(0, 4)
  : start.endsWith("-10-01") && end === `${Number(start.slice(0, 4)) + 1}-09-30` ? trueUpName(start)
  : null;

const isWeek = ({ start, end }: Range) => end === shiftDay(start, 6) && new Date(`${start}T00:00:00Z`).getUTCDay() === 0;

// The range's shape, not the preset last picked, sets the step, so a shared address steps as the page it came from did.
export function step(range: Range, by: 1 | -1): { name: string; range: Range } | null {
  const { start, end } = range;
  if (start === end) return { name: "day", range: { start: shiftDay(start, by), end: shiftDay(start, by) } };
  if (isWeek(range)) return { name: "week", range: { start: shiftDay(start, 7 * by), end: shiftDay(end, 7 * by) } };
  const month = monthOf(start);
  if (month.start === start && month.end === end) return { name: "month", range: monthOf(by > 0 ? shiftDay(end, 1) : shiftDay(start, -1)) };
  if (!yearName(range)) return null;
  const shift = (date: string) => `${Number(date.slice(0, 4)) + by}${date.slice(4)}`;
  return { name: start.endsWith("-01-01") ? "year" : "true-up year", range: { start: shift(start), end: shift(end) } };
}

// How a page's title names its range: a whole year by name, or else as the range buttons show it.
export const rangeTitle = (range: Range) => yearName(range) ?? rangeLabel(range);

// How a lead sentence names the range, and the year-earlier days by name when they're a finished whole period.
export function rangeNames(range: Range, today: string): { name: string; earlier: string | null } {
  const { start, end } = range;
  const soFar = rangeIncludes(range, today);
  const named = (name: string, earlier: string) => (soFar ? { name: `in ${name} so far`, earlier: null } : { name: `in ${name}`, earlier });
  const month = monthOf(start);
  if (month.start === start && month.end === end)
    return soFar ? { name: `in ${part(start, "long").month} so far`, earlier: null } : named(rangeLabel(range), `${part(start, "long").month} ${Number(start.slice(0, 4)) - 1}`);
  const year = yearName(range);
  if (year) return named(year, yearName({ start: yearBefore(start), end: yearBefore(end) })!);
  if (start === end)
    return { name: start === today ? "today so far" : start === shiftDay(today, -1) ? "yesterday" : `on ${datesLabel(range, "short")}`, earlier: null };
  if (soFar && isWeek(range)) return { name: "this week so far", earlier: null };
  if (soFar) return { name: `since ${datesLabel({ start, end: start }, "short")}`, earlier: null };
  return { name: `from ${datesLabel(range, "short").replace(" – ", " to ")}`, earlier: null };
}
