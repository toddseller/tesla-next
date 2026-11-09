// What the backup history shows beyond the events themselves, worked out from stored data: the batteries through each
// outage, the weather at its start, storm days and blips per year. Pure, so each rule is tested on its own.

import { rainFrom } from "@/lib/intervals/weather";
import { siteToday } from "@/lib/scene/replay";

const STEP = 5 * 60_000;

// Measured November 9, 2026 against the 6,607 battery samples: 1% of charge is about 0.36 kWh out of the batteries and
// 0.41 kWh into them, so a kWh in raises the charge by 0.36/0.41 of what a kWh out lowers it.
const KWH_PER_PERCENT = 0.36;
const CHARGE_EFFICIENCY = 0.36 / 0.41;
const CAPACITY_KWH = 100 * KWH_PER_PERCENT;
// Solar exported while the batteries take none read 100% in 479 of 501 samples. While the grid is down nothing can be
// exported, so the signal is looked for before the outage, and the batteries' net change since then must be small.
const FULL_LOOKBACK = 12 * 60 * 60_000;
const FULL_TOLERANCE_WH = 1000;
// Fewer stored intervals than this share of the outage's slots, and the drop may be understated.
const COMPLETE_SHARE = 0.8;

export type BatteryInterval = { start: number; out: number; in: number; solarExported: number; house: number };
type Span = { start: number; end: number };

const overlap = (interval: number, { start, end }: Span) => Math.max(0, Math.min(end, interval + STEP) - Math.max(start, interval)) / STEP;

// The batteries through one outage from its intervals (and those of the 12 hours before it), in Wh in each interval.
export function outageBattery(intervals: BatteryInterval[], outage: Span) {
  const during = intervals.filter((i) => overlap(i.start, outage) > 0);
  let [total, out, deepest, lowIndex] = [0, 0, 0, -1];
  during.forEach((i, index) => {
    const part = overlap(i.start, outage);
    total += part * (i.out - i.in * CHARGE_EFFICIENCY);
    out += part * i.out;
    if (total > deepest) [deepest, lowIndex] = [total, index];
  });
  const slots = Math.ceil(outage.end / STEP) - Math.floor(outage.start / STEP);
  const complete = during.length >= COMPLETE_SHARE * slots;

  const before = intervals.filter((i) => i.start >= outage.start - FULL_LOOKBACK && i.start + STEP <= outage.start);
  const signal = before.findLastIndex((i) => i.solarExported > 0 && i.in === 0);
  const since = signal < 0 ? null : before.slice(signal + 1).reduce((net, i) => net + i.in * CHARGE_EFFICIENCY - i.out, 0);
  const full = since !== null && Math.abs(since) < FULL_TOLERANCE_WH;

  // Never below where they started: the lowest point is the start.
  const lowAt = lowIndex < 0 ? outage.start : during[lowIndex].start + STEP;
  const hour = intervals.filter((i) => i.start >= lowAt - 12 * STEP && i.start < lowAt);
  const drawKw = hour.length ? (hour.reduce((wh, i) => wh + i.house, 0) / hour.length) * 12 / 1000 : 0;
  const shown = full && complete;
  const left = CAPACITY_KWH - deepest / 1000;
  return {
    drop_kwh: deepest / 1000,
    low_at: new Date(lowAt).toISOString(),
    complete,
    full,
    low_percent: shown ? 100 - deepest / 1000 / KWH_PER_PERCENT : null,
    left_kwh: shown ? left : null,
    hours_left: shown && drawKw > 0 ? left / drawKw : null,
    refilled: out / 1000 > CAPACITY_KWH,
  };
}

export type OutageBattery = ReturnType<typeof outageBattery>;

// The area's weather around an outage's start, by the wettest code and the strongest wind (km/h) among its samples.
// First cutoffs, set so the February 2024 and 2025 storms read high wind and the summer outages calm.
const HEAVY_RAIN = 0.7;
const HIGH_WIND = 40;
const WINDY = 25;
const THUNDERSTORM = 95;

export function weatherLabel(samples: { code: number; wind: number | null }[]) {
  if (!samples.length) return null;
  const code = Math.max(...samples.map((s) => s.code));
  const rain = Math.max(...samples.map((s) => rainFrom(s.code)));
  const wind = Math.max(0, ...samples.map((s) => s.wind ?? 0));
  const parts = [
    code >= THUNDERSTORM ? "thunderstorm" : rain >= HEAVY_RAIN ? "heavy rain" : rain > 0 ? "rain" : null,
    wind >= HIGH_WIND ? "high wind" : wind >= WINDY ? "windy" : null,
  ].filter(Boolean).join(", ");
  return parts ? parts[0].toUpperCase() + parts.slice(1) : "Calm";
}

type Event = { start: string; end: string; kind: string };
const seconds = ({ start, end }: Event) => (Date.parse(end) - Date.parse(start)) / 1000;
const grouped = (e: Event) => e.kind === "outage" || e.kind === "blip";
// Several events of one storm: each starting less than this after the previous one ended.
const STORM_GAP = 6 * 60 * 60_000;

// The list's items, newest first: a storm day of two or more outages and blips, or an event alone. Tests and
// commissioning are never grouped and don't break a group.
export function stormDays<E extends Event>(newestFirst: E[]) {
  const runs: E[][] = [];
  for (const e of [...newestFirst].reverse()) {
    const last = runs.findLast((run) => grouped(run[0]));
    const previous = last?.at(-1);
    if (grouped(e) && previous && Date.parse(e.start) - Date.parse(previous.end) < STORM_GAP) last!.push(e);
    else runs.push([e]);
  }
  return runs
    .map((run) => ({
      group: run.length > 1 ? { first_day: siteToday(Date.parse(run[0].start)), count: run.length, seconds: run.reduce((total, e) => total + seconds(e), 0) } : null,
      events: run.reverse(),
    }))
    .sort((a, b) => b.events[0].start.localeCompare(a.events[0].start));
}

// Blips in each true-up year of the range, by the site day they began.
export function blipsPerYear(events: Event[], { start, end }: { start: string; end: string }) {
  const years = Array.from({ length: Number(end.slice(0, 4)) - Number(start.slice(0, 4)) }, (_, i) => Number(start.slice(0, 4)) + i);
  const yy = (year: number) => String(year % 100).padStart(2, "0");
  return years.map((year) => ({
    label: `'${yy(year)} - '${yy(year + 1)}`,
    count: events.filter((e) => {
      const day = siteToday(Date.parse(e.start));
      return e.kind === "blip" && day >= `${year}-10-01` && day <= `${year + 1}-09-30`;
    }).length,
  }));
}
