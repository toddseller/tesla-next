"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { PTO as FIRST, shiftDay } from "@/lib/scene/replay";
import { address, monthOf } from "@/lib/solar/ranges";

const DAY_MS = 86_400_000;
const longDay = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });

export function PickADay({ today }: { today: string }) {
  const router = useRouter();
  const [day, setDay] = useState("");
  const [refused, setRefused] = useState(false);
  const open = (to: string) => router.push(address(monthOf(to), to));
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const inSpan = day >= FIRST && day <= today;
    setRefused(!inSpan);
    if (inSpan) open(day);
  };
  const span = Math.round((Date.parse(today) - Date.parse(FIRST)) / DAY_MS) + 1;

  return (
    <section aria-labelledby="pick" className="flex flex-wrap items-end justify-between gap-8">
      <div>
        <h2 id="pick" className="text-[28px] font-semibold tracking-[-0.02em]">Pick a day</h2>
        <p className="mt-2 text-[15px] text-muted-foreground">Any of the {span.toLocaleString("en-US")} days since October 22, 2021.</p>
      </div>
      <form noValidate onSubmit={submit} className="flex flex-wrap items-end gap-3 max-sm:w-full max-sm:flex-col max-sm:items-stretch">
        <div className="flex items-end gap-2">
          <label className="flex flex-1 flex-col gap-1.5 text-[13px] text-muted-foreground">
            Date
            <input type="date" min={FIRST} max={today} value={day} onChange={(event) => setDay(event.target.value)}
              className="h-11 rounded-md border border-input bg-input/30 px-2.5 font-mono text-sm text-foreground [color-scheme:dark]" />
          </label>
          <button type="submit" className="h-11 rounded-md border border-input bg-input/30 px-4 text-sm font-medium text-foreground">Go</button>
        </div>
        <button type="button" onClick={() => open(shiftDay(FIRST, Math.floor(Math.random() * span)))} className="h-11 rounded-md bg-foreground px-4 text-sm font-medium text-background">
          Random day
        </button>
        {refused && <p role="alert" className="w-full text-[13px] text-destructive">Pick a day from {longDay.format(Date.parse(FIRST))} to {longDay.format(Date.parse(today))}.</p>}
      </form>
    </section>
  );
}
