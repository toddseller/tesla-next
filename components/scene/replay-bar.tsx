"use client";

import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { type FocusEvent, type ReactNode, useRef, useState } from "react";

import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FIRST_DAY, shiftDay, TIME_ZONE } from "@/lib/scene/replay";

// Replay seconds per real second; the page starts at the default, real time.
export const SPEEDS = [
  { value: 1, label: "Real time" },
  { value: 60, label: "1 min/s" },
  { value: 600, label: "10 min/s" },
  { value: 3600, label: "60 min/s" },
];
export const DEFAULT_SPEED = 1;

const clock = new Intl.DateTimeFormat("en-US", { timeZone: TIME_ZONE, hour: "numeric", minute: "2-digit" });
const MINUTE = 60000;

// The calendar works in the viewer's own dates; a site day "yyyy-MM-dd" is shown as that same calendar date.
const toDate = (day: string) => {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const toDay = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const dayLabel = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });

const IconButton = ({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: ReactNode }) => (
  <button type="button" aria-label={label} title={label} onClick={onClick} disabled={disabled}
    className="p-2 rounded-full text-gray-200 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent">
    {children}
  </button>
);

// Keyboard focus only: a mouse click leaves focus on a button, which would hold the bar for good.
const focusVisible = (element: Element) => {
  try {
    return element.matches(":focus-visible");
  } catch {
    return false;
  }
};

type Props = {
  live: boolean;
  day: string;
  today: string;
  time: number;
  span: { start: number; end: number };
  playing: boolean;
  speed: number;
  onDay: (day: string) => void;
  onTime: (time: number) => void;
  onPlay: () => void;
  onSpeed: (speed: number) => void;
  onLive: () => void;
  onHold?: (on: boolean) => void;
};

// onHold(true) and onHold(false) bracket each use that must keep the bar shown: an open date picker, a focused speed
// menu, a held scrubber, and keyboard focus.
const ReplayBar = ({ live, day, today, time, span, playing, speed, onDay, onTime, onPlay, onSpeed, onLive, onHold = () => {} }: Props) => {
  const keyboard = useRef(false);
  const onFocus = (event: FocusEvent<HTMLDivElement>) => {
    // WebKit counts a clicked select as keyboard focus; the speed menu holds on its own.
    if (keyboard.current || event.target.tagName === "SELECT" || !focusVisible(event.target)) return;
    keyboard.current = true;
    onHold(true);
  };
  const onBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (!keyboard.current || event.currentTarget.contains(event.relatedTarget)) return;
    keyboard.current = false;
    onHold(false);
  };
  // The speed menu holds from focus until a speed is picked, since a mouse leaves it focused after.
  const menu = useRef(false);
  const holdMenu = (on: boolean) => {
    if (menu.current === on) return;
    menu.current = on;
    onHold(on);
  };
  // Released wherever the drag ends, on the bar or off it.
  const onScrub = () => {
    onHold(true);
    const release = () => {
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
      onHold(false);
    };
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
  };
  const [picking, setPicking] = useState(false);
  const onPicking = (open: boolean) => {
    setPicking(open);
    onHold(open);
  };
  return (
    <div className="flex flex-col gap-1 px-3 py-2 lg:pt-8 text-gray-200 bg-[#0b1220] lg:bg-transparent lg:bg-[linear-gradient(to_top,rgba(7,11,20,0.92),rgba(7,11,20,0.85)_65%,rgba(7,11,20,0))]" data-part="replay-bar" onFocus={onFocus} onBlur={onBlur}>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <IconButton label="Previous day" onClick={() => onDay(shiftDay(day, -1))} disabled={day <= FIRST_DAY}>
          <ChevronLeft size={16} />
        </IconButton>
        <Popover open={picking} onOpenChange={onPicking}>
          <PopoverTrigger asChild>
            <button type="button" aria-label="Day" className="min-w-[13.5rem] rounded-sm border border-white/20 px-2 py-1 text-left text-sm text-gray-200">
              {dayLabel.format(toDate(day))}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={toDate(day)}
              defaultMonth={toDate(day)}
              disabled={{ before: toDate(FIRST_DAY), after: toDate(today) }}
              onSelect={(date) => {
                if (!date) return;
                onDay(toDay(date));
                onPicking(false);
              }}
            />
          </PopoverContent>
        </Popover>
        <IconButton label="Next day" onClick={() => onDay(shiftDay(day, 1))} disabled={day >= today}>
          <ChevronRight size={16} />
        </IconButton>
        <IconButton label={playing ? "Pause" : "Play"} onClick={onPlay}>
          {playing ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
        </IconButton>
        <select aria-label="Speed" value={speed}
          onChange={(event) => {
            onSpeed(Number(event.target.value));
            holdMenu(false);
          }}
          onFocus={() => holdMenu(true)} onBlur={() => holdMenu(false)}
          className="appearance-none bg-transparent text-sm text-gray-300 rounded-sm border border-white/20 px-2 py-1">
          {SPEEDS.map(({ value, label }) => <option key={value} value={value} className="bg-[#0b1220]">{label}</option>)}
        </select>
        <button type="button" onClick={onLive} aria-pressed={live}
          className={`ml-auto text-xs font-semibold tracking-wider rounded-full px-3 py-1 border ${live ? "bg-[rgb(204,0,0)] border-transparent text-white" : "border-white/40 text-gray-200 hover:bg-white/10"}`}>
          LIVE
        </button>
      </div>
      <div className="flex items-center gap-3">
        {/* A visible track and thumb on the dark bar; WebKit's own track is dark gray. */}
        <input type="range" aria-label="Time"
          className="flex-1 h-1 appearance-none rounded-full bg-white/25 cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-0"
          min={span.start} max={span.end - MINUTE} step={MINUTE} value={time}
          onChange={(event) => onTime(Number(event.target.value))} onPointerDown={onScrub} />
        <span className="text-sm tabular-nums w-[4.5rem] text-right" data-part="replay-time">{clock.format(time)}</span>
      </div>
    </div>
  );
};

export default ReplayBar;
