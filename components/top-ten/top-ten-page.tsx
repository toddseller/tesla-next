"use client";

import { useReload } from "@/components/solar/use-reload";
import { dayEntries, monthEntries, solarEntries } from "@/components/top-ten/entries";
import { Ranking } from "@/components/top-ten/ranking";
import { useLiveStream } from "@/components/use-live-stream";
import type { TopTen } from "@/lib/top-ten";

export function TopTenPage({ topTen: served, today }: { topTen: TopTen; today: string }) {
  const [[{ solar }, { net_grid: days }, { to_grid_months: months }], reload] = useReload("/top", served);
  const reloadAll = () => void reload("/api/top-ten", (body: { data: TopTen }) => body.data);
  useLiveStream({ onTotals: reloadAll, onReopen: reloadAll });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-0.5">
        <h1 className="text-[22px] font-semibold">Top Ten</h1>
        <p className="text-sm text-muted-foreground">The records since October 2021, and the days and months closest to them</p>
      </div>
      <Ranking record="Best solar day" chart="Top ten solar days" subtitle="Most solar generated in a day" flow="solar" entries={solarEntries(solar)} today={today} />
      <Ranking record="Best export day" chart="Top ten export days" subtitle="Most energy sent to PG&E in a day" flow="grid" entries={dayEntries(days)} today={today} />
      <Ranking record="Best export month" chart="Top ten export months" subtitle="Most energy sent to PG&E in a month" flow="grid" entries={monthEntries(months)} today={today} />
      <p className="text-[13px] text-muted-foreground">
        Exports are net of imports. Equal figures rank the newer date first. Days before April 27, 2026 use PG&amp;E&apos;s meter
        readings where they exist. Every date opens its day or month on the Solar page.
      </p>
    </div>
  );
}
