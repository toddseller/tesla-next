"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { PresetGroup } from "@/components/solar/range-controls";
import type { BackupHistory, BackupKind } from "@/lib/backup";
import { backupPresets } from "@/lib/backup-years";
import { siteToday, TIME_ZONE } from "@/lib/scene/replay";
import { address, monthOf, type Range } from "@/lib/solar/ranges";
import { kwh } from "@/lib/true-up/text";

type Props = { history: BackupHistory; year: Range; today: string; onYear: (year: Range) => void };

const KINDS: Record<BackupKind, string> = { outage: "Outage", blip: "Blip", test: "Test", commissioning: "Commissioning" };
const dayDate = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: TIME_ZONE });
const dayTime = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: TIME_ZONE });

const dayLink = (start: string) => {
  const day = siteToday(Date.parse(start));
  return address(monthOf(day), day);
};

export function duration(seconds: number) {
  const s = Math.floor(seconds);
  if (s < 60) return `${s} s`;
  if (s < 3600) return `${Math.floor(s / 60)} m ${s % 60} s`;
  return `${Math.floor(s / 3600)} h ${Math.floor((s % 3600) / 60)} m`;
}

function Tile({ label, value, children }: { label: string; value: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border p-3 sm:p-4">
      <span className="text-[13px] text-muted-foreground">{label}</span>
      <span className="font-mono text-[22px] font-semibold sm:text-[28px]">{value}</span>
      {children && <span className="text-[13px] text-muted-foreground">{children}</span>}
    </div>
  );
}

// When the grid went down and the house ran on its own, for the true-up year picked here, apart from the page's range.
export function BackupSection({ history: { summary, events }, year, today, onYear }: Props) {
  const { presets, earlier } = backupPresets(today);
  const lengths = events.map(({ start, end }) => (Date.parse(end) - Date.parse(start)) / 1000);
  const longestEvent = Math.max(...lengths);
  return (
    <section aria-labelledby="backup" className="flex flex-col gap-5 rounded-[10px] border bg-card p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 id="backup" className="font-semibold">Backup</h2>
          <span className="text-sm text-muted-foreground">When the grid went down and the house ran on its own</span>
        </div>
        <PresetGroup label="Backup years" range={year} presets={presets} earlier={earlier} onRange={onYear} />
      </div>
      {summary.longest ? (
        <div role="group" aria-label="Outages" className="grid grid-cols-2 gap-2 lg:grid-cols-4 lg:gap-3">
          <Tile label="Outages" value={String(summary.outages)}>a minute or longer</Tile>
          <Tile label="Off the grid" value={`${kwh(summary.seconds / 3600)} h`} />
          <Tile label="Longest" value={duration(summary.longest.seconds)}>
            <Link href={dayLink(summary.longest.start)} className="text-foreground hover:text-white">{dayDate.format(new Date(summary.longest.start))}</Link>
          </Tile>
          <Tile label="House ran on" value={`${kwh(summary.house_kwh)} kWh`}>{`Powerwalls ${kwh(summary.powerwalls_kwh)} · Solar ${kwh(summary.solar_kwh)}`}</Tile>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No outages.</p>
      )}
      {events.length ? (
        <ul aria-label="Backup events" className="flex flex-col border-t">
          {events.map(({ start, kind }, i) => (
            <li key={start} className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-4 gap-y-1.5 border-b py-2.5 text-sm sm:grid-cols-[13rem_minmax(0,1fr)_7rem_8rem]">
              <Link href={dayLink(start)} className="col-span-3 hover:text-white sm:col-span-1">{dayTime.format(new Date(start))}</Link>
              <span aria-hidden className="h-2 sm:h-2.5">
                <span data-part="duration-bar" className={`block h-full min-w-0.5 rounded-xs ${kind === "outage" ? "bg-powerwall" : "bg-grid/60"}`}
                  style={{ width: `${(lengths[i] / longestEvent) * 100}%` }} />
              </span>
              <span className="text-right font-mono">{duration(lengths[i])}</span>
              <span className={`text-[13px] ${kind === "outage" ? "text-powerwall" : "text-muted-foreground"}`}>{KINDS[kind]}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No backup events.</p>
      )}
    </section>
  );
}
