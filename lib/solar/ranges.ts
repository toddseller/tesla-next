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

// The true-up year runs October 1 to September 30.
export const presets = (today: string) => {
  const year = Number(today.slice(0, 4));
  const trueUpStart = today.slice(5) >= "10-01" ? year : year - 1;
  return [
    { label: "This month", range: monthOf(today) },
    { label: "This year", range: { start: `${year}-01-01`, end: `${year}-12-31` } },
    { label: "True-up year", range: { start: `${trueUpStart}-10-01`, end: `${trueUpStart + 1}-09-30` } },
  ];
};

const single = (value: Param) => (typeof value === "string" ? value : null);

export function parseRange(params: { start?: Param; end?: Param }): Range {
  const [start, end] = [single(params.start), single(params.end)];
  const valid = !dateError("start", start) && !dateError("end", end) && start! <= end!;
  return valid ? { start: start!, end: end! } : monthOf(siteToday());
}

export function parseDay(value: Param): string | null {
  const day = single(value);
  return !dateError("day", day) && day! >= FIRST_DAY && day! <= siteToday() ? day : null;
}

export const address = (range: Range, day?: string | null) =>
  `/?start=${range.start}&end=${range.end}${day ? `&day=${day}` : ""}`;

// Flask's /api/v2/formatted switches to periods when the end is more than 31 days after the start.
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
