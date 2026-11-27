"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { type KeyboardEvent, type PointerEvent, useEffect, useRef, useState } from "react";

import { Doorway } from "@/components/home/doorway";
import { PresetGroup } from "@/components/solar/range-controls";
import type { SolarDay } from "@/lib/home/solar-hours";
import { FIRST_DAY } from "@/lib/scene/replay";
import { address, monthOf } from "@/lib/solar/ranges";
import { energy } from "@/lib/units";

type Shares = { from_solar_percentage: number; from_powerwall_percentage: number; from_grid_percentage: number; total_solar: number };
type Props = { year: number; today: string; days: SolarDay[]; shares: Shares };

const FIRST_YEAR = Number(FIRST_DAY.slice(0, 4));
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const longDay = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
const shortDay = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", timeZone: "UTC" });
const DAY_MS = 86_400_000;

const yearDays = (year: number) => {
  const first = Date.UTC(year, 0, 1);
  return Array.from({ length: (Date.UTC(year + 1, 0, 1) - first) / DAY_MS }, (_, i) => new Date(first + i * DAY_MS).toISOString().slice(0, 10));
};
const kwh = (value: number) => value.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

// Dark through amber to white by the hour's share of the year's brightest hour, as the mockups drew it.
const STOPS: [number, [number, number, number]][] = [[0, [14, 17, 22]], [0.12, [60, 34, 8]], [0.45, [200, 120, 0]], [0.75, [247, 181, 0]], [1, [255, 246, 214]]];
function shade(t: number) {
  const i = STOPS.findIndex(([at]) => t <= at);
  if (i <= 0) return `rgb(${STOPS[0][1]})`;
  const [[a, from], [b, to]] = [STOPS[i - 1], STOPS[i]];
  const f = (t - a) / (b - a);
  return `rgb(${from.map((c, k) => Math.round(c + (to[k] - c) * f))})`;
}

// A year's days, and the first and last with figures.
function withFigures(year: number, days: SolarDay[]) {
  const dates = yearDays(year);
  const has = new Set(days.map((d) => d.day));
  return { dates, first: Math.max(0, dates.findIndex((d) => has.has(d))), last: Math.max(0, dates.findLastIndex((d) => has.has(d))) };
}

// The shown date's month and day in another year (the 28th for February 29), kept within the days with figures:
// the first of them before they begin. In the current year it can reach today, figures or not, as the page opens on it.
function sameDate(shown: string, year: number, days: SolarDay[], today: string) {
  const { dates, first, last } = withFigures(year, days);
  const end = year === Number(today.slice(0, 4)) ? dates.indexOf(today) : last;
  const at = dates.findLastIndex((d) => d <= `${year}-${shown.slice(5)}`);
  return Math.min(Math.max(at, first), end);
}

export function Year({ year: servedYear, today, days: servedDays, shares: servedShares }: Props) {
  const [shown, setShown] = useState({ year: servedYear, days: servedDays, shares: servedShares });
  const [asked, setAsked] = useState<{ year: number; failed: boolean } | null>(null);
  const dates = yearDays(shown.year);
  const byDay = new Map(shown.days.map((d) => [d.day, d.kwh]));
  const { first: firstWithFigures, last: lastWithFigures } = withFigures(shown.year, shown.days);
  const [index, setIndex] = useState(() => sameDate(today, shown.year, shown.days, today));
  // The day shown when a year arrives, which a visitor may have moved while it loaded.
  const shownIndex = useRef(index);
  useEffect(() => {
    shownIndex.current = index;
  }, [index]);
  const canvas = useRef<HTMLCanvasElement>(null);
  const latest = useRef(0);

  const totals = shown.days.map((d) => ({ day: d.day, kwh: sum(d.kwh) }));
  const best = totals.reduce<(typeof totals)[number] | null>((a, b) => (!a || b.kwh > a.kwh ? b : a), null);
  const current = shown.year === Number(today.slice(0, 4));
  const summary = `${shown.year} solar by day and hour: ${energy(sum(totals.map((t) => t.kwh)), 1).join(" ")}${current ? " so far" : ""}${best ? `, the best day ${shortDay.format(Date.parse(best.day))} at ${kwh(best.kwh)} kWh` : ""}.`;
  const day = dates[index];
  const dayKwh = byDay.get(day);
  // A no-break space, so the figure never wraps away from its unit.
  const readout = `${longDay.format(Date.parse(day))} · ${dayKwh ? `${kwh(sum(dayKwh))}\u00a0kWh` : "no figures"}`;

  useEffect(() => {
    const context = canvas.current?.getContext("2d");
    if (!context) return;
    const peak = Math.max(0, ...shown.days.flatMap((d) => d.kwh));
    context.clearRect(0, 0, 24, dates.length);
    dates.forEach((date, row) => (byDay.get(date) ?? []).forEach((value, hour) => {
      context.fillStyle = shade(peak ? value / peak : 0);
      context.fillRect(hour, row, 1, 1);
    }));
  }, [shown]); // eslint-disable-line react-hooks/exhaustive-deps -- `dates` and `byDay` follow from `shown`

  const step = (to: number) => setIndex(Math.min(dates.length - 1, Math.max(0, to)));
  const onKey = (event: KeyboardEvent) => {
    const to = { ArrowDown: index + 1, ArrowUp: index - 1, Home: firstWithFigures, End: lastWithFigures }[event.key];
    if (to === undefined) return;
    event.preventDefault();
    step(to);
  };
  const onPointer = (event: PointerEvent<HTMLDivElement>) => {
    const { top, height } = event.currentTarget.getBoundingClientRect();
    step(Math.floor(((event.clientY - top) / height) * dates.length));
  };

  // Only the year asked last is shown, whichever answer comes back last.
  const load = async (year: number) => {
    const request = ++latest.current;
    setAsked({ year, failed: false });
    const end = Math.min(Date.parse(`${year}-12-31`), Date.parse(today));
    try {
      const [hours, impact] = await Promise.all([
        fetch(`/api/solar-hours?year=${year}`),
        fetch(`/api/impact?start_date=${year}-01-01&end_date=${new Date(end).toISOString().slice(0, 10)}`),
      ]);
      if (!hours.ok || !impact.ok) throw new Error(`year ${year} answered ${hours.status}, ${impact.status}`);
      const [{ data: days }, { data: shares }] = await Promise.all([hours.json(), impact.json()]);
      if (request !== latest.current) return;
      setShown({ year, days, shares });
      setIndex(sameDate(dates[shownIndex.current], year, days, today));
      setAsked(null);
      const params = new URLSearchParams(window.location.search);
      params.set("year", String(year));
      window.history.replaceState(null, "", `/?${params}`);
    } catch (error) {
      console.error(error);
      if (request === latest.current) setAsked({ year, failed: true });
    }
  };

  const presets = Array.from({ length: Number(today.slice(0, 4)) - FIRST_YEAR + 1 }, (_, i) => FIRST_YEAR + i)
    .map((y) => ({ label: String(y), range: { start: `${y}-01-01`, end: `${y}-12-31` } }));

  return (
    <section aria-labelledby="year" className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <h2 id="year" className="text-[52px] leading-[0.9] font-semibold tracking-[-0.04em] text-solar md:text-[112px]">{shown.year}</h2>
        <div className="flex gap-2 max-sm:w-full">
          <PresetGroup label="Year" range={{ start: `${shown.year}-01-01`, end: `${shown.year}-12-31` }} presets={presets} onRange={(range) => load(Number(range.start.slice(0, 4)))} />
        </div>
      </div>
      {asked && (
        <p className="text-sm text-muted-foreground" role="status">
          {asked.failed ? <>Couldn&apos;t load {asked.year}. <button type="button" className="min-h-11 font-medium text-foreground underline" onClick={() => load(asked.year)}>Try again</button></> : `Loading ${asked.year}…`}
        </p>
      )}
      <div className="grid gap-x-14 gap-y-6 lg:grid-cols-[minmax(0,34rem)_minmax(0,1fr)]">
        <figure className="m-0 grid grid-cols-[2rem_minmax(0,1fr)] gap-x-2">
          <div className="col-start-2 mb-1.5 flex justify-between font-mono text-xs text-muted-foreground"><span>12a</span><span>6a</span><span>noon</span><span>6p</span><span>12a</span></div>
          <div className="relative font-mono text-xs text-muted-foreground" aria-hidden>
            {MONTHS.map((month, m) => (
              <span key={month} data-part="month" className="absolute" style={{ top: `${(dates.indexOf(`${shown.year}-${String(m + 1).padStart(2, "0")}-01`) / dates.length) * 100}%` }}>{month}</span>
            ))}
          </div>
          <div role="slider" tabIndex={0} aria-label={summary} aria-valuemin={0} aria-valuemax={dates.length - 1} aria-valuenow={index} aria-valuetext={readout}
            className={`relative touch-none outline-none focus-visible:ring-[3px] focus-visible:ring-ring ${asked && !asked.failed ? "opacity-50" : ""}`}
            onKeyDown={onKey} onPointerDown={onPointer} onPointerMove={onPointer}>
            <canvas ref={canvas} width={24} height={dates.length} className="block aspect-[24/40] w-full rounded-sm [image-rendering:pixelated] max-lg:max-h-[50svh]" />
            <div aria-hidden className="absolute inset-x-0 h-0.5 bg-foreground" style={{ top: `${(index / dates.length) * 100}%` }} />
            {current && <div data-part="today-row" aria-hidden className="absolute -inset-x-2 h-0.5 bg-primary" style={{ top: `${(dates.indexOf(today) / dates.length) * 100}%` }} />}
          </div>
        </figure>
        <div className="flex flex-col gap-6 max-lg:contents lg:sticky lg:top-6 lg:self-start">
          <p className="max-w-[60ch] text-[15px] max-lg:-order-1 text-pretty text-muted-foreground">
            Every day of the year, top to bottom; every hour, left to right. Brighter is more sun. Summer&apos;s long days, the March and November clock changes and the cloudy streaks all show.
          </p>
          <div className="flex flex-col gap-2.5 rounded-[10px] border border-input bg-card p-4 max-lg:-order-1">
            <p className="font-mono text-[13px] text-muted-foreground">Point at, drag across or tap a day; or focus the chart and use Up and Down.</p>
            <div className="flex items-center gap-2.5">
              <button type="button" aria-label="Previous day" className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-input" onClick={() => step(index - 1)}><ChevronLeft size={16} aria-hidden /></button>
              <p data-part="day-readout" aria-live="polite" className="flex-1 text-center text-[15px] font-medium">{readout}</p>
              <button type="button" aria-label="Next day" className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-input" onClick={() => step(index + 1)}><ChevronRight size={16} aria-hidden /></button>
            </div>
            <Doorway href={address(monthOf(day), day)}>Open the day</Doorway>
          </div>
          <div className="flex flex-col gap-3">
            <p className="font-mono text-[13px] text-muted-foreground">Where the house&apos;s energy came from in {shown.year}, car included</p>
            <div aria-hidden className="flex h-3.5 overflow-hidden rounded">
              <div className="bg-solar" style={{ width: `${shown.shares.from_solar_percentage}%` }} />
              <div className="bg-powerwall" style={{ width: `${shown.shares.from_powerwall_percentage}%` }} />
              <div className="bg-grid" style={{ width: `${shown.shares.from_grid_percentage}%` }} />
            </div>
            <div className="flex flex-wrap gap-x-9 gap-y-3 font-mono">
              <span><b className="text-2xl text-solar">{shown.shares.from_solar_percentage}%</b> <span className="font-sans text-[13px] text-muted-foreground">solar</span></span>
              <span><b className="text-2xl text-powerwall">{shown.shares.from_powerwall_percentage}%</b> <span className="font-sans text-[13px] text-muted-foreground">Powerwalls</span></span>
              <span><b className="text-2xl text-grid">{shown.shares.from_grid_percentage}%</b> <span className="font-sans text-[13px] text-muted-foreground">grid</span></span>
            </div>
            <Doorway href={`/impact?start=${shown.year}-01-01&end=${shown.year}-12-31`}>The year on Impact</Doorway>
          </div>
        </div>
      </div>
    </section>
  );
}
