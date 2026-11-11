"use client";

import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, ViewTransition } from "react";

import { ReadingsNote, ReadingsSwitch } from "@/components/readings-switch";
import { type Day, DayView } from "@/components/solar/day-view";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toDate, toDay } from "@/lib/calendar-dates";
import { type Readings, withReadings } from "@/lib/meter";
import type { RangeItem } from "@/lib/range";
import { FIRST_DAY, shiftDay, TIME_ZONE } from "@/lib/scene/replay";
import { address, type Range, rangeLabel } from "@/lib/solar/ranges";

const dayLabel = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
const monthDay = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
const clock = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: TIME_ZONE });

// Keys typed into a field, or into the calendar, belong to it.
const ownsKeys = (target: EventTarget | null) =>
  target instanceof Element && Boolean(target.closest("input, textarea, select, [contenteditable=true], [data-slot=popover-content]"));

type Props = {
  range: Range;
  day: Day;
  strip: RangeItem[];
  today: string;
  modified: string | null;
  onDay: (day: string) => void;
  readings?: Readings;
  // The day's two addresses when its strip reaches a corrected day, so the choice of readings shows.
  readingsAt?: Record<Readings, string> | null;
};

export function DayPanel({ range, day, strip, today, modified, onDay, readings = "corrected", readingsAt = null }: Props) {
  const date = day.date;
  const previous = date > FIRST_DAY ? shiftDay(date, -1) : null;
  const next = date < today ? shiftDay(date, 1) : null;
  const [picking, setPicking] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || ownsKeys(event.target)) return;
      const to = event.key === "ArrowLeft" ? previous : event.key === "ArrowRight" ? next : null;
      if (to) onDay(to);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [previous, next, onDay]);

  const step = "flex size-11 items-center justify-center rounded-lg border border-input bg-card disabled:opacity-30";
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href={withReadings(address(range), readings)} className="flex min-h-11 items-center gap-1.5 rounded-md pr-2.5 text-sm text-[#C4CAD1] hover:text-foreground">
          <ChevronLeft size={18} aria-hidden />
          {rangeLabel(range)}
        </Link>
        <div className="grid grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] gap-1 max-sm:w-full">
          <button type="button" aria-label="Previous day" title="Previous day (←)" className={step} disabled={!previous} onClick={() => previous && onDay(previous)}>
            <ChevronLeft size={18} aria-hidden />
          </button>
          <Popover open={picking} onOpenChange={setPicking}>
            <PopoverTrigger asChild>
              <button type="button" aria-label="Day" className="flex h-11 min-w-60 items-center justify-center gap-2.5 rounded-lg border border-input bg-card px-4 font-semibold">
                <CalendarDays size={16} className="text-muted-foreground" aria-hidden />
                {dayLabel.format(new Date(`${date}T00:00:00Z`))}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
              <Calendar mode="single" selected={toDate(date)} defaultMonth={toDate(date)}
                disabled={{ before: toDate(FIRST_DAY), after: toDate(today) }}
                onSelect={(picked) => {
                  if (!picked) return;
                  onDay(toDay(picked));
                  setPicking(false);
                }} />
            </PopoverContent>
          </Popover>
          <button type="button" aria-label="Next day" title="Next day (→)" className={step} disabled={!next} onClick={() => next && onDay(next)}>
            <ChevronRight size={18} aria-hidden />
          </button>
        </div>
        {readingsAt && <ReadingsSwitch readings={readings} addresses={readingsAt} />}
        <span className="min-h-4 text-xs text-muted-foreground">
          {date === today && modified ? `Last updated at ${clock.format(new Date(modified))}` : ""}
        </span>
      </div>
      <DaysStrip items={strip} shown={date} onDay={onDay} />
      {/* Only a day step slides it; the stepper, the back link and the strip above hold still. */}
      <ViewTransition default="none" update={{ "day-next": "slide-next", "day-previous": "slide-previous", default: "none" }}>
        <DayView day={day} today={today} />
      </ViewTransition>
      {readingsAt && <ReadingsNote readings={readings} />}
    </div>
  );
}

function DaysStrip({ items, shown, onDay }: { items: RangeItem[]; shown: string; onDay: (day: string) => void }) {
  const tallest = Math.max(1, ...items.map((item) => item.solar ?? 0));
  const strip = useRef<HTMLElement>(null);
  // On a phone the strip scrolls; it opens with the shown day in the middle rather than off to one side.
  useEffect(() => {
    const day = strip.current?.querySelector<HTMLElement>("[aria-current=date]");
    if (strip.current && day) strip.current.scrollLeft = day.offsetLeft + day.clientWidth / 2 - strip.current.clientWidth / 2;
  }, [shown]);
  return (
    <nav ref={strip} aria-label="Days" className="relative overflow-x-auto rounded-[10px] border bg-card">
      <div className="flex w-max min-w-full gap-1 px-3 pt-2.5 pb-1.5">
        {items.map(({ day, solar }) => {
          const current = day === shown;
          return (
            <button key={day} type="button" aria-label={`${monthDay.format(new Date(`${day}T00:00:00Z`))}, ${solar} kWh solar`}
              aria-current={current ? "date" : undefined} onClick={() => onDay(day!)}
              className={`flex min-h-16 min-w-7 flex-1 flex-col items-center justify-end gap-1 rounded px-0.5 pt-0.5 pb-1 ${current ? "bg-secondary shadow-[inset_0_-2px_0_var(--primary)]" : ""}`}>
              <span className="w-[70%] min-w-3 rounded-sm bg-solar" style={{ height: Math.max(2, Math.round(((solar ?? 0) / tallest) * 36)), opacity: current ? 1 : 0.4 }} />
              <span className={`font-mono text-[11px] ${current ? "text-white" : "text-muted-foreground"}`}>{Number(day!.slice(8))}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
