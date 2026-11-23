import type { RangeItem } from "@/lib/range";
import { FIRST_DAY } from "@/lib/scene/replay";
import { monthOf, type Range, rangeNames } from "@/lib/solar/ranges";
import type { TopTen } from "@/lib/top-ten";

// The pages' lead sentences mark their figures {like this}: the figures go in mono, while the dates and year names
// around them, which hold digits too, stay in the sans.
const whole = (value: number) => Math.round(value).toLocaleString("en-US");

export const solarTotal = (items: RangeItem[]) => items.reduce((sum, item) => sum + (item.solar ?? 0), 0);

// before.now is the range's solar through yesterday when today is cut from the comparison, or null when it isn't.
export function solarLead(range: Range, today: string, solar: number, before: { then: number; now: number | null } | null) {
  const { name, earlier } = rangeNames(range, today);
  const first = monthOf(FIRST_DAY);
  const lead = `Solar made {${whole(solar)}} kWh ${name}`;
  if (range.start === first.start && range.end === first.end) return `${lead}, its first month.`;
  if (!before?.then) return `${lead}.`;
  const change = Math.round((100 * ((before.now ?? solar) - before.then)) / before.then);
  const amount = change ? `{${Math.abs(change)}%} ${change > 0 ? "more" : "less"} than` : "about the same as";
  return `${lead}, ${amount} ${earlier ?? "the same days last year"}.`;
}

export function impactLead(range: Range, today: string, share: number, before: number | null) {
  if (before === null) return null;
  const { name, earlier } = rangeNames(range, today);
  if (range.start === range.end) return `{${share}%} self-powered ${name}; this day last year was {${before}%}.`;
  const than = earlier ?? "the same days last year";
  if (share === before) return `{${share}%} self-powered ${name}, about the same as ${than}.`;
  return `{${share}%} self-powered ${name}, ${share > before ? "up" : "down"} from {${before}%} ${earlier ? `in ${earlier}` : `over ${than}`}.`;
}

const NUMBERS = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
const entries = (n: number, more = "") => `${NUMBERS[n] ?? n} ${more}entr${n === 1 ? "y" : "ies"}`;
const count = (n: number, thing: string) => (n === 1 ? `a ${thing}` : `${NUMBERS[n] ?? n} ${thing}s`);
const list = (items: string[]) => (items.length < 2 ? items[0] : `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`);
const longDate = (date: string) =>
  new Date(`${date.length === 7 ? `${date}-01` : date}T00:00:00Z`).toLocaleString("en-US", { month: "long", ...(date.length === 7 ? {} : { day: "numeric" }), year: "numeric", timeZone: "UTC" });

// What the site's year has placed in the rankings as shown, or the newest record while it has placed nothing.
export function topTenLead([{ solar }, { net_grid }, { to_grid_months }, { outages }]: TopTen, today: string) {
  const year = today.slice(0, 4);
  const rankings = [
    { kind: "solar day", record: "the best solar day", dates: solar.map((e) => e.day) },
    { kind: "export day", record: "the best export day", dates: net_grid.map((e) => e.day) },
    { kind: "export month", record: "the best export month", dates: to_grid_months.map((e) => e.month) },
    { kind: "outage", record: "the longest outage", dates: outages.map((e) => e.day) },
  ];
  const records = rankings.filter((r) => r.dates[0]?.startsWith(year)).map((r) => r.record);
  const places = rankings.map((r) => ({ kind: r.kind, n: r.dates.filter((date, i) => i > 0 && date.startsWith(year)).length }));
  const more = places.reduce((sum, p) => sum + p.n, 0);
  if (records.length) {
    const set = `${year} set the record${records.length > 1 ? "s" : ""} for ${list(records)}`;
    return more ? `${set}, and put ${entries(more, "more ")} in the top tens.` : `${set}.`;
  }
  if (more) return `${year} hasn't set a record, but it put ${entries(more)} in the top tens: ${list(places.filter((p) => p.n).map((p) => count(p.n, p.kind)))}.`;
  const newest = rankings.filter((r) => r.dates.length).sort((a, b) => (a.dates[0] < b.dates[0] ? 1 : -1))[0];
  return newest ? `No entries from ${year} yet; the newest record is ${longDate(newest.dates[0])}'s ${newest.kind}.` : null;
}
