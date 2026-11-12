"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ReadingsNote, ReadingsSwitch } from "@/components/readings-switch";
import { DayPanel } from "@/components/solar/day-panel";
import { ForecastCard } from "@/components/solar/forecast";
import type { Day } from "@/components/solar/day-view";
import { RangeChart } from "@/components/solar/range-chart";
import { RangeControls } from "@/components/solar/range-controls";
import { useReload } from "@/components/solar/use-reload";
import { useLiveStream } from "@/components/use-live-stream";
import type { ForecastCard as Card } from "@/lib/forecast";
import { type Readings, reachesCorrected, withReadings } from "@/lib/meter";
import type { RangeItem } from "@/lib/range";
import { siteToday } from "@/lib/scene/replay";
import { address, datesLabel, isDaily, presets, type Range, rangeIncludes } from "@/lib/solar/ranges";

// Parsed during the server's render, where a throw would fail the whole page.
const modifiedOf = (status: string | null): string | null => {
  try {
    return status ? (JSON.parse(status).modified ?? null) : null;
  } catch {
    return null;
  }
};

const rangeUrl = ({ start, end }: Range) => `/api/range?start_date=${start}&end_date=${end}`;
const rangeData = (body: { data: RangeItem[] }) => body.data;

type Props = {
  range: Range;
  items: RangeItem[];
  today: string;
  initialStatus: string | null;
  day?: { data: Day; strip: { range: Range; items: RangeItem[] } } | null;
  forecast?: Card | null;
  readings?: Readings;
};

export function SolarPage({ range, items, today, initialStatus, day, forecast, readings = "corrected" }: Props) {
  const router = useRouter();
  // Every address the page goes to keeps the readings it shows; reloads ask for them too.
  const at = (shown: Range, open?: string | null) => withReadings(address(shown, open), readings);
  const both = (shown: Range, open?: string | null) => ({ corrected: address(shown, open), tesla: withReadings(address(shown, open), "tesla") });
  const [modified, setModified] = useState(() => modifiedOf(initialStatus));
  const [bars, reloadBars] = useReload(at(range), items);
  const [shownDay, reloadDay] = useReload(day ? `${readings}:${day.data.date}` : "", day?.data);
  const [strip, reloadStrip] = useReload(day ? at(day.strip.range) : "", day?.strip.items ?? []);
  // Keyed like the bars, so a page the server renders anew shows its own figures over an earlier reload.
  const [card, reloadCard] = useReload(`${at(range)}|${today}`, forecast ?? null);

  // Reloads only what the given date can change: the open day, the strip's days, or the range's bars.
  const reloadFor = (date: string) => {
    if (!day) {
      if (rangeIncludes(range, date)) void reloadBars(withReadings(rangeUrl(range), readings), rangeData);
      if (forecast && date === siteToday()) void reloadCard("/api/forecast", (body: { data: Card }) => body.data);
      return;
    }
    if (date === day.data.date) void reloadDay(withReadings(`/api/intervals?date=${date}`, readings), (body: Day) => body);
    if (rangeIncludes(day.strip.range, date)) void reloadStrip(withReadings(rangeUrl(day.strip.range), readings), rangeData);
  };
  useLiveStream({
    onStatus: (status) => {
      if (typeof status.modified === "string") setModified(status.modified);
    },
    onTotals: reloadFor,
    onReopen: () => reloadFor(siteToday()),
  });

  const corrected = reachesCorrected(range.start, range.end);
  if (day && shownDay) {
    return (
      <DayPanel range={range} day={shownDay} strip={strip} today={today} modified={modified} readings={readings}
        readingsAt={reachesCorrected(day.strip.range.start, day.strip.range.end) ? both(range, shownDay.date) : null}
        onDay={(next) => router.replace(at(range, next), { transitionTypes: [next > shownDay.date ? "day-next" : "day-previous"] })} />
    );
  }
  return (
    <div className="flex flex-col gap-5">
      {card && <ForecastCard card={card} />}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[22px] font-semibold">Solar by date range</h1>
        <div className="flex flex-wrap items-center gap-2 max-sm:w-full">
          {corrected && <ReadingsSwitch readings={readings} addresses={both(range)} />}
          <RangeControls today={today} range={range} presets={presets(today)} onRange={(next) => router.push(at(next), { scroll: false })} />
        </div>
      </div>
      <section aria-labelledby="range-title" className="flex flex-col gap-4 rounded-[10px] border bg-card p-4 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="range-title" className="font-semibold">{datesLabel(range, "long")}</h2>
          <span className="text-sm text-muted-foreground">
            {isDaily(range) ? "Daily · select a day for its 5-minute detail" : "Monthly · select a month for its days"}
          </span>
        </div>
        <RangeChart key={at(range)} items={bars} range={range} onOpenDay={(next) => router.push(at(range, next))} onOpenRange={(next) => router.push(at(next), { scroll: false })} />
        {corrected && <ReadingsNote readings={readings} />}
      </section>
    </div>
  );
}
