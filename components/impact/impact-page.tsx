"use client";

import { useRouter } from "next/navigation";

import { SelfPowered, SolarOffset } from "@/components/impact/sections";
import { RangeControls } from "@/components/solar/range-controls";
import { useReload } from "@/components/solar/use-reload";
import { useLiveStream } from "@/components/use-live-stream";
import type { ImpactFigures } from "@/lib/impact";
import { siteToday } from "@/lib/scene/replay";
import { datesLabel, impactPresets, type Range, rangeIncludes } from "@/lib/solar/ranges";

const address = ({ start, end }: Range) => `/impact?start=${start}&end=${end}`;

export function ImpactPage({ range, figures, today }: { range: Range; figures: ImpactFigures; today: string }) {
  const router = useRouter();
  const [shown, reload] = useReload(address(range), figures);
  const reloadFor = (date: string) => {
    if (rangeIncludes(range, date)) void reload(`/api/impact?start_date=${range.start}&end_date=${range.end}`, (body: { data: ImpactFigures }) => body.data);
  };
  useLiveStream({ onTotals: reloadFor, onReopen: () => reloadFor(siteToday()) });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[22px] font-semibold">Impact</h1>
        <RangeControls range={range} presets={impactPresets(today)} onRange={(next) => router.push(address(next))} />
      </div>
      <section aria-labelledby="impact-title" className="flex flex-col gap-6 rounded-[10px] border bg-card p-4 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="impact-title" className="font-semibold">{datesLabel(range, "long")}</h2>
          <span className="text-sm text-muted-foreground">Where the home&apos;s energy came from</span>
        </div>
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
          <SelfPowered figures={shown} />
          <SolarOffset figures={shown} />
        </div>
      </section>
    </div>
  );
}
