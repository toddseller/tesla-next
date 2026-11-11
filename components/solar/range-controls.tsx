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

type Menu = { label: string; empty: string; items: Preset[]; range: Range; onRange: (range: Range) => void; phone?: boolean };

// A menu of presets whose button names the one picked, or `empty` when none matches the range. On a phone it holds the
// whole group, so its button carries the group's name and its items are full tap height.
function PresetMenu({ label, empty, items, range, onRange, phone }: Menu) {
  const [open, setOpen] = useState(false);
  const picked = items.find((item) => holds(item, range));
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" aria-haspopup="menu" aria-label={phone ? `${label}: ${picked?.label ?? empty}` : undefined} aria-pressed={phone ? undefined : Boolean(picked)}
          className={`flex items-center gap-1.5 ${phone ? "min-h-11 justify-between rounded-lg border border-input bg-card px-3.5 text-sm font-medium whitespace-nowrap sm:hidden max-sm:flex-1" : `justify-center ${presetStyle(Boolean(picked))}`}`}>
          {picked?.label ?? empty}
          <ChevronDown size={14} aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent role="menu" aria-label={label} align={phone ? "start" : "center"}
        className={`flex flex-col border-input p-1 shadow-xl shadow-black/45 ${phone ? "w-(--radix-popover-trigger-width) min-w-44" : "w-44"}`}>
        {items.map((item) => (
          <button key={item.label} type="button" role="menuitemradio" aria-checked={item === picked}
            onClick={() => { onRange(item.range); setOpen(false); }}
            className={`rounded-md px-2.5 text-left text-sm whitespace-nowrap ${phone ? "min-h-11" : "min-h-9 font-mono"} ${item === picked ? "bg-secondary text-white" : "hover:bg-secondary"}`}>
            {item.label}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

type Group = { label: string; range: Range; presets: Preset[]; earlier?: Preset[]; onRange: (range: Range) => void };

// The preset buttons, with an Earlier menu of older true-up years before the last, All time, when there are any; on a
// phone, one menu of them all.
export function PresetGroup({ label, range, presets, earlier, onRange }: Group) {
  const all = earlier ? [...presets.slice(0, -1), ...earlier, ...presets.slice(-1)] : presets;
  return (
    <>
      <div role="group" aria-label={label} className="flex gap-0.5 rounded-lg border border-input bg-card p-[3px] max-sm:hidden">
        {presets.map((preset, i) => (
          <Fragment key={preset.label}>
            {earlier && i === presets.length - 1 && (
              <PresetMenu label="Earlier true-up years" empty="Earlier" items={earlier} range={range} onRange={onRange} />
            )}
            <button type="button" aria-pressed={holds(preset, range)} onClick={() => onRange(preset.range)} className={presetStyle(holds(preset, range))}>
              {preset.label}
            </button>
          </Fragment>
        ))}
      </div>
      <PresetMenu label={label} empty="Custom" items={all} range={range} onRange={onRange} phone />
    </>
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
    <div className="flex flex-wrap items-center gap-2 max-sm:w-full">
      <PresetGroup label="Preset ranges" range={range} presets={presets} earlier={earlier} onRange={onRange} />
      <Popover open={open} onOpenChange={onOpen}>
        <PopoverTrigger asChild>
          <button type="button" aria-label="Choose dates"
            className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-input bg-card px-3.5 font-mono text-sm whitespace-nowrap max-sm:flex-1">
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
