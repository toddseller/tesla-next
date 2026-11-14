"use client";

import { CalendarDays } from "lucide-react";
import { useState } from "react";

import { INPUT } from "@/components/admin/styles";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { longDate, toDate, toDay } from "@/lib/calendar-dates";

type Props = { name: string; label: string; first: string; last: string; marked?: string[]; value?: string };

// A day picked on the site's Calendar, from first to last, posted with the form as `name`. The server checks the same
// limits; this only keeps the owner from picking a day it would refuse.
export function DayField({ name, label, first, last, marked = [], value }: Props) {
  const [day, setDay] = useState<string | null>(value || null);
  const [open, setOpen] = useState(false);
  const shown = day ? longDate(day, true) : "Pick a day";
  return (
    <div className="flex flex-col gap-1 text-xs text-muted-foreground">
      <span aria-hidden="true">{label}</span>
      <input type="hidden" name={name} value={day ?? ""} />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button type="button" aria-label={`${label}, ${shown}`} className={`${INPUT} inline-flex w-60 items-center justify-between gap-2 text-left font-sans`}>
            {shown}
            <CalendarDays size={16} className="shrink-0 text-muted-foreground" aria-hidden />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" selected={day ? toDate(day) : undefined} defaultMonth={toDate(day ?? last)}
            startMonth={toDate(first)} endMonth={toDate(last)} disabled={{ before: toDate(first), after: toDate(last) }}
            modifiers={{ marked: marked.map(toDate) }} modifiersClassNames={{ marked: "shadow-[inset_0_-2px_0_var(--color-powerwall)]" }}
            onSelect={(date) => {
              if (!date) return;
              setDay(toDay(date));
              setOpen(false);
            }} />
        </PopoverContent>
      </Popover>
    </div>
  );
}
