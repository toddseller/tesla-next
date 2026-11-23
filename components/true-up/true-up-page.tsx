"use client";

import { useRouter } from "next/navigation";

import { FirstView } from "@/components/count-up";
import { Lead } from "@/components/lead";
import { RangeControls } from "@/components/solar/range-controls";
import { useReload } from "@/components/solar/use-reload";
import { Term } from "@/components/term";
import { CycleChart } from "@/components/true-up/cycle-chart";
import { CycleList, MeteringNote } from "@/components/true-up/cycle-list";
import { PaybackCard } from "@/components/true-up/payback-card";
import { SavingsCard } from "@/components/true-up/savings-card";
import { Tiles } from "@/components/true-up/tiles";
import { ENTER_MS, useEntering } from "@/components/use-entering";
import { useLiveStream } from "@/components/use-live-stream";
import { siteToday } from "@/lib/scene/replay";
import { datesLabel, type Range, rangeIncludes, trueUpPresets } from "@/lib/solar/ranges";
import type { Payback } from "@/lib/true-up/payback";
import type { TrueUpYear } from "@/lib/true-up/reads";
import type { Savings } from "@/lib/true-up/savings";
import { type Cost, currentHeadline, type Cycle, pastHeadline, startedCycles, totals, yearExplained, yearName } from "@/lib/true-up/text";

const address = ({ start, end }: Range) => `/true-up?start=${start}&end=${end}`;
const query = ({ start, end }: Range) => `start_date=${start}&end_date=${end}`;

type Props = {
  range: Range; years: TrueUpYear[]; cycles: Cycle[]; cost: Cost | null; savings: Savings | null; payback: Payback | null; today: string;
  // For a finished year, the year before's amount due, which its headline compares with.
  before?: { label: string; amount_due: number | null } | null;
  // For a true-up year, solar's share of the house's use over its days so far.
  share?: number | null;
};

export function TrueUpPage({ range, years, cycles: served, cost: servedCost, savings: servedSavings, payback: servedPayback, today, before = null, share = null }: Props) {
  const router = useRouter();
  const [cycles, reloadCycles] = useReload(address(range), served);
  const [cost, reloadCost] = useReload(address(range), servedCost);
  const [savings, reloadSavings] = useReload(address(range), servedSavings);
  const [payback, reloadPayback] = useReload(address(range), servedPayback);
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
  // Payback covers the system's whole life, so today's totals move it whatever range is shown.
  const reloadPaybackFor = (date: string) => {
    if (servedPayback && date === siteToday()) void reloadPayback("/api/payback", (body: { data: Payback | null }) => body.data);
  };
  useLiveStream({
    onTotals: (date) => {
      reloadFor(date);
      reloadPaybackFor(date);
    },
    onReopen: () => {
      reloadFor(siteToday());
      reloadPaybackFor(siteToday());
    },
  });

  // Figures count up only while the page is first seen; a new range's tiles are new, but this isn't a first view.
  const firstView = useEntering(ENTER_MS);
  const projection = year?.current && cost ? currentHeadline(cost, year.label, year.end_date) : null;
  const headline = projection?.headline ?? (year && !year.current && cost ? pastHeadline({ label: year.label, amount_due: cost.amount_due }, before) : null);
  return (
    <FirstView value={firstView}>
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-[22px] font-semibold">
            <Term name="true-up">True-Up</Term> Tracker
          </h1>
          <div className="max-sm:order-last max-sm:w-full">
            <RangeControls today={today} range={range} presets={trueUpPresets(years)} onRange={(next) => router.push(address(next), { scroll: false })} />
          </div>
          {/* A wrapper, since the lead's 46ch cap would otherwise let it sit beside the controls on a wide row. */}
          <div className="-mt-2 flex basis-full flex-col gap-1">
            {headline ? (
              <>
                <Lead text={headline} />
                {projection && <Lead text={projection.line} className="text-sm text-muted-foreground" />}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Grid energy by PG&amp;E billing cycle</p>
            )}
            {year && share !== null && (
              <p className="mt-2 max-w-[62ch] text-[15px] text-pretty text-muted-foreground">
                {yearExplained({ label: year.label, current: year.current, share, net: totals(startedCycles(cycles)).net })}
              </p>
            )}
          </div>
        </div>
        <Tiles cycles={cycles} cost={year && cost} year={year} today={today} />
        <MeteringNote cycles={cycles} />
        {year && savings && <SavingsCard savings={savings} season={cost?.vpp ?? null} current={year.current} />}
        {payback && <PaybackCard payback={payback} today={today} />}
        <section aria-labelledby="cycle-chart" className="flex flex-col gap-3.5 rounded-[10px] border bg-card px-4 py-5 sm:px-6">
          <h2 id="cycle-chart" className="font-semibold">{year ? yearName(year.label) : datesLabel(range, "short")} by billing cycle</h2>
          <CycleChart cycles={cycles} cost={year && cost} oneYear={Boolean(year)} />
        </section>
        <section aria-labelledby="cycle-list" className="flex flex-col gap-3 rounded-[10px] border bg-card px-4 py-5 sm:px-6">
          <h2 id="cycle-list" className="font-semibold">Billing cycles</h2>
          <CycleList cycles={cycles} />
        </section>
      </div>
    </FirstView>
  );
}
