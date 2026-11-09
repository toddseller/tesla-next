"use client";

import { useRouter } from "next/navigation";

import { RangeControls } from "@/components/solar/range-controls";
import { useReload } from "@/components/solar/use-reload";
import { CycleChart } from "@/components/true-up/cycle-chart";
import { CycleList, MeteringNote } from "@/components/true-up/cycle-list";
import { SavingsCard } from "@/components/true-up/savings-card";
import { Tiles } from "@/components/true-up/tiles";
import { useLiveStream } from "@/components/use-live-stream";
import { siteToday } from "@/lib/scene/replay";
import { datesLabel, type Range, rangeIncludes, trueUpPresets } from "@/lib/solar/ranges";
import type { TrueUpYear } from "@/lib/true-up/reads";
import type { Savings } from "@/lib/true-up/savings";
import { type Cost, type Cycle, yearName } from "@/lib/true-up/text";

const address = ({ start, end }: Range) => `/true-up?start=${start}&end=${end}`;
const query = ({ start, end }: Range) => `start_date=${start}&end_date=${end}`;

type Props = { range: Range; years: TrueUpYear[]; cycles: Cycle[]; cost: Cost | null; savings: Savings | null; today: string };

export function TrueUpPage({ range, years, cycles: served, cost: servedCost, savings: servedSavings, today }: Props) {
  const router = useRouter();
  const [cycles, reloadCycles] = useReload(address(range), served);
  const [cost, reloadCost] = useReload(address(range), servedCost);
  const [savings, reloadSavings] = useReload(address(range), servedSavings);
  const year = years.find((y) => y.start_date === range.start && y.end_date === range.end) ?? null;
  // A true-up year's last cycle runs past September 30, so the days that count are the cycles', not the range's.
  const days = cycles.length ? { start: cycles[0].first_day, end: cycles.at(-1)!.last_day } : range;
  const reloadFor = (date: string) => {
    if (!rangeIncludes(days, date)) return;
    void reloadCycles(`/api/cycles?${query(range)}`, (body: { data: Cycle[] }) => body.data);
    if (!year) return;
    void reloadCost(`/api/true-up-cost?${query(range)}`, (body: { data: Cost }) => body.data);
    void reloadSavings(`/api/true-up-savings?${query(range)}`, (body: { data: Savings | null }) => body.data);
  };
  useLiveStream({ onTotals: reloadFor, onReopen: () => reloadFor(siteToday()) });
  const { presets, earlier } = trueUpPresets(years);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-[22px] font-semibold">True-Up Tracker</h1>
          <p className="text-sm text-muted-foreground">Grid energy by PG&amp;E billing cycle</p>
        </div>
        <RangeControls range={range} presets={presets} earlier={earlier} onRange={(next) => router.push(address(next))} />
      </div>
      <Tiles cycles={cycles} cost={year && cost} year={year} today={today} />
      <MeteringNote cycles={cycles} />
      {year && savings && <SavingsCard savings={savings} season={cost?.vpp ?? null} current={year.current} />}
      <section aria-labelledby="cycle-chart" className="flex flex-col gap-3.5 rounded-[10px] border bg-card px-4 py-5 sm:px-6">
        <h2 id="cycle-chart" className="font-semibold">{year ? yearName(year.label) : datesLabel(range, "short")} by billing cycle</h2>
        <CycleChart cycles={cycles} cost={year && cost} oneYear={Boolean(year)} />
      </section>
      <section aria-labelledby="cycle-list" className="flex flex-col gap-3 rounded-[10px] border bg-card px-4 py-5 sm:px-6">
        <h2 id="cycle-list" className="font-semibold">Billing cycles</h2>
        <CycleList cycles={cycles} />
      </section>
    </div>
  );
}
