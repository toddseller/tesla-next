"use client";

import { useRouter } from "next/navigation";

import { ReadingsNote, ReadingsSwitch } from "@/components/readings-switch";
import { presetStyle } from "@/components/solar/range-controls";
import { useReload } from "@/components/solar/use-reload";
import { dayEntries, monthEntries, outageEntries, solarEntries } from "@/components/top-ten/entries";
import { Ranking } from "@/components/top-ten/ranking";
import { useLiveStream } from "@/components/use-live-stream";
import { type Readings, withReadings } from "@/lib/meter";
import type { TopTen } from "@/lib/top-ten";

const CHOICES = [{ label: "Without VPP events", withVpp: false }, { label: "With VPP events", withVpp: true }];
// The page's address, or its route's, for a VPP choice and a view of the readings.
const at = (path: string, withVpp: boolean, readings: Readings) => withReadings(withVpp ? `${path}?vpp=with` : path, readings);

export function TopTenPage({ topTen: served, withVpp, today, readings = "corrected" }: { topTen: TopTen; withVpp: boolean; today: string; readings?: Readings }) {
  const router = useRouter();
  const [[{ solar }, { net_grid: days }, { to_grid_months: months }, { outages }], reload] = useReload(at("/top", withVpp, readings), served);
  const reloadAll = () => void reload(at("/api/top-ten", withVpp, readings), (body: { data: TopTen }) => body.data);
  useLiveStream({ onTotals: reloadAll, onOutages: reloadAll, onReopen: reloadAll });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-[22px] font-semibold">Top Ten</h1>
          <p className="text-sm text-muted-foreground">The records since October 2021, and the days and months closest to them</p>
        </div>
        <div className="flex flex-wrap gap-2 max-sm:w-full">
        <ReadingsSwitch readings={readings} addresses={{ corrected: at("/top", withVpp, "corrected"), tesla: at("/top", withVpp, "tesla") }} />
        <div role="group" aria-label="VPP event days in the export rankings" className="grid grid-cols-2 gap-0.5 rounded-lg border border-input bg-card p-[3px] max-sm:w-full sm:flex">
          {CHOICES.map((choice) => (
            <button key={choice.label} type="button" aria-pressed={choice.withVpp === withVpp} onClick={() => router.replace(at("/top", choice.withVpp, readings))} className={presetStyle(choice.withVpp === withVpp)}>
              {choice.label}
            </button>
          ))}
        </div>
        </div>
      </div>
      <Ranking record="Best solar day" chart="Top ten solar days" subtitle="Most solar generated in a day" flow="solar" entries={solarEntries(solar)} today={today} />
      <Ranking record="Best export day" chart="Top ten export days" subtitle="Most energy sent to PG&E in a day" flow="grid" entries={dayEntries(days)} today={today} />
      <Ranking record="Best export month" chart="Top ten export months" subtitle="Most energy sent to PG&E in a month" flow="grid" entries={monthEntries(months)} today={today} />
      <Ranking record="Longest outage" chart="Top ten outages" subtitle="Longest time off the grid, on the Powerwalls and solar" flow="powerwall" entries={outageEntries(outages)} today={today} />
      <p className="text-[13px] text-muted-foreground">
        Exports are net of imports. Equal figures rank the newer date first. Days before April 27, 2026 use PG&amp;E&apos;s meter
        readings where they exist. Every date opens its day or month on the Solar page. Outages count from October 23, 2021, the day after the system was approved to run, and last a minute or more, Go Off-Grid tests left out. The export rankings {withVpp ? "include" : "leave out"} VPP
        event days, when Tesla discharged the Powerwalls to the grid for PG&amp;E.
      </p>
      <ReadingsNote readings={readings} />
    </div>
  );
}
