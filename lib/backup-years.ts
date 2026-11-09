import type { Preset, Range } from "@/lib/solar/ranges";

// The Backup section's years: true-up years, October 1 to September 30, from the site's first, '21 - '22. In the address
// a year is "24-25" and every year is "all".
const FIRST = 2021;
const yy = (year: number) => String(year % 100).padStart(2, "0");
const yearRange = (startYear: number): Range => ({ start: `${startYear}-10-01`, end: `${startYear + 1}-09-30` });
const currentStart = (today: string) => Number(today.slice(0, 4)) - (today.slice(5) >= "10-01" ? 0 : 1);
const allTime = (today: string): Range => ({ start: `${FIRST}-10-01`, end: yearRange(currentStart(today)).end });

export function backupYear(value: unknown, today: string): Range {
  if (value === "all") return allTime(today);
  const match = typeof value === "string" ? /^(\d\d)-(\d\d)$/.exec(value) : null;
  const startYear = match ? 2000 + Number(match[1]) : NaN;
  const valid = match && Number(match[2]) === (startYear + 1) % 100 && startYear >= FIRST && startYear <= currentStart(today);
  return yearRange(valid ? startYear : currentStart(today));
}

// Null for this year, the default, so it stays out of the address.
export function backupParam(range: Range, today: string) {
  if (range.start === `${FIRST}-10-01` && range.end === allTime(today).end) return "all";
  return range.start === yearRange(currentStart(today)).start ? null : `${range.start.slice(2, 4)}-${range.end.slice(2, 4)}`;
}

// As the True-Up Tracker's picker: this year and the two before as buttons, older ones in Earlier, All time last.
export function backupPresets(today: string) {
  const years: Preset[] = [];
  for (let start = currentStart(today); start >= FIRST; start--) years.push({ label: `'${yy(start)} - '${yy(start + 1)}`, range: yearRange(start) });
  const [current, ...past] = years;
  return {
    presets: [{ ...current, label: "This year" }, ...past.slice(0, 2), { label: "All time", range: allTime(today) }],
    earlier: past.slice(2),
  };
}
