"use client";

import { Bar, BarChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from "recharts";

import { AxisTick } from "@/components/solar/axis-tick";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import type { RangeItem } from "@/lib/range";
import { type Bar as Totals, SERIES, stackEnds } from "@/lib/solar/bars";
import { niceAxis, unitOnTopTick } from "@/lib/solar/day-views";
import { isDaily, periods, type Range } from "@/lib/solar/ranges";

const FLOWS = [
  { key: "solar", label: "Solar", color: "var(--color-solar)" },
  { key: "grid", label: "Grid", color: "var(--color-grid)" },
  { key: "house", label: "House", color: "var(--color-home)" },
] as const;

type Row = Totals & { label: string; day?: string; period?: Range };

// The range labels a period "Oct-25".
const toRow = (item: RangeItem): Row => ({ ...item, label: item.day ? item.date : item.date.replace("-", " 20") });

// /api/range answers one item per period, in order, so the range's own periods say which days each bar holds. A period
// with no saved days yet draws no bar, so it has nothing to open.
const withPeriods = (items: RangeItem[], range: Range): Row[] => {
  const spans = isDaily(range) ? [] : periods(range.start, range.end);
  return items.map((item, i) => ({ ...toRow(item), ...(spans[i] && item.solar !== null && { period: { start: spans[i][0], end: spans[i][1] } }) }));
};

export const kwh = (value: number) => `${value.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kWh`;

const RADIUS = 4;

// A rectangle whose top and bottom corners round only where its section ends the bar.
export function roundedRect(x: number, top: number, width: number, height: number, roundTop: boolean, roundBottom: boolean) {
  const r = Math.min(RADIUS, width / 2, height / 2);
  const [t, b] = [roundTop ? r : 0, roundBottom ? r : 0];
  const bottom = top + height;
  return `M${x},${top + t} Q${x},${top} ${x + t},${top} H${x + width - t} Q${x + width},${top} ${x + width},${top + t} V${bottom - b} Q${x + width},${bottom} ${x + width - b},${bottom} H${x + b} Q${x},${bottom} ${x},${bottom - b} Z`;
}

type ShapeProps = { x?: number; y?: number; width?: number; height?: number; fill?: string; payload?: Row };

type Open = { onOpenDay: (day: string) => void; onOpenRange: (range: Range) => void };

function section(key: (typeof SERIES)[number], { onOpenDay, onOpenRange }: Open) {
  return function Section({ x = 0, y = 0, width = 0, height = 0, fill, payload }: ShapeProps) {
    if (!payload) return <g />;
    const ends = stackEnds(payload)[key];
    const { day, period } = payload;
    const open = day ? () => onOpenDay(day) : period ? () => onOpenRange(period) : undefined;
    return (
      <path
        d={roundedRect(x, Math.min(y, y + height), width, Math.abs(height), ends.top, ends.bottom)}
        fill={fill}
        data-series={key}
        data-label={payload.label}
        data-ends={[ends.top && "top", ends.bottom && "bottom"].filter(Boolean).join(" ")}
        className={open ? "cursor-pointer" : undefined}
        onClick={open}
      />
    );
  };
}

export function BarDetails({ active, label, payload }: { active?: boolean; label?: string | number; payload?: readonly { payload?: Row }[] }) {
  const row = payload?.[0]?.payload;
  if (!active || !row) return null;
  return (
    <div className="flex min-w-48 flex-col gap-1.5 rounded-lg border border-input bg-background px-3.5 py-3 text-sm shadow-xl">
      <span className="font-semibold">{label}</span>
      {FLOWS.map(({ key, label: name, color }) =>
        row[key] === null ? null : (
          <span key={key} className="flex items-center gap-2">
            <span className="size-2 rounded-full" style={{ background: color }} />
            {name}
            <span className="ml-auto font-mono">{kwh(row[key])}</span>
          </span>
        ),
      )}
      {(row.day || row.period) && (
        <span className="border-t pt-1.5 text-xs text-muted-foreground">{row.day ? "Click to open the day" : "Click to see its days"}</span>
      )}
    </div>
  );
}

export function RangeChart({ items, range, ...open }: { items: RangeItem[]; range: Range } & Open) {
  const rows = withPeriods(items, range);
  const axis = niceAxis(
    Math.min(0, ...rows.map((row) => row.grid ?? 0)),
    Math.max(1, ...rows.map((row) => (row.solar ?? 0) + Math.max(0, row.grid ?? 0) + (row.house ?? 0))),
  );
  return (
    <div className="flex flex-col gap-4">
      <ChartContainer config={{}} className="aspect-auto h-72 w-full md:h-96">
        <BarChart data={rows} stackOffset="sign" margin={{ top: 8, right: 0, bottom: 0, left: 8 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={12} />
          <YAxis tick={<AxisTick label={(value, index, count) => unitOnTopTick(" kWh")(value.toLocaleString("en-US"), index, count)} />} domain={axis.domain} ticks={axis.ticks} tickLine={false} axisLine={false} width={64} />
          <ReferenceLine y={0} className="stroke-muted-foreground/40" />
          <ChartTooltip cursor={{ className: "fill-white/5" }} content={<BarDetails />} />
          {FLOWS.map(({ key, color }) => (
            <Bar key={key} dataKey={key} stackId="range" fill={color} maxBarSize={100} isAnimationActive={false} shape={section(key, open)} />
          ))}
        </BarChart>
      </ChartContainer>
      <div className="flex justify-center gap-5 text-sm text-muted-foreground">
        {FLOWS.map(({ key, label, color }) => (
          <span key={key} className="flex items-center gap-1.5">
            <span className="size-2 rounded-full" style={{ background: color }} />
            {label}
          </span>
        ))}
      </div>
      <p className="text-center text-sm italic text-muted-foreground">Grid below zero: more energy sent to the grid than taken from it.</p>
    </div>
  );
}
