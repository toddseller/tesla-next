"use client";

import { useRouter } from "next/navigation";

import { BackupSection } from "@/components/impact/backup-section";
import { CarChargingSection } from "@/components/impact/car-charging";
import { SelfPowered, SolarOffset } from "@/components/impact/sections";
import { LEAD, Lead } from "@/components/lead";
import { ReadingsNote, ReadingsSwitch } from "@/components/readings-switch";
import { RangeControls } from "@/components/solar/range-controls";
import { useReload } from "@/components/solar/use-reload";
import { UnshownNotice } from "@/components/unshown-notice";
import { useLiveStream } from "@/components/use-live-stream";
import type { BackupHistory } from "@/lib/backup";
import { backupParam, followedYear } from "@/lib/backup-years";
import type { CarCharging } from "@/lib/car-charging";
import type { ImpactFigures } from "@/lib/impact";
import { impactLead } from "@/lib/lead";
import { type Readings, reachesCorrected, withReadings } from "@/lib/meter";
import { siteToday } from "@/lib/scene/replay";
import { datesLabel, impactPresets, type Range, rangeIncludes } from "@/lib/solar/ranges";

type Props = {
  range: Range; figures: ImpactFigures; today: string; backup: BackupHistory; backupYear: Range; charging: CarCharging | null; readings?: Readings; unshown?: boolean;
  // The year-earlier days' self-powered share, or null when there are none to compare.
  before?: number | null;
};

export function ImpactPage({ range, figures, today, backup, backupYear, charging, readings = "corrected", unshown = false, before = null }: Props) {
  const router = useRouter();
  const follows = followedYear(range, today) !== null;
  // Every address the page goes to keeps the readings it shows, unless it asks for others.
  const address = (next: Range, year = backupYear, shown = readings) => {
    // A followed year is the page's, not a choice, so no other range inherits it.
    const backupValue = follows || followedYear(next, today) ? null : backupParam(year, today);
    const { start, end } = next;
    return withReadings(`/impact?start=${start}&end=${end}${backupValue ? `&backup=${backupValue}` : ""}`, shown);
  };
  const corrected = reachesCorrected(range.start, range.end);
  const [shown, reload] = useReload(address(range), figures);
  const [shownCharging, reloadCharging] = useReload(address(range), charging);
  const reloadFor = (date: string) => {
    if (!rangeIncludes(range, date)) return;
    const dates = `start_date=${range.start}&end_date=${range.end}`;
    void reload(withReadings(`/api/impact?${dates}`, readings), (body: { data: ImpactFigures }) => body.data);
    void reloadCharging(withReadings(`/api/car-charging?${dates}`, readings), (body: { data: CarCharging | null }) => body.data);
  };
  const [shownBackup, reloadBackup] = useReload(address(range), backup);
  const backupValue = backupParam(backupYear, today);
  const reloadYear = () => void reloadBackup(`/api/backup${backupValue ? `?year=${backupValue}` : ""}`, (body: { data: BackupHistory }) => body.data);
  useLiveStream({
    onTotals: reloadFor, onOutages: reloadYear, onSiteState: reloadYear,
    onReopen: () => {
      reloadFor(siteToday());
      reloadYear();
    },
  });

  const lead = impactLead(range, today, shown.self_powered_percentage, before);
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[22px] font-semibold">Impact</h1>
        <div className="flex flex-wrap items-end gap-2 max-sm:order-last max-sm:w-full">
          {corrected && <ReadingsSwitch readings={readings} addresses={{ corrected: address(range, backupYear, "corrected"), tesla: address(range, backupYear, "tesla") }} />}
          <RangeControls today={today} range={range} presets={impactPresets(today)} onRange={(next) => router.push(address(next), { scroll: false })} />
        </div>
        {unshown && <UnshownNotice range={range} />}
        <Lead className={`${LEAD} -mt-2 basis-full`} text={lead} />
      </div>
      <section aria-labelledby="impact-title" className="flex flex-col gap-6 rounded-[10px] border bg-card p-4 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="impact-title" className="font-semibold">{datesLabel(range, "long")}</h2>
          <span className="text-sm text-muted-foreground">Where the house&apos;s energy came from</span>
        </div>
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
          <SelfPowered figures={shown} />
          <SolarOffset figures={shown} />
        </div>
        {corrected && <ReadingsNote readings={readings} />}
      </section>
      {shownCharging && <CarChargingSection charging={shownCharging} range={range} />}
      <BackupSection history={shownBackup} year={backupYear} today={today} follows={follows} onYear={(year) => router.replace(address(range, year), { scroll: false })} />
    </div>
  );
}
