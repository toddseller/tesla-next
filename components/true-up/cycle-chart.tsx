"use client";

import { Area, Bar, CartesianGrid, ComposedChart, Line, ReferenceLine, XAxis, YAxis } from "recharts";

import { AxisTick } from "@/components/solar/axis-tick";
import { riseFrom, roundedRect } from "@/components/solar/range-chart";
import { ENTER_MS, useEntering } from "@/components/use-entering";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { niceAxis, unitOnTopTick } from "@/lib/solar/day-views";
import { type Cost, type Cycle, kwh, runningNet, startedCycles, yearName } from "@/lib/true-up/text";

type Row = { label: string; imported: number | null; exported: number | null; running: number | null; lastYear: number | null; band: [number, number] | null };

const month = (iso: string, withYear: boolean) =>
  new Date(`${iso}T00:00:00Z`).toLocaleString("en-US", { month: "short", timeZone: "UTC" }) + (withYear ? ` '${iso.slice(2, 4)}` : "");

// One slot per cycle: with one true-up year, every cycle of it, so last year's line and the band run on under the cycles
// still to come; otherwise the started cycles alone. Exports go below zero.
export function chartRows(cycles: Cycle[], cost: Cost | null, oneYear: boolean): Row[] {
  const slots = oneYear ? cycles : startedCycles(cycles);
  const running = runningNet(slots);
  const { low, high } = (oneYear && cost?.kwh_projection?.band) || { low: [], high: [] };
  return slots.map((cycle, i) => ({
    label: month(cycle.first_day, !oneYear),
    imported: cycle.imported,
    exported: cycle.exported === null ? null : -cycle.exported,
    running: running[i],
    lastYear: (oneYear ? cost?.last_year?.running_net[i] : null) ?? null,
    band: low[i] != null && high[i] != null ? [low[i]!, high[i]!] : null,
  }));
}

type ShapeProps = {
  x?: number; y?: number; width?: number; height?: number; fill?: string; index?: number; background?: { y: number; height: number };
  series: "imported" | "exported"; domain: [number, number]; entering: boolean;
};

// Imports and exports share one stack, square where they meet at zero.
function Flow({ x = 0, y = 0, width = 0, height = 0, fill, index = 0, background, series, domain, entering }: ShapeProps) {
  if (!height) return <g />;
  const top = series === "imported";
  return (
    <path d={roundedRect(x, Math.min(y, y + height), width, Math.abs(height), top, !top)} fill={fill} data-series={series} data-ends={top ? "top" : "bottom"}
      className={entering ? "motion-rise" : undefined} style={riseFrom(background, domain, index)} />
  );
}

function CycleDetails({ active, label, payload }: { active?: boolean; label?: string | number; payload?: readonly { payload?: Row }[] }) {
  const row = payload?.[0]?.payload;
  if (!active || !row) return null;
  const line = (name: string, value: number | null) =>
    value === null ? null : <span className="flex gap-4">{name}<span className="ml-auto font-mono">{kwh(value)} kWh</span></span>;
  return (
    <div className="flex min-w-48 flex-col gap-1.5 rounded-lg border border-input bg-background px-3.5 py-3 text-sm shadow-xl">
      <span className="font-semibold">{label}</span>
      {line("Imported", row.imported)}
      {line("Exported", row.exported)}
      {line("Running net", row.running)}
      {line("Last year", row.lastYear)}
      {row.band && <span className="flex gap-4">Projected<span className="ml-auto font-mono">{kwh(row.band[0])} to {kwh(row.band[1])} kWh</span></span>}
    </div>
  );
}

const Swatch = ({ className, style }: { className: string; style?: React.CSSProperties }) => <span aria-hidden className={className} style={style} />;

export function CycleChart({ cycles, cost, oneYear }: { cycles: Cycle[]; cost: Cost | null; oneYear: boolean }) {
  const rows = chartRows(cycles, cost, oneYear);
  const lastYear = oneYear ? cost?.last_year : null;
  const banded = rows.some((row) => row.band);
  const values = rows.flatMap((row) => [row.imported, row.exported, row.running, row.lastYear, ...(row.band ?? [])]).filter((v) => v !== null);
  const axis = niceAxis(Math.min(0, ...values), Math.max(1, ...values));
  // Recharts rebuilds its marks on every render, so they carry their entrance only while the chart first draws.
  const entering = useEntering(ENTER_MS);
  const lines = entering ? "motion-clip-flows" : undefined;
  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-wrap gap-x-[18px] gap-y-1.5 text-[13px] text-muted-foreground">
        <li className="flex items-center gap-1.5"><Swatch className="size-2.5 rounded-[2px]" style={{ background: "var(--color-grid)" }} />Imported</li>
        <li className="flex items-center gap-1.5"><Swatch className="size-2.5 rounded-[2px]" style={{ background: "var(--color-solar)" }} />Exported</li>
        <li className="flex items-center gap-1.5"><Swatch className="h-[3px] w-3.5 rounded-[2px] bg-primary" />Running net</li>
        {lastYear && <li className="flex items-center gap-1.5"><Swatch className="w-3.5 border-t-2 border-dashed border-muted-foreground" />{yearName(lastYear.label)}</li>}
        {banded && <li className="flex items-center gap-1.5"><Swatch className="h-2.5 w-3.5 rounded-[2px] bg-primary/20" />Projected</li>}
      </ul>
      <ChartContainer config={{}} className="aspect-auto h-72 w-full md:h-80">
        <ComposedChart data={rows} stackOffset="sign" margin={{ top: 8, right: 0, bottom: 0, left: 8 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={8} />
          <YAxis tick={<AxisTick label={(value, index, count) => unitOnTopTick(" kWh")(value.toLocaleString("en-US"), index, count)} />} domain={axis.domain} ticks={axis.ticks} tickLine={false} axisLine={false} width={64} />
          <ReferenceLine y={0} className="stroke-muted-foreground/40" />
          <ChartTooltip cursor={{ className: "fill-white/5" }} content={<CycleDetails />} />
          {/* The day chart's reveal, from the left as the columns rise. */}
          {entering && <defs><clipPath id="motion-flows"><rect width="100%" height="100%" className="motion-draw-only" /></clipPath></defs>}
          {banded && <Area dataKey="band" stroke="none" fill="var(--primary)" fillOpacity={0.18} isAnimationActive={false} activeDot={false} className={lines} />}
          <Bar dataKey="imported" stackId="flows" fill="var(--color-grid)" maxBarSize={48} isAnimationActive={false}
            shape={<Flow series="imported" domain={axis.domain} entering={entering} />} />
          <Bar dataKey="exported" stackId="flows" fill="var(--color-solar)" maxBarSize={48} isAnimationActive={false}
            shape={<Flow series="exported" domain={axis.domain} entering={entering} />} />
          {lastYear && <Line dataKey="lastYear" stroke="var(--muted-foreground)" strokeWidth={2} strokeDasharray="6 5" dot={false} isAnimationActive={false} connectNulls={false} className={lines} />}
          <Line dataKey="running" stroke="var(--primary)" strokeWidth={3} dot={{ r: 3.5, fill: "var(--primary)" }} isAnimationActive={false} className={lines} />
        </ComposedChart>
      </ChartContainer>
      <p className="text-[13px] text-muted-foreground">kWh. Bars are each cycle&apos;s imports above zero and exports below; the lines are the net since October 1.</p>
    </div>
  );
}
