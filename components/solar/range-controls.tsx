"use client";

import { CalendarDays, ChevronDown } from "lucide-react";
import { Fragment, useState } from "react";

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

const holds = (preset: Preset, range: Range) => preset.range.start === range.start && preset.range.end === range.end;

export const presetStyle = (selected: boolean) =>
  `min-h-10 whitespace-nowrap rounded-md px-3.5 text-sm font-medium ${selected ? "bg-secondary text-white shadow-[inset_0_-2px_0_var(--primary)]" : "text-muted-foreground hover:text-foreground"}`;

// Older true-up years, so the row keeps its size as years pass; an earlier year picked names the button.
function EarlierMenu({ range, years, onRange }: { range: Range; years: Preset[]; onRange: (range: Range) => void }) {
  const [open, setOpen] = useState(false);
  const picked = years.find((year) => holds(year, range));
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" aria-haspopup="menu" aria-pressed={Boolean(picked)} className={`flex items-center justify-center gap-1.5 ${presetStyle(Boolean(picked))}`}>
          {picked?.label ?? "Earlier"}
          <ChevronDown size={14} aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent role="menu" aria-label="Earlier true-up years" className="flex w-44 flex-col border-input p-1 shadow-xl shadow-black/45">
        {years.map((year) => (
          <button key={year.label} type="button" role="menuitemradio" aria-checked={year === picked}
            onClick={() => { onRange(year.range); setOpen(false); }}
            className={`min-h-9 rounded-md px-2.5 text-left font-mono text-sm whitespace-nowrap ${year === picked ? "bg-secondary text-white" : "hover:bg-secondary"}`}>
            {year.label}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

export function RangeControls({ range, presets, earlier, onRange }: { range: Range; presets: Preset[]; earlier?: Preset[]; onRange: (range: Range) => void }) {
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
        {presets.map((preset, i) => (
          <Fragment key={preset.label}>
            {/* The menu goes before the last preset, which for the true-up years is All time. */}
            {earlier && i === presets.length - 1 && <EarlierMenu range={range} years={earlier} onRange={onRange} />}
            <button type="button" aria-pressed={holds(preset, range)} onClick={() => onRange(preset.range)} className={presetStyle(holds(preset, range))}>
              {preset.label}
            </button>
          </Fragment>
        ))}
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
