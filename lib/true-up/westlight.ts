import { pyRound } from "@/lib/intervals/python";
import { cents, type DayGrid, inEffect, newestFirst, seasonOf } from "@/lib/true-up/pricing";

// WestLight Energy (Peninsula Clean Energy until 2026) bills generation on PG&E's bill, netted by period like PG&E's NEM
// charges, against its own credit balance, which it cashes out each April.
type Rates = Record<`${"summer" | "winter"}_${"peak" | "off_peak"}`, number>;
export type WestLightRevision = Rates & { effective_date: string; eco100: number; bonus: number; estimated?: true };

const revision = (effective_date: string, [summer_peak, summer_off_peak, winter_peak, winter_off_peak]: number[], eco100: number): WestLightRevision =>
  ({ effective_date, summer_peak, summer_off_peak, winter_peak, winter_off_peak, eco100, bonus: 0.01 });

// Before August 2024 no sheet survives, so each PG&E revision from September 2023 (rate_revision's generation columns)
// is scaled per period by WestLight's August 2024 rate over PG&E's generation rate in effect that day (0.92791,
// 0.91407, 0.91942, 0.91305), so the last estimate equals the first sheet. April 2024 repeats March's rates.
const estimated = (effective_date: string, rates: number[]): WestLightRevision => ({ ...revision(effective_date, rates, 0.01), estimated: true });

const AUGUST_2024 = [0.20001, 0.12116, 0.14296, 0.11761];
const FEBRUARY_2025 = [0.18948, 0.11478, 0.13543, 0.11142];

// E-TOU-C's "Generation rate" column of WestLight's residential rate sheets, the bill's rates. ECO100's premium changes on
// its own dates, by board decision; the Net Generation Bonus stayed at 1 cent through them. To add a revision, add its row
// from the new sheet (westlightenergy.org).
export const WESTLIGHT: WestLightRevision[] = [
  estimated("2023-09-01", [0.18350, 0.12278, 0.13714, 0.11334]),
  estimated("2024-01-01", [0.20773, 0.14664, 0.16116, 0.13719]),
  estimated("2024-03-01", [0.20777, 0.14668, 0.16119, 0.13722]),
  estimated("2024-06-01", [0.21920, 0.14006, 0.16197, 0.13649]),
  estimated("2024-07-01", AUGUST_2024),
  revision("2024-08-01", AUGUST_2024, 0.01),
  revision("2025-01-01", AUGUST_2024, 0.015),
  revision("2025-02-10", FEBRUARY_2025, 0.015),
  revision("2026-01-01", FEBRUARY_2025, 0.01),
  revision("2026-02-01", [0.14048, 0.04778, 0.07683, 0.05282], 0.01),
  revision("2026-07-01", [0.15036, 0.05251, 0.08318, 0.05783], 0.01),
];

const ordered = newestFirst(WESTLIGHT);
export const westlightIn = (day: string) => inEffect(day, ordered);

const sum = (values: number[]) => pyRound(values.reduce((total, value) => total + value, 0), 2);

// A billing cycle's WestLight charges from dailyGrid's days (Wh), or null when a day has no rates. Each season and
// revision's peak and off-peak nets are a line at its rate; ECO100's premium is added on the lines that imported and the
// bonus credited on those that exported, one line per rate, as the bills show them.
export function generationCharges(first: string, last: string, days: Record<string, DayGrid>) {
  const nets = new Map<string, { revision: WestLightRevision; season: "summer" | "winter"; peak: number; offPeak: number }>();
  for (const [day, grid] of Object.entries(days)) {
    if (day < first || day > last) continue;
    const revision = westlightIn(day);
    if (!revision) return null;
    const season = seasonOf(day);
    const key = `${revision.effective_date} ${season}`;
    const part = nets.get(key) ?? { revision, season, peak: 0, offPeak: 0 };
    part.peak += grid.peak_net / 1000;
    part.offPeak += (grid.imported - grid.exported - grid.peak_net) / 1000;
    nets.set(key, part);
  }
  const generation: number[] = [];
  const imported = new Map<number, number>();
  const exported = new Map<number, number>();
  for (const { revision, season, peak, offPeak } of nets.values()) {
    for (const [kwh, rate] of [[peak, revision[`${season}_peak`]], [offPeak, revision[`${season}_off_peak`]]]) {
      generation.push(cents(kwh * rate));
      if (kwh > 0) imported.set(revision.eco100, (imported.get(revision.eco100) ?? 0) + kwh);
      if (kwh < 0) exported.set(revision.bonus, (exported.get(revision.bonus) ?? 0) + kwh);
    }
  }
  const lines = (byRate: Map<number, number>) => sum([...byRate].map(([rate, kwh]) => cents(kwh * rate)));
  const charges = { generation: sum(generation), eco100: lines(imported), bonus: lines(exported) };
  return { ...charges, total: sum(Object.values(charges)) };
}
