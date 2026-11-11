"use client";

import { type PointerEvent, type ReactNode, useRef, useState } from "react";
import { Area, AreaChart, CartesianGrid, ComposedChart, Line, ReferenceArea, ReferenceLine, XAxis, YAxis } from "recharts";

import { AxisTick } from "@/components/solar/axis-tick";
import { Rolling } from "@/components/rolling";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { useEntering } from "@/components/use-entering";
import {
  chargeLevel, clockTime, daySpans, expectedRows, type ExpectedHour, FLOW_COLORS, hasBatteryHistory, type Interval, type OffGridSpan, outlines, spanTotals, type StormSpan,
  TIME_TICKS, timeTick, unitOnTopTick, VIEW_ORDER, viewChart, VIEWS, viewSummary,
} from "@/lib/solar/day-views";

export type Day = {
  date: string;
  vehicle_data?: boolean;
  totals: Record<string, number>;
  data: Interval[];
  off_grid: OffGridSpan[];
  storm_watch: StormSpan[];
  expected?: ExpectedHour[];
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

// The power chart's value axis, on its right; the plot is the rest of the chart's width.
const AXIS_WIDTH = 56;
// The expected line's 600 ms, then the flows' 600 ms from its halfway point.
const DRAW_MS = 900;
const STEP = 5;

// A span of the day in minutes: from its first step's start to its last step's end, so the whole day is 0 to 1440.
type Span = { from: number; to: number };

const timeAxis = (
  <XAxis dataKey="minute" type="number" domain={[0, 1440]} ticks={TIME_TICKS} tickFormatter={timeTick} tickLine={false} axisLine={false} />
);

export function DayDetails({ active, label, payload }: {
  active?: boolean; label?: string | number;
  payload?: readonly { dataKey?: unknown; name?: unknown; value?: unknown; unit?: unknown; color?: string; payload?: { expected_hour?: number | null } }[];
}) {
  // Recharts 3 lists the outline lines too, whatever their tooltipType.
  const flows = payload?.filter(({ dataKey }) => !String(dataKey).endsWith("_top") && dataKey !== "expected");
  if (!active || !flows?.length) return null;
  const expected = payload?.[0]?.payload?.expected_hour;
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
      {typeof expected === "number" && (
        <span className="flex items-center gap-2">
          <span className="h-0.5 w-2 bg-foreground/90" />
          Expected
          <span className="ml-auto font-mono">{expected.toFixed(1)} kW</span>
        </span>
      )}
    </div>
  );
}

function PowerChart({ viewKey, day, spans, span }: { viewKey: string; day: Day; spans: Spans; span: Span | null }) {
  const expected = viewKey === "solar" ? (day.expected ?? []) : [];
  const expectedPeak = Math.max(0, ...expected.map(({ kwh }) => kwh));
  const chart = viewChart(viewKey, day.data, { vehicleData: Boolean(day.vehicle_data), expectedPeak });
  const rows = expectedRows(outlines(chart), expected, day.date);
  const drawing = useEntering(DRAW_MS);
  const flows = drawing ? "motion-clip-flows" : undefined;
  return (
    <ChartContainer config={{}} className={CHART_BOX} data-testid="day-chart">
      <ComposedChart data={rows} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
        <CartesianGrid vertical strokeDasharray="2 4" horizontal={false} />
        <CartesianGrid vertical={false} />
        {timeAxis}
        <YAxis orientation="right" domain={chart.domain} ticks={chart.ticks}
          tick={<AxisTick label={chart.tickLabel} anchor="start" />} tickLine={false} axisLine={false} width={AXIS_WIDTH} />
        {shading(spans)}
        {span && <ReferenceArea x1={span.from} x2={span.to} ifOverflow="hidden" stroke="none" fill="var(--color-foreground)" fillOpacity={0.07} />}
        {span && [span.from, span.to].map((x) => (
          <ReferenceLine key={x} x={x} stroke="var(--color-foreground)" strokeOpacity={0.6} strokeWidth={1.5} ifOverflow="hidden" />
        ))}
        <ReferenceLine y={0} className="stroke-muted-foreground/40" />
        {/* One reveal for every flow and one for the expected line, growing across the whole chart, so the flows start
            when the line is halfway across. shortcut: fixed ids, fine while a page shows one day chart. */}
        {drawing && (
          <defs>
            {expectedPeak > 0 && <clipPath id="motion-expected"><rect width="100%" height="100%" className="motion-draw-estimate" /></clipPath>}
            <clipPath id="motion-flows"><rect width="100%" height="100%" className={expectedPeak > 0 ? "motion-draw-actual" : "motion-draw-only"} /></clipPath>
          </defs>
        )}
        <ChartTooltip content={<DayDetails />} />
        {chart.series.map(({ key, label, color, stack }) => (
          <Area key={key} dataKey={key} name={label} stackId={stack} type="linear" fill={color} fillOpacity={0.33} stroke="none"
            isAnimationActive={false} activeDot={false} className={flows} />
        ))}
        {chart.series.map(({ key, color }) => (
          <Line key={`${key}_top`} dataKey={`${key}_top`} type="linear" stroke={color} strokeWidth={1.5} dot={false} activeDot={false}
            isAnimationActive={false} className={flows} />
        ))}
        {/* Monotone, so a jagged hour-to-hour forecast gets no peaks or dips between its hours. */}
        {expectedPeak > 0 && (
          <Line dataKey="expected" name="Expected" type="monotone" connectNulls stroke="var(--color-foreground)" strokeOpacity={0.9}
            strokeWidth={1.75} dot={false} activeDot={false} isAnimationActive={false} className={drawing ? "motion-clip-expected" : undefined} />
        )}
      </ComposedChart>
    </ChartContainer>
  );
}

// The step under a pointer, from where it is across the plot.
function stepAt(event: PointerEvent<HTMLDivElement>) {
  const { left, width } = event.currentTarget.getBoundingClientRect();
  const plot = width - AXIS_WIDTH;
  const minute = (Math.min(Math.max(event.clientX - left, 0), plot - 0.001) / plot) * 1440;
  return Math.floor(minute / STEP) * STEP;
}

// Dragging across the chart selects the steps it covers. A finger drag only does while Select is on, since touching the
// chart otherwise reads its values; a click, staying on one step, selects nothing.
function SpanArea({ selecting, onSpan, onPicked, children }: {
  selecting: boolean; onSpan: (span: Span) => void; onPicked: () => void; children: ReactNode;
}) {
  const start = useRef<number | null>(null);
  const moved = useRef(false);
  const takes = (event: PointerEvent<HTMLDivElement>) => (event.pointerType === "mouse" ? event.button === 0 : selecting);
  const extend = (event: PointerEvent<HTMLDivElement>) => {
    if (start.current === null) return;
    const step = stepAt(event);
    if (step === start.current) return;
    moved.current = true;
    onSpan({ from: Math.min(start.current, step), to: Math.max(start.current, step) + STEP });
  };
  return (
    <div
      data-testid="span-area"
      className={selecting ? "touch-none" : undefined}
      onPointerDown={(event) => {
        if (!takes(event)) return;
        start.current = stepAt(event);
        moved.current = false;
        event.currentTarget.setPointerCapture?.(event.pointerId);
      }}
      onPointerMove={extend}
      onPointerUp={(event) => {
        extend(event);
        if (start.current !== null && moved.current) onPicked();
        start.current = null;
      }}
      onPointerCancel={() => (start.current = null)}
    >
      {children}
    </div>
  );
}

const spanName = ({ from, to }: Span) => `${clockTime(from)} to ${clockTime(to % 1440)}`;
// "4 PM to 12 AM", or "4:05 PM to …" off the hour: short enough for a headline or a column heading.
const shortTime = (minute: number) => clockTime(minute % 1440).replace(":00 ", " ");
const spanLabel = ({ from, to }: Span) => `${shortTime(from)} to ${shortTime(to)}`;
// With a span, the day's figures show from 640 pixels and the span's alone below; both are in the page.
const dayOnly = (span: Span | null) => (span ? "max-sm:hidden" : "");
const kwhText = (kwh: number) => `${kwh.toFixed(1)} kWh`;
const percentText = (percent: number | null) => (percent === null ? "–" : `${percent}%`);

function SpanControls({ span, selecting, onSelecting, onClear }: {
  span: Span | null; selecting: boolean; onSelecting: (on: boolean) => void; onClear: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 max-sm:order-first">
      {span ? (
        <span className="flex items-center gap-2.5 rounded-full border border-input py-1 pr-1 pl-3 text-[13px]">
          <span className="max-sm:hidden">Selected</span>
          <strong className="font-semibold">{spanName(span)}</strong>
          <button type="button" onClick={onClear} className="min-h-8 rounded-full bg-secondary px-3 hover:text-white">Clear</button>
        </span>
      ) : <span />}
      <span className="text-xs text-muted-foreground pointer-coarse:hidden">
        {span ? "Drag across the chart to pick another span" : "Drag across the chart to add up part of the day"}
      </span>
      <button type="button" aria-pressed={selecting} onClick={() => onSelecting(!selecting)}
        className={`hidden min-h-11 items-center gap-1.5 rounded-lg border border-input px-3.5 text-[13px] pointer-coarse:flex ${selecting ? "bg-secondary text-white" : ""}`}>
        Select
      </button>
    </div>
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

function ExpectedTotal({ generated, expected, past }: { generated: number; expected: number; past: boolean }) {
  const share = Math.round((100 * generated) / expected);
  return (
    // Wrapped inside the 4xl line on a phone, it would leave a 4xl gap; its own line keeps its own size.
    <span className="text-base leading-normal text-muted-foreground max-sm:block">
      {" "}of {Math.round(expected)} kWh expected
      {/* Today's share would compare part of a day with all of it. */}
      {past && <> <span className={share < SHORT_OF_EXPECTED ? "text-destructive" : undefined}>({share}%)</span></>}
    </span>
  );
}

// Under this share of the expected, the alert's own threshold, a past day's percentage reads red.
const SHORT_OF_EXPECTED = 60;

export function DayView({ day, today }: { day: Day; today?: string }) {
  const [viewKey, setViewKey] = useState("solar");
  // Kept with its day, so a reload of the same day keeps it and another day's view starts without one.
  const [picked, setPicked] = useState<(Span & { date: string }) | null>(null);
  const [selecting, setSelecting] = useState(false);
  const span = picked?.date === day.date ? picked : null;
  const pick = (next: Span) => setPicked({ ...next, date: day.date });
  const vehicleData = Boolean(day.vehicle_data);
  const summary = viewSummary(viewKey, day.totals, { vehicleData });
  const spanned = span && viewSummary(viewKey, spanTotals(day, span.from, span.to), { vehicleData });
  const color = FLOW_COLORS[viewKey as keyof typeof FLOW_COLORS];
  const spans = daySpans(day);
  const expectedKwh = viewKey === "solar" ? (day.expected ?? []).reduce((sum, { kwh }) => sum + kwh, 0) : 0;
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
            {summary.headlines.map((headline, i) => (
              <div key={headline.label}>
                <p className="text-sm text-muted-foreground">{headline.label}</p>
                <p className={`font-mono text-4xl ${dayOnly(span)}`} style={{ color }}>
                  <Rolling value={headline.value} format={(kwh) => kwh.toFixed(1)} /> <span className="text-base text-muted-foreground">kWh</span>
                  {expectedKwh > 0 && <ExpectedTotal generated={headline.value} expected={expectedKwh} past={day.date !== today} />}
                </p>
                {span && spanned && (
                  <>
                    <p className="font-mono text-4xl sm:hidden" style={{ color }}>
                      <span>{spanned.headlines[i].value.toFixed(1)}</span> <span className="text-base text-muted-foreground">kWh</span>
                    </p>
                    <p className="flex items-center gap-1.5 text-[13px] text-muted-foreground max-sm:hidden">
                      <span aria-hidden className="size-2.5 rounded-xs bg-foreground/55" />
                      <span><span className="font-mono text-foreground">{kwhText(spanned.headlines[i].value)}</span> {spanLabel(span)}</span>
                    </p>
                  </>
                )}
              </div>
            ))}
          </div>
          {viewKey === "vehicle" && !vehicleData ? (
            <p className="py-10 text-center italic text-muted-foreground">Vehicle charging data is not available for this day.</p>
          ) : (
            // A fresh chart per set of flows: Recharts stacks areas in the order they were first drawn, so a flow the last
            // chart also had (another view's, or the same view's on a day without the car) would keep its old place.
            <>
              <SpanControls span={span} selecting={selecting} onSelecting={setSelecting} onClear={() => setPicked(null)} />
              <SpanArea selecting={selecting} onSpan={pick} onPicked={() => setSelecting(false)}>
                <PowerChart key={`${day.date}:${viewKey}:${vehicleData}`} viewKey={viewKey} day={day} spans={spans} span={span} />
              </SpanArea>
              {viewKey === "solar" && day.expected?.some(({ kwh }) => kwh > 0) && (
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span aria-hidden className="h-0.5 w-4 bg-foreground/90" />Expected from the forecast
                </p>
              )}
            </>
          )}
          {summary.net && (
            <div data-testid="net-grid-usage" className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <p className={`font-semibold ${dayOnly(span)}`}>Net Grid Usage: {summary.net.value.toFixed(1)} kWh {summary.net.label}</p>
              {span && spanned?.net && (
                <>
                  <p className="font-semibold sm:hidden">Net Grid Usage: {spanned.net.value.toFixed(1)} kWh {spanned.net.label}</p>
                  <p className="text-[13px] text-muted-foreground max-sm:hidden">
                    <span className="font-mono text-foreground">{kwhText(spanned.net.value)}</span> {spanned.net.label}, {spanLabel(span)}
                  </p>
                </>
              )}
            </div>
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
          {span && <p className="-mb-3 text-xs text-muted-foreground sm:hidden">{spanName(span)}</p>}
          {summary.sections.map((section, s) => (
            <div key={section.title}>
              <div className="mb-3 flex items-baseline gap-2.5">
                <h2 className="text-[13px] font-medium tracking-[0.08em] text-muted-foreground uppercase">{section.title}</h2>
                {span && (
                  <span className="ml-auto w-[5.5rem] text-right text-xs font-medium whitespace-nowrap max-sm:hidden">{spanLabel(span)}</span>
                )}
              </div>
              <ul className="flex flex-col gap-3">
                {section.items.map((item, i) => {
                  const spanItem = spanned?.sections[s].items[i];
                  return (
                    <li key={item.label} className="flex items-center gap-2.5 text-sm">
                      <span className="size-2.5 rounded-full" style={{ background: item.color }} />
                      {item.label}
                      <span className={`ml-auto font-mono ${dayOnly(span)}`}>{kwhText(item.kwh)}</span>
                      <span className={`w-11 text-right font-mono text-muted-foreground ${dayOnly(span)}`}>{percentText(item.percent)}</span>
                      {spanItem && (
                        <>
                          <span className="w-[5.5rem] rounded-sm bg-foreground/5 text-right font-mono max-sm:hidden">{kwhText(spanItem.kwh)}</span>
                          <span className="ml-auto font-mono sm:hidden">{kwhText(spanItem.kwh)}</span>
                          <span className="w-11 text-right font-mono text-muted-foreground sm:hidden">{percentText(spanItem.percent)}</span>
                        </>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
