"use client";

import { useEffect, useState } from "react";

import { Doorway } from "@/components/home/doorway";
import { type Day, Figure, TodayTotals } from "@/components/home/today";
import { useLiveStream } from "@/components/use-live-stream";
import { siteToday } from "@/lib/scene/replay";
import { viewSummary } from "@/lib/solar/day-views";
import { address, monthOf } from "@/lib/solar/ranges";

type Totals = Pick<Day, "date" | "totals" | "vehicle_data">;

// The browser fetches today's totals, so the page still renders from the live status alone.
export function TodaySoFar() {
  const [day, setDay] = useState<Totals | null>(null);
  const load = async () => {
    try {
      const response = await fetch(`/api/intervals?date=${siteToday()}`);
      if (!response.ok) throw new Error(`/api/intervals answered ${response.status}`);
      const { date, totals, vehicle_data }: Day = await response.json();
      setDay({ date, totals, vehicle_data });
    } catch (error) {
      console.error(error);
    }
  };
  useEffect(() => void load(), []); // eslint-disable-line react-hooks/exhaustive-deps -- once, on arrival
  // After a sleep the stream reopens, and past midnight today is a new day.
  useLiveStream({ onTotals: (date) => date === siteToday() && void load(), onReopen: () => void load() });
  if (!day) return null;
  const made = viewSummary("solar", day.totals, { vehicleData: day.vehicle_data }).headlines[0].value.toFixed(1);

  return (
    <section aria-labelledby="today-so-far" className="mt-6 flex flex-col gap-5">
      <h2 id="today-so-far" className="text-sm font-medium text-muted-foreground">Today so far</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-x-4 gap-y-5">
        <Figure value={made} unit="kWh" label="generated" className="text-solar" />
        <TodayTotals day={day} />
      </div>
      <Doorway href={address(monthOf(day.date), day.date)}>Today, hour by hour</Doorway>
    </section>
  );
}
