"use client";

import Link from "next/link";
import { useState } from "react";
import { Line, LineChart, XAxis, YAxis } from "recharts";

import { Doorway } from "@/components/home/doorway";
import { DetailsBox, type Hover } from "@/components/home/chart-details";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { type recordTabs, setAgo, tenthTick, valueTicks, yearTicks } from "@/lib/home/records";
import { address, monthOf } from "@/lib/solar/ranges";

type Props = { today: string; tabs: ReturnType<typeof recordTabs> };

const longDay = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
const longMonth = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
const WORDS = ["No", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"];

const when = (at: string) => (at.length === 7 ? longMonth.format(Date.parse(`${at}-01`)) : longDay.format(Date.parse(at)));
const link = (at: string) => (at.length === 7 ? address(monthOf(`${at}-01`)) : address(monthOf(at), at));
const misses = (count: number, unit: string) =>
  count === 0 ? `No ${unit} since has come within 2% of it.` : `${WORDS[count] ?? count} ${unit}${count === 1 ? "" : "s"} since ${count === 1 ? "has" : "have"} come within 2% of it.`;

// In recordTabs' order.
const TABS = [
  { name: "Best solar day", unit: "kWh", per: "day", color: "text-solar", stroke: "var(--color-solar)" },
  { name: "Most sent to PG&E in a day", unit: "kWh", per: "day", color: "", stroke: "var(--color-grid)" },
  { name: "Most sent to PG&E in a month", unit: "kWh", per: "month", color: "", stroke: "var(--color-grid)" },
  { name: "Longest outage", unit: "hours", per: "outage", color: "text-powerwall", stroke: "var(--color-powerwall)" },
];

export function Records({ today, tabs }: Props) {
  const [chosen, setChosen] = useState(0);
  const tab = { ...TABS[chosen], ...tabs[chosen] };
  const record = tab.record;
  const rising = tab.steps;
  const chart = rising.length ? [...rising, { at: today, value: rising.at(-1)!.value }].map((p) => ({ t: Date.parse(p.at.length === 7 ? `${p.at}-01` : p.at), value: p.value })) : [];

  const years = chart.length ? yearTicks(chart[0].t, chart.at(-1)!.t) : [];
  const values = valueTicks(chart.map((p) => p.value));

  return (
    <section aria-labelledby="records" className="flex flex-col gap-8">
      <h2 id="records" className="text-[64px] leading-[0.9] font-semibold tracking-[-0.04em] md:text-[112px]">Records</h2>
      <div role="tablist" aria-label="Record" className="grid grid-cols-2 gap-0.5 rounded-lg border border-input bg-card p-[3px] sm:flex sm:self-start">
        {TABS.map((t, i) => (
          <button key={t.name} type="button" role="tab" id={`record-tab-${i}`} aria-selected={i === chosen} aria-controls="record-panel" onClick={() => setChosen(i)}
            className={`min-h-11 rounded-md px-3 text-sm font-medium text-balance ${i === chosen ? "bg-secondary text-white shadow-[inset_0_-2px_0_var(--primary)]" : "text-muted-foreground hover:text-foreground"}`}>
            {t.name}
          </button>
        ))}
      </div>
      <div role="tabpanel" id="record-panel" aria-labelledby={`record-tab-${chosen}`} className="grid gap-x-14 gap-y-8 md:grid-cols-[minmax(0,1fr)_22rem]">
        {record ? (
          <div className="flex flex-col gap-3">
            <p className="font-mono text-[13px] text-foreground">{`${record.value.toFixed(1)} ${tab.unit} ${tab.per === "month" ? "in" : "on"} ${when(record.at)} · ${setAgo(record.at, today)}`}</p>
            <ChartContainer config={{}} className="aspect-auto h-48 w-full">
              <LineChart data={chart} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <XAxis dataKey="t" type="number" domain={["dataMin", "dataMax"]} ticks={years} tickFormatter={(t) => String(new Date(t).getUTCFullYear())} tickLine={false} axisLine={false} />
                <YAxis domain={[values[0], values.at(-1)!]} ticks={values} tickFormatter={tenthTick} tickLine={false} axisLine={false} width={48} />
                <ChartTooltip content={<RecordDetails unit={tab.unit} per={tab.per} />} />
                <Line dataKey="value" type="stepAfter" stroke={tab.stroke} strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ChartContainer>
            <p className="text-[15px] text-pretty text-muted-foreground">{misses(tab.near, tab.per)}</p>
          </div>
        ) : (
          <p className="text-[15px] text-muted-foreground">{tab.per === "outage" ? "The house hasn't been off the grid since October 2021." : `No ${tab.per}s with figures yet.`}</p>
        )}
        <ol className="m-0 flex list-none flex-col p-0">
          {tab.top.map((row, i) => (
            <li key={i}>
              <Link href={link(row.at)} className="grid min-h-11 grid-cols-[1.75rem_minmax(0,1fr)_auto] items-baseline gap-3 border-t py-2 text-sm hover:bg-secondary/40">
                <span className={`font-mono ${i ? "text-muted-foreground" : "font-semibold"}`}>{i + 1}</span>
                <span>{when(row.at)}</span>
                <b className={`font-mono ${i ? "" : tab.color}`}>{row.value.toFixed(1)}</b>
              </Link>
            </li>
          ))}
        </ol>
      </div>
      <Doorway href="/top">Every top ten</Doorway>
    </section>
  );
}

type RecordHover = Hover<{ t: number; value: number }> & { unit: string; per: string };
export function RecordDetails({ active, payload, unit, per }: RecordHover) {
  const row = payload?.[0]?.payload;
  if (!active || !row) return null;
  return <DetailsBox title={(per === "month" ? longMonth : longDay).format(row.t)} details={[{ name: "Record", value: `${row.value.toFixed(1)} ${unit}` }]} />;
}
