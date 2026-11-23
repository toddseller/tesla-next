"use client";

import { Fragment, type ReactNode, useEffect, useState } from "react";
import { Area, ComposedChart, Line, ReferenceArea, XAxis, YAxis } from "recharts";

import { useReload } from "@/components/solar/use-reload";
import { Doorway } from "@/components/home/doorway";
import { DetailsBox, type Hover } from "@/components/home/chart-details";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { useLiveStream } from "@/components/use-live-stream";
import type { ForecastCard } from "@/lib/forecast";
import { solarWindow, stillToCome, todayRows } from "@/lib/home/today";
import { siteToday, TIME_ZONE } from "@/lib/scene/replay";
import { sunTimes } from "@/lib/scene/sun";
import { TIME_TICKS, timeTick, type Interval, viewSummary } from "@/lib/solar/day-views";
import { address, monthOf } from "@/lib/solar/ranges";

export type Day = { date: string; vehicle_data: boolean; totals: Record<string, number>; data: Interval[] };
type Props = { today: string; forecast: ForecastCard | null; day: Day; renderedAt: number };

const clock = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: TIME_ZONE });
const hour = new Intl.DateTimeFormat("en-US", { hour: "numeric", timeZone: TIME_ZONE });
const weekday = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "UTC" });
const DAY_MINUTES = 1440;

// The space is inside the small text, so the gap is the unit's size, not the figure's. Under the days ahead's small
// figures, 0.6em would fall below DESIGN.md's 11px floor.
const Unit = ({ unit }: { unit: string }) => <span className="text-[max(11px,0.6em)] font-medium text-muted-foreground">{` ${unit}`}</span>;

type FigureProps = { value: ReactNode; unit?: string; label: string; className?: string; wide?: boolean };
export const Figure = ({ value, unit, label, className = "", wide = false }: FigureProps) => (
  <div className={`flex flex-col gap-1 ${wide ? "col-span-2" : ""}`}>
    <b className={`font-mono text-2xl leading-none font-semibold tabular-nums ${className}`}>{value}{unit && <Unit unit={unit} />}</b>
    <span className="text-[13px] text-muted-foreground">{label}</span>
  </div>
);

// Today's six totals as the day view gives them, the house without the car on a day with car data. Distribution shows
// the same six under its scene on a phone.
export function TodayTotals({ day }: { day: Pick<Day, "totals" | "vehicle_data"> }) {
  const total = (view: string, i = 0) => viewSummary(view, day.totals, { vehicleData: day.vehicle_data }).headlines[i].value.toFixed(1);
  return (
    <>
      <Figure value={total("home")} unit="kWh" label={day.vehicle_data ? "used by the house, car apart" : "used by the house"} />
      <Figure value={total("vehicle")} unit="kWh" label="charged into the car" className="text-vehicle" />
      <Figure value={total("grid")} unit="kWh" label="from the grid" className="text-grid" />
      <Figure value={total("grid", 1)} unit="kWh" label="sent to PG&E" className="text-grid" />
      <Figure value={total("powerwall", 1)} unit="kWh" label="into the Powerwalls" className="text-powerwall" />
      <Figure value={total("powerwall")} unit="kWh" label="out of the Powerwalls" className="text-powerwall" />
    </>
  );
}

// `renderedAt` is when the server rendered the page, so hydration finds the morning sentence it sent; the browser's
// clock takes over after, once a minute.
export function Today({ today, forecast, day, renderedAt }: Props) {
  const [now, setNow] = useState(renderedAt);
  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);
  const [card, reloadCard] = useReload(today, forecast);
  const [shownDay, reloadDay] = useReload(today, day);
  // Only shown once a reload fails, after hydration, so the server's clock never has to match.
  const [loadedAt, setLoadedAt] = useState(() => Date.now());
  const [failed, setFailed] = useState(false);
  // The site's day, not the day served, so a tab left open past midnight moves on to the new day.
  const reload = async (date = siteToday()) => {
    const done = await Promise.all([
      reloadCard("/api/forecast", (body: { data: ForecastCard }) => body.data),
      reloadDay(`/api/intervals?date=${date}`, (body: Day) => body),
    ]);
    setFailed(done.includes(false));
    if (!done.includes(false)) setLoadedAt(Date.now());
  };
  useLiveStream({ onTotals: (date) => date === siteToday() && void reload(date), onReopen: () => void reload() });

  const soFar = card?.today.soFar ?? 0;
  const expected = card?.today.expected ?? null;
  const byNow = card?.byHour?.byNow ?? null;
  const rows = todayRows(shownDay, card?.byHour?.hours ?? []);

  // Until most of the day's solar is under way, say when the sun rose and when that solar comes.
  const most = card?.byHour && expected !== null ? solarWindow(card.byHour.hours) : null;
  const morning = most && now < Date.parse(most.start)
    ? `Sunrise ${clock.format(sunTimes(new Date(now)).sunrise)}. Most of today's ${expected!.toFixed(1)} kWh is expected between ${hour.format(Date.parse(most.start))} and ${hour.format(Date.parse(most.end))}.`
    : null;

  // Made and expected by the same moment, as the Solar page compares them (the day's running total can be minutes
  // newer), each to a tenth as it reads there.
  const gap = byNow && Math.round((Number(byNow.made.toFixed(1)) - Number(byNow.expected.toFixed(1))) * 10) / 10;

  return (
    <section aria-labelledby="today" className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <h2 id="today" className="text-[64px] leading-[0.9] font-semibold tracking-[-0.04em] text-solar md:text-[112px]">Today</h2>
        <div className="flex flex-wrap gap-x-9 gap-y-4">
          <Figure value={soFar.toFixed(1)} unit="kWh" label={expected === null ? "generated" : `generated, of ${expected.toFixed(1)} kWh expected`} className="text-4xl text-solar md:text-[40px]" />
          {byNow && <Figure value={Math.abs(gap!).toFixed(1)} unit="kWh" label={gap! > 0 ? "ahead of the forecast" : gap! < 0 ? "behind the forecast" : "on the forecast"} />}
          {expected !== null && <Figure value={stillToCome(card?.byHour ?? null, expected)!.toFixed(1)} unit="kWh" label="still to come" />}
        </div>
      </div>
      {failed && <p className="font-mono text-[13px] text-muted-foreground">as of {clock.format(new Date(loadedAt))}</p>}
      {morning && <p data-part="morning" className="max-w-[60ch] text-[15px] text-pretty">{morning}</p>}
      <p className="max-w-[60ch] text-[15px] text-pretty text-muted-foreground">
        Solar by the hour against the forecast&apos;s dashed line. Below the line: energy sent to PG&amp;E and into the Powerwalls.
      </p>
      <ChartContainer config={{}} className="aspect-auto h-56 w-full md:h-64">
        <ComposedChart data={rows.records} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
          <XAxis dataKey="minute" type="number" domain={[0, DAY_MINUTES]} ticks={TIME_TICKS} tickFormatter={timeTick} tickLine={false} axisLine={false} />
          <YAxis unit=" kW" tickLine={false} axisLine={false} width={64} />
          <ChartTooltip content={<TodayDetails />} />
          <ReferenceArea x1={rows.latest} x2={DAY_MINUTES} fill="var(--card)" fillOpacity={0.6} stroke="none" />
          <Area dataKey="solar" fill="var(--color-solar)" stroke="none" fillOpacity={0.85} isAnimationActive={false} />
          <Area dataKey="charging" stackId="below" fill="var(--color-powerwall)" stroke="none" fillOpacity={0.85} isAnimationActive={false} />
          <Area dataKey="exporting" stackId="below" fill="var(--color-grid)" stroke="none" fillOpacity={0.55} isAnimationActive={false} />
          <Line data={rows.forecast} dataKey="kw" stroke="var(--foreground)" strokeWidth={1.5} strokeDasharray="4 4" dot={false} isAnimationActive={false} />
        </ComposedChart>
      </ChartContainer>
      <div className="grid grid-cols-2 gap-x-4 gap-y-5 border-t pt-5 md:grid-cols-4">
        <TodayTotals day={shownDay} />
        {card?.days
          ? <Figure wide label="expected over the next three days" className="text-[15px] md:text-lg" value={card.days.map((d, i) => (
              // A day breaks only between days, never inside one.
              <Fragment key={d.day}>{i ? " · " : ""}<span data-part="day-ahead" className="whitespace-nowrap">{weekday.format(Date.parse(`${d.day}T12:00:00Z`))} {d.expected.toFixed(1)}<Unit unit="kWh" /></span></Fragment>
            ))} />
          : <p className="col-span-2 text-[13px] text-muted-foreground">No forecast right now</p>}
      </div>
      <Doorway href={address(monthOf(shownDay.date), shownDay.date)}>Today, hour by hour</Doorway>
    </section>
  );
}

const kw = (value: number) => `${Math.abs(value).toFixed(1)} kW`;
const minuteTime = (minute: number) => `${Math.floor(minute / 60) % 12 || 12}:${String(minute % 60).padStart(2, "0")} ${minute < 720 ? "AM" : "PM"}`;

export function TodayDetails({ active, payload }: Hover<{ minute: number; solar?: number; charging?: number; exporting?: number; kw?: number }>) {
  // The records and the forecast are separate series, so a point can carry either or both.
  const points = payload?.map((p) => p.payload) ?? [];
  const row = points.find((p) => p?.solar !== undefined);
  const forecast = points.find((p) => p?.kw !== undefined);
  if (!active || !(row ?? forecast)) return null;
  return (
    <DetailsBox title={minuteTime((row ?? forecast)!.minute)} details={[
      ...(row ? [
        { name: "Solar", value: kw(row.solar!), color: "var(--color-solar)" },
        { name: "Into the Powerwalls", value: kw(row.charging ?? 0), color: "var(--color-powerwall)" },
        { name: "Sent to PG&E", value: kw(row.exporting ?? 0), color: "var(--color-grid)" },
      ] : []),
      ...(forecast ? [{ name: "Expected", value: kw(forecast.kw!), color: "var(--foreground)" }] : []),
    ]} />
  );
}
