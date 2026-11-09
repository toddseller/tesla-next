"use client";

import Link from "next/link";
import { Fragment, type ReactNode } from "react";

import { PresetGroup } from "@/components/solar/range-controls";
import type { BackupHistory, BackupKind } from "@/lib/backup";
import { stormDays } from "@/lib/backup-figures";
import { backupPresets } from "@/lib/backup-years";
import { siteToday, TIME_ZONE } from "@/lib/scene/replay";
import { address, monthOf, type Range } from "@/lib/solar/ranges";
import { kwh } from "@/lib/true-up/text";

type Props = { history: BackupHistory; year: Range; today: string; onYear: (year: Range) => void };

const KINDS: Record<BackupKind, string> = { outage: "Outage", blip: "Blip", test: "Test", commissioning: "Commissioning" };
const dayDate = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: TIME_ZONE });
const timeOnly = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: TIME_ZONE });
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

type Event = BackupHistory["events"][number];

// The muted line under an outage: its weather, then how low the rebuilt charge went (or how far the batteries fell when
// their start isn't known), then whether solar refilled them.
function detail({ weather, battery }: Event) {
  if (!battery) return null;
  const fell = `the Powerwalls fell ~${kwh(battery.drop_kwh)} kWh`;
  // Under 0.05 kWh reads as 0.0 kWh or ~100%, which says nothing.
  const charge = battery.drop_kwh < 0.05
    ? (battery.complete || battery.drop_kwh > 0 ? null : "no energy data")
    : battery.low_percent !== null
      ? `lowest ~${Math.round(battery.low_percent)}%, ~${kwh(battery.left_kwh!)} kWh${battery.hours_left !== null ? ` and ~${Math.round(battery.hours_left)} h` : ""} left`
      : battery.complete ? fell : `${fell}, from incomplete data`;
  const line = [weather, charge, battery.refilled && "solar refilled the Powerwalls"].filter(Boolean).join(" · ");
  return line ? line[0].toUpperCase() + line.slice(1) : null;
}

function EventRow({ event, length, longest, grouped }: { event: Event; length: number; longest: number; grouped: boolean }) {
  const { start, kind } = event;
  const line = detail(event);
  return (
    <div data-part="event" className={`flex flex-col gap-1 py-2.5 text-sm ${grouped ? "pl-4" : ""}`}>
      <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-4 gap-y-1.5 sm:grid-cols-[13rem_minmax(0,1fr)_7rem_8rem]">
        <Link href={dayLink(start)} className="col-span-3 hover:text-white sm:col-span-1">{(grouped ? timeOnly : dayTime).format(new Date(start))}</Link>
        <span aria-hidden className="h-2 sm:h-2.5">
          <span data-part="duration-bar" className={`block h-full min-w-0.5 rounded-xs ${kind === "outage" ? "bg-powerwall" : "bg-grid/60"}`}
            style={{ width: `${(length / longest) * 100}%` }} />
        </span>
        <span className="text-right font-mono">{duration(length)}</span>
        <span className={`text-[13px] ${kind === "outage" ? "text-powerwall" : "text-muted-foreground"}`}>{KINDS[kind]}</span>
      </div>
      {line && <span data-part="detail" className="text-[13px] text-muted-foreground">{line}</span>}
    </div>
  );
}

const blipsLine = (blips: BackupHistory["summary"]["blips"]) =>
  blips.length === 1
    ? `${blips[0].count} blip${blips[0].count === 1 ? "" : "s"}`
    : `Blips: ${blips.map(({ label, count }) => `${label} ${count}`).join(" · ")}`;

// When the grid went down and the house ran on its own, for the true-up year picked here, apart from the page's range.
export function BackupSection({ history: { summary, events }, year, today, onYear }: Props) {
  const { presets, earlier } = backupPresets(today);
  const lengths = new Map(events.map((e) => [e.start, (Date.parse(e.end) - Date.parse(e.start)) / 1000]));
  const longestEvent = Math.max(...lengths.values());
  const row = (event: Event, grouped: boolean) => <EventRow event={event} length={lengths.get(event.start)!} longest={longestEvent} grouped={grouped} />;
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
        <div className="flex flex-col gap-3">
          <div role="group" aria-label="Outages" className="grid grid-cols-2 gap-2 lg:grid-cols-5 lg:gap-3">
            <Tile label="Outages" value={String(summary.outages)}>a minute or longer</Tile>
            <Tile label="Off the grid" value={`${kwh(summary.seconds / 3600)} h`} />
            <Tile label="Longest" value={duration(summary.longest.seconds)}>
              <Link href={dayLink(summary.longest.start)} className="text-foreground hover:text-white">{dayDate.format(new Date(summary.longest.start))}</Link>
            </Tile>
            <Tile label="House ran on" value={`${kwh(summary.house_kwh)} kWh`}>{`Powerwalls ${kwh(summary.powerwalls_kwh)} · Solar ${kwh(summary.solar_kwh)}`}</Tile>
            <Tile label="Closest call" value={summary.closest ? `~${Math.round(summary.closest.percent)}%` : "—"}>
              {summary.closest && <Link href={dayLink(summary.closest.at)} className="text-foreground hover:text-white">{dayDate.format(new Date(summary.closest.at))}</Link>}
            </Tile>
          </div>
          <p className="text-[13px] text-muted-foreground">{blipsLine(summary.blips)}</p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No outages.</p>
      )}
      {events.length ? (
        <ul aria-label="Backup events" className="flex flex-col border-t">
          {stormDays(events).map(({ group, events: inDay }) => (
            <li key={inDay[0].start} className="border-b">
              {group ? (
                <>
                  <p data-part="storm-day" className="flex flex-wrap items-baseline gap-x-2.5 pt-3 text-sm">
                    <Link href={dayLink(inDay.at(-1)!.start)} className="font-semibold hover:text-white">{dayDate.format(new Date(inDay.at(-1)!.start))}</Link>
                    <span className="text-[13px] text-muted-foreground">
                      {`${group.count} ${inDay.every((e) => e.kind === "outage") ? "outages" : "events"} · ${duration(group.seconds)} off the grid`}
                    </span>
                  </p>
                  {inDay.map((event) => <Fragment key={event.start}>{row(event, true)}</Fragment>)}
                </>
              ) : (
                row(inDay[0], false)
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No backup events.</p>
      )}
      {summary.longest && (
        <p className="text-[13px] text-muted-foreground">
          The ~ figures are worked out from the 5-minute energy data, about 36 kWh from full to empty, since Tesla keeps no history of the
          batteries&apos; charge. Weather is the area&apos;s, around each outage&apos;s start.
        </p>
      )}
    </section>
  );
}
