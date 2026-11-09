"use client";

import { useState } from "react";
import { Area, AreaChart, CartesianGrid, ComposedChart, Line, ReferenceArea, ReferenceLine, XAxis, YAxis } from "recharts";

import { AxisTick } from "@/components/solar/axis-tick";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import {
  chargeLevel, clockTime, daySpans, FLOW_COLORS, hasBatteryHistory, type Interval, type OffGridSpan, outlines, type StormSpan,
  TIME_TICKS, timeTick, unitOnTopTick, VIEW_ORDER, viewChart, VIEWS, viewSummary,
} from "@/lib/solar/day-views";

export type Day = {
  date: string;
  vehicle_data?: boolean;
  totals: Record<string, number>;
  data: Interval[];
  off_grid: OffGridSpan[];
  storm_watch: StormSpan[];
};

type Spans = ReturnType<typeof daySpans>;

// Behind the flows, across the chart's height: off grid in the grid's gray, storm watch in the Powerwall's green.
const shading = (spans: Spans) =>
  spans.map(({ kind, from, to }, i) => (
    <ReferenceArea key={i} x1={from} x2={Math.max(to, from + 1)} ifOverflow="hidden" stroke="none"
      fill={kind === "off_grid" ? FLOW_COLORS.grid : FLOW_COLORS.powerwall} fillOpacity={kind === "off_grid" ? 0.22 : 0.12} />
  ));

// The chart keeps about a phone's proportions at any width: its height follows its width at 4:3, with a phone's
// height as a floor and 70% of the window as a ceiling.
const CHART_BOX = "relative w-full aspect-[4/3] min-h-[18rem] max-h-[70vh]";

const timeAxis = (
  <XAxis dataKey="minute" type="number" domain={[0, 1440]} ticks={TIME_TICKS} tickFormatter={timeTick} tickLine={false} axisLine={false} />
);

export function DayDetails({ active, label, payload }: {
  active?: boolean; label?: string | number; payload?: readonly { dataKey?: unknown; name?: unknown; value?: unknown; unit?: unknown; color?: string }[];
}) {
  // Recharts 3 lists the outline lines too, whatever their tooltipType.
  const flows = payload?.filter(({ dataKey }) => !String(dataKey).endsWith("_top"));
  if (!active || !flows?.length) return null;
  return (
    <div className="flex min-w-40 flex-col gap-1.5 rounded-lg border border-input bg-background px-3.5 py-3 text-sm shadow-xl">
      <span className="font-semibold">{clockTime(Number(label))}</span>
      {flows.map(({ dataKey, name, value, unit, color }) => (
        <span key={String(dataKey)} className="flex items-center gap-2">
          <span className="size-2 rounded-full" style={{ background: color }} />
          {String(name)}
          <span className="ml-auto font-mono">{Math.abs(Number(value))}{unit === "%" ? "%" : " kW"}</span>
        </span>
      ))}
    </div>
  );
}

function PowerChart({ viewKey, day, spans }: { viewKey: string; day: Day; spans: Spans }) {
  const chart = viewChart(viewKey, day.data, { vehicleData: Boolean(day.vehicle_data) });
  const rows = outlines(chart);
  return (
    <ChartContainer config={{}} className={CHART_BOX} data-testid="day-chart">
      <ComposedChart data={rows} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
        <CartesianGrid vertical strokeDasharray="2 4" horizontal={false} />
        <CartesianGrid vertical={false} />
        {timeAxis}
        <YAxis orientation="right" domain={chart.domain} ticks={chart.ticks}
          tick={<AxisTick label={chart.tickLabel} anchor="start" />} tickLine={false} axisLine={false} width={56} />
        {shading(spans)}
        <ReferenceLine y={0} className="stroke-muted-foreground/40" />
        <ChartTooltip content={<DayDetails />} />
        {chart.series.map(({ key, label, color, stack }) => (
          <Area key={key} dataKey={key} name={label} stackId={stack} type="linear" fill={color} fillOpacity={0.33} stroke="none"
            isAnimationActive={false} activeDot={false} />
        ))}
        {chart.series.map(({ key, color }) => (
          <Line key={`${key}_top`} dataKey={`${key}_top`} type="linear" stroke={color} strokeWidth={1.5} dot={false} activeDot={false}
            isAnimationActive={false} />
        ))}
      </ComposedChart>
    </ChartContainer>
  );
}

function ChargeLevel({ day, spans }: { day: Day; spans: Spans }) {
  const level = [...day.data].reverse().find((r) => r.battery_percentage != null)?.battery_percentage;
  const { rows, domain } = chargeLevel(day.data);
  return (
    <div className="mt-6" data-testid="charge-level">
      <p className="mb-2">
        Charge Level{level != null && <span className="ml-3 font-mono font-semibold">{level}%</span>}
      </p>
      {hasBatteryHistory(day.data) ? (
        <ChartContainer config={{}} className="h-28 w-full md:h-36" data-testid="charge-level-chart">
          <AreaChart data={rows} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} />
            {timeAxis}
            <YAxis orientation="right" domain={domain} ticks={[0, 50, 100]} tick={<AxisTick label={unitOnTopTick("%")} anchor="start" />}
              tickLine={false} axisLine={false} width={56} />
            {shading(spans)}
            <ChartTooltip content={<DayDetails />} />
            <Area dataKey="level" name="Battery" type="linear" fill={FLOW_COLORS.powerwall} fillOpacity={0.2} stroke={FLOW_COLORS.powerwall}
              strokeWidth={2} isAnimationActive={false} activeDot={false} unit="%" />
          </AreaChart>
        </ChartContainer>
      ) : (
        <p className="py-6 text-center italic text-muted-foreground">Battery history is not available for this day.</p>
      )}
    </div>
  );
}

export function DayView({ day }: { day: Day }) {
  const [viewKey, setViewKey] = useState("solar");
  const vehicleData = Boolean(day.vehicle_data);
  const summary = viewSummary(viewKey, day.totals, { vehicleData });
  const color = FLOW_COLORS[viewKey as keyof typeof FLOW_COLORS];
  const spans = daySpans(day);
  return (
    <div className="flex flex-col gap-5">
      <div role="tablist" aria-label="View" className="grid grid-cols-5 gap-0.5 rounded-lg border border-input bg-card p-[3px]">
        {VIEW_ORDER.map((key) => (
          <button key={key} type="button" role="tab" aria-selected={key === viewKey} onClick={() => setViewKey(key)}
            className={`min-h-10 truncate rounded-md text-xs font-medium sm:text-sm ${key === viewKey ? "bg-secondary text-white" : "text-muted-foreground hover:text-foreground"}`}
            style={key === viewKey ? { boxShadow: `inset 0 -2px 0 ${FLOW_COLORS[key as keyof typeof FLOW_COLORS]}` } : undefined}>
            {VIEWS[key].label}
          </button>
        ))}
      </div>
      {/* One column on phones and tablets; from 1280 pixels the breakdowns move beside the chart. */}
      <div className="flex flex-col gap-6 xl:grid xl:grid-cols-[minmax(0,2fr)_minmax(16rem,1fr)] xl:items-start">
        <div data-testid="day-main" className="flex flex-col gap-4 rounded-[10px] border bg-card p-4 sm:p-6">
          <div className="flex flex-wrap gap-x-12 gap-y-2">
            {summary.headlines.map((headline) => (
              <div key={headline.label}>
                <p className="text-sm text-muted-foreground">{headline.label}</p>
                <p className="font-mono text-4xl" style={{ color }}>
                  <span>{headline.value.toFixed(1)}</span> <span className="text-base text-muted-foreground">kWh</span>
                </p>
              </div>
            ))}
          </div>
          {viewKey === "vehicle" && !vehicleData ? (
            <p className="py-10 text-center italic text-muted-foreground">Vehicle charging data is not available for this day.</p>
          ) : (
            // A fresh chart per set of flows: Recharts stacks areas in the order they were first drawn, so a flow the last
            // chart also had (another view's, or the same view's on a day without the car) would keep its old place.
            <PowerChart key={`${viewKey}:${vehicleData}`} viewKey={viewKey} day={day} spans={spans} />
          )}
          {summary.net && (
            <p className="font-semibold" data-testid="net-grid-usage">
              Net Grid Usage: {summary.net.value.toFixed(1)} kWh {summary.net.label}
            </p>
          )}
          {viewKey === "powerwall" && <ChargeLevel day={day} spans={spans} />}
          {spans.length > 0 && (
            <ul aria-label="Off grid and storm watch" className="flex flex-col gap-1.5 text-sm text-muted-foreground">
              {spans.map(({ kind, text }, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span aria-hidden className={`size-2.5 rounded-xs ${kind === "off_grid" ? "bg-grid/60" : "bg-powerwall/40"}`} />{text}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div data-testid="day-breakdowns" className="flex flex-col gap-6 rounded-[10px] border bg-card p-4 sm:p-6">
          {summary.sections.map((section) => (
            <div key={section.title}>
              <h2 className="mb-3 text-[13px] font-medium tracking-[0.08em] text-muted-foreground uppercase">{section.title}</h2>
              <ul className="flex flex-col gap-3">
                {section.items.map((item) => (
                  <li key={item.label} className="flex items-center gap-2.5 text-sm">
                    <span className="size-2.5 rounded-full" style={{ background: item.color }} />
                    {item.label}
                    <span className="ml-auto font-mono">{item.kwh.toFixed(1)} kWh</span>
                    <span className="w-11 text-right font-mono text-muted-foreground">{item.percent === null ? "–" : `${item.percent}%`}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
