"use client";

import { CalendarDays } from "lucide-react";
import { useState } from "react";

import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toDate, toDay } from "@/lib/calendar-dates";
import { FIRST_DAY } from "@/lib/scene/replay";
import { datesLabel, type Preset, type Range } from "@/lib/solar/ranges";

// Two years from the viewer's own today keeps inside the API's 732 days even when their clock is a day ahead of the site's.
const lastPickable = () => {
  const now = new Date();
  return new Date(now.getFullYear() + 2, now.getMonth(), now.getDate());
};

export function RangeControls({ range, presets, onRange }: { range: Range; presets: Preset[]; onRange: (range: Range) => void }) {
  const [open, setOpen] = useState(false);
  const [first, setFirst] = useState<string | null>(null);
  const onOpen = (value: boolean) => {
    setOpen(value);
    setFirst(null);
  };
  const pick = (date: Date) => {
    const day = toDay(date);
    if (!first) return setFirst(day);
    onRange(first < day ? { start: first, end: day } : { start: day, end: first });
    onOpen(false);
  };
  const shown = first ? { from: toDate(first), to: toDate(first) } : { from: toDate(range.start), to: toDate(range.end) };
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div role="group" aria-label="Preset ranges" className="grid grid-cols-3 gap-0.5 rounded-lg border border-input bg-card p-[3px] max-sm:w-full sm:flex">
        {presets.map(({ label, range: preset }) => {
          const selected = preset.start === range.start && preset.end === range.end;
          return (
            <button key={label} type="button" aria-pressed={selected} onClick={() => onRange(preset)}
              className={`min-h-10 rounded-md px-3.5 text-sm font-medium ${selected ? "bg-secondary text-white shadow-[inset_0_-2px_0_var(--primary)]" : "text-muted-foreground hover:text-foreground"}`}>
              {label}
            </button>
          );
        })}
      </div>
      <Popover open={open} onOpenChange={onOpen}>
        <PopoverTrigger asChild>
          <button type="button" aria-label="Choose dates"
            className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-input bg-card px-3.5 font-mono text-sm max-sm:w-full">
            <CalendarDays size={16} aria-hidden />
            {datesLabel(range, "short")}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="range"
            selected={shown}
            defaultMonth={toDate(range.start)}
            disabled={{ before: toDate(FIRST_DAY), after: lastPickable() }}
            onDayClick={pick}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
