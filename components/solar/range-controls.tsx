"use client";

import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

import { Calendar, MARKER_SELECTED } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toDate, toDay } from "@/lib/calendar-dates";
import { FIRST_DAY } from "@/lib/scene/replay";
import { datesLabel, type Preset, type Range, rangeTitle, step } from "@/lib/solar/ranges";

const holds = (preset: Preset, range: Range) => preset.range.start === range.start && preset.range.end === range.end;
const shape = (range: Range) => step(range, 1)?.name;

// With `today`, a preset stays selected for a range of its shape, so stepping keeps the viewer on the preset that moved.
const selected = (presets: Preset[], range: Range, today?: string) =>
  presets.find((preset) => holds(preset, range)) ?? (today && shape(range) ? presets.find((preset) => shape(preset.range) === shape(range)) : undefined);

const SELECTED = "bg-secondary text-white shadow-[inset_0_-2px_0_var(--primary)]";

export const presetStyle = (selected: boolean) =>
  `min-h-10 whitespace-nowrap rounded-md px-3.5 text-sm font-medium ${selected ? SELECTED : "text-muted-foreground hover:text-foreground"}`;

type Menu = { label: string; items: Preset[]; range: Range; onRange: (range: Range) => void; lit?: Preset; litName?: string };

// On a phone, the whole group as one menu: its button carries the group's name and the preset picked, or Custom when
// none matches the range, and its items are full tap height.
function PresetMenu({ label, items, range, onRange, lit, litName }: Menu) {
  const [open, setOpen] = useState(false);
  const picked = lit ?? items.find((item) => holds(item, range));
  const shown = litName ?? picked?.label ?? "Custom";
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" aria-haspopup="menu" aria-label={`${label}: ${shown}`}
          className="flex min-h-11 items-center justify-between gap-1.5 rounded-lg border border-input bg-card px-3.5 text-sm font-medium whitespace-nowrap sm:hidden max-sm:flex-1">
          {shown}
          <ChevronDown size={14} aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent role="menu" aria-label={label} align="start"
        className="flex w-(--radix-popover-trigger-width) min-w-44 flex-col border-input p-1 shadow-xl shadow-black/45">
        {items.map((item) => (
          <button key={item.label} type="button" role="menuitemradio" aria-checked={item === picked}
            onClick={() => { onRange(item.range); setOpen(false); }}
            className={`min-h-11 rounded-md px-2.5 text-left text-sm whitespace-nowrap ${item === picked ? "bg-secondary text-white" : "hover:bg-secondary"}`}>
            {item.label}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

type Step = { by: 1 | -1; range: Range; today: string; onRange: (range: Range) => void; phone?: boolean };

function StepButton({ by, range, today, onRange, phone }: Step) {
  const next = step(range, by)!;
  const usable = by > 0 ? next.range.start <= today : next.range.end >= FIRST_DAY;
  const label = `${by > 0 ? "Next" : "Previous"} ${next.name}`;
  return (
    <button type="button" aria-label={label} title={label} disabled={!usable} onClick={() => onRange(next.range)}
      className={`flex shrink-0 items-center justify-center disabled:opacity-40 ${phone ? "size-11 rounded-lg border border-input bg-card sm:hidden" : "min-h-10 w-8 rounded-md"}`}>
      {by > 0 ? <ChevronRight size={phone ? 16 : 14} aria-hidden /> : <ChevronLeft size={phone ? 16 : 14} aria-hidden />}
    </button>
  );
}

type Group = { label: string; range: Range; presets: Preset[]; onRange: (range: Range) => void; today?: string };

// The preset buttons; on a phone, one menu of them all. Given `today`, the selected preset holds step buttons and names a
// range it was stepped to.
export function PresetGroup({ label, range, presets, onRange, today }: Group) {
  const lit = selected(presets, range, today);
  const steps = Boolean(today && lit && shape(range));
  const stepped = lit && !holds(lit, range) ? rangeTitle(range) : undefined;
  const back = lit && stepped ? `Back to ${lit.label[0].toLowerCase()}${lit.label.slice(1)}` : undefined;
  return (
    <>
      <div role="group" aria-label={label} className="flex gap-0.5 rounded-lg border border-input bg-card p-[3px] max-sm:hidden">
        {presets.map((preset) =>
          preset === lit && steps ? (
            <div key={preset.label} className={`flex items-center rounded-md ${SELECTED}`}>
              <StepButton by={-1} range={range} today={today!} onRange={onRange} />
              <button type="button" aria-pressed title={back} onClick={() => onRange(preset.range)} className="min-h-10 whitespace-nowrap px-1 text-sm font-medium">
                {stepped ?? preset.label}
              </button>
              <StepButton by={1} range={range} today={today!} onRange={onRange} />
            </div>
          ) : (
            <button key={preset.label} type="button" aria-pressed={preset === lit} onClick={() => onRange(preset.range)} className={`${presetStyle(preset === lit)} ${today ? "max-xl:px-1.5" : ""}`}>
              {preset.label}
            </button>
          ),
        )}
      </div>
      {steps && <StepButton by={-1} range={range} today={today!} onRange={onRange} phone />}
      <PresetMenu label={label} items={presets} range={range} onRange={onRange} lit={lit} litName={stepped} />
      {steps && <StepButton by={1} range={range} today={today!} onRange={onRange} phone />}
    </>
  );
}

type Controls = { today: string; range: Range; presets: Preset[]; onRange: (range: Range) => void };

export function RangeControls({ today, range, presets, onRange }: Controls) {
  const [open, setOpen] = useState(false);
  const [first, setFirst] = useState<string | null>(null);
  const [months, setMonths] = useState(1);
  const onOpen = (value: boolean) => {
    // Read on opening, so the server's render never depends on the window's width.
    if (value) setMonths(typeof matchMedia === "function" && matchMedia("(min-width: 640px)").matches ? 2 : 1);
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
  const name = `Choose dates, ${datesLabel(range, "short")}`;
  const custom = !selected(presets, range, today);
  const end = toDate(range.end);
  return (
    <div className="flex flex-wrap items-center gap-2 max-sm:w-full">
      <PresetGroup label="Preset ranges" range={range} presets={presets} onRange={onRange} today={today} />
      <Popover open={open} onOpenChange={onOpen}>
        <PopoverTrigger asChild>
          <button type="button" aria-label={name} title={name}
            className={`flex size-11 shrink-0 items-center justify-center rounded-lg border border-input ${custom ? SELECTED : "bg-card"}`}>
            <CalendarDays size={16} aria-hidden />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="range"
            captionLayout="dropdown"
            className={MARKER_SELECTED}
            selected={shown}
            numberOfMonths={months}
            // The calendar pulls this back within startMonth and endMonth, so a range ending past today opens on today's month.
            defaultMonth={new Date(end.getFullYear(), end.getMonth() - months + 1)}
            today={toDate(today)}
            disabled={{ before: toDate(FIRST_DAY), after: toDate(today) }}
            startMonth={toDate(FIRST_DAY)}
            endMonth={toDate(today)}
            // Days after today inside a preset's range keep its fill, so the range reads as running to its end.
            classNames={{ disabled: "text-muted-foreground opacity-50 data-[selected=true]:opacity-100 data-[selected=true]:[&>button]:opacity-100! [&>button]:text-muted-foreground/70!" }}
            // onSelect makes `selected` controlled; without it the calendar keeps its own range and redraws it on each click.
            onSelect={(_, day) => pick(day)}
          />
          <p aria-live="polite" className="px-4 pb-3 text-[13px] text-muted-foreground">{first ? "Pick an end day" : "Pick a start day"}</p>
        </PopoverContent>
      </Popover>
    </div>
  );
}
