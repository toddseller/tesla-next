// Solar, Home, Vehicle, Powerwall and Grid day views, modeled on the Tesla app, built from the ten flows /api/intervals
// returns. Vehicle lines in other views appear only on days with vehicle data (the response's vehicle_data flag).

import { wallTime } from "@/lib/scene/replay";

export const FLOW_COLORS = {
  solar: "var(--color-solar)",
  home: "var(--color-home)",
  powerwall: "var(--color-powerwall)",
  grid: "var(--color-grid)",
  vehicle: "var(--color-vehicle)",
};

type Flow = { key: string; label: string; color: string; sign: 1 | -1; vehicle?: boolean };
type Section = { title: string; flows: Flow[] };
type View = { label: string; headline: string; secondHeadline?: string; sections: Section[] };

const flow = (key: string, label: string, color: string, sign: 1 | -1 = 1): Flow => ({ key, label, color, sign });
const vehicleFlow = (key: string, label: string, color: string, sign: 1 | -1 = 1): Flow => ({ ...flow(key, label, color, sign), vehicle: true });
const C = FLOW_COLORS;

export const VIEWS: Record<string, View> = {
  solar: {
    label: "Solar",
    headline: "Total Generated",
    sections: [
      {
        title: "Used By",
        flows: [
          flow("solar_to_home", "Home", C.home),
          vehicleFlow("solar_to_vehicle", "Vehicle", C.vehicle),
          flow("solar_to_powerwall", "Powerwall", C.powerwall),
          flow("solar_to_grid", "Grid", C.grid),
        ],
      },
    ],
  },
  home: {
    label: "Home",
    headline: "Total Usage",
    sections: [
      {
        title: "Powered By",
        flows: [flow("solar_to_home", "Solar", C.solar), flow("powerwall_to_home", "Powerwall", C.powerwall), flow("grid_to_home", "Grid", C.grid)],
      },
    ],
  },
  vehicle: {
    label: "Vehicle",
    headline: "Charged",
    sections: [
      {
        title: "Charged From",
        flows: [flow("solar_to_vehicle", "Solar", C.solar), flow("powerwall_to_vehicle", "Powerwall", C.powerwall), flow("grid_to_vehicle", "Grid", C.grid)],
      },
    ],
  },
  // As in the Tesla app: discharge plots above zero by where it went, charge below zero by where it came from.
  powerwall: {
    label: "Powerwall",
    headline: "Discharged",
    secondHeadline: "Charged",
    sections: [
      {
        title: "Discharged To",
        flows: [flow("powerwall_to_home", "Home", C.home), vehicleFlow("powerwall_to_vehicle", "Vehicle", C.vehicle), flow("powerwall_to_grid", "Grid", C.grid)],
      },
      { title: "Charged From", flows: [flow("solar_to_powerwall", "Solar", C.solar, -1), flow("grid_to_powerwall", "Grid", C.grid, -1)] },
    ],
  },
  grid: {
    label: "Grid",
    headline: "Imported",
    secondHeadline: "Exported",
    sections: [
      {
        title: "Imported To",
        flows: [flow("grid_to_home", "Home", C.home), vehicleFlow("grid_to_vehicle", "Vehicle", C.vehicle), flow("grid_to_powerwall", "Powerwall", C.powerwall)],
      },
      { title: "Exported From", flows: [flow("solar_to_grid", "Solar", C.solar, -1), flow("powerwall_to_grid", "Powerwall", C.powerwall, -1)] },
    ],
  },
};

export const VIEW_ORDER = ["solar", "home", "vehicle", "powerwall", "grid"];

type Totals = Record<string, number>;
type Options = { vehicleData?: boolean };
export type Interval = { minute: number; battery_percentage?: number | null; [key: string]: number | string | boolean | null | undefined };

// Vehicle lines are dropped on days without vehicle data (their home flows still include charging).
const sectionsFor = (viewKey: string, vehicleData: boolean) =>
  VIEWS[viewKey].sections.map((s) => ({ ...s, flows: s.flows.filter((f) => vehicleData || !f.vehicle) }));

// Totals arrive at watt-hour precision; only the page rounds them, for display.
const sumOf = (totals: Totals, flows: Flow[]) => flows.reduce((total, f) => total + (totals[f.key] || 0), 0);

// Below this a total displays as 0.0 kWh; percentages of a few Wh of metering noise mean nothing.
const MIN_KWH_FOR_PERCENT = 0.05;

const breakdown = (totals: Totals, flows: Flow[]) => {
  const total = sumOf(totals, flows);
  return flows.map((f) => ({
    label: f.label,
    color: f.color,
    kwh: totals[f.key] || 0,
    percent: total >= MIN_KWH_FOR_PERCENT ? Math.round((100 * (totals[f.key] || 0)) / total) : null,
  }));
};

// Every headline the view shows side by side, and its breakdowns. Grid also has `net`, its Net Grid Usage line.
export const viewSummary = (viewKey: string, totals: Totals, { vehicleData = false }: Options = {}) => {
  const view = { ...VIEWS[viewKey], sections: sectionsFor(viewKey, vehicleData) };
  const sections = view.sections.map((s) => ({ title: s.title, items: breakdown(totals, s.flows) }));
  const headlines = [{ label: view.headline, value: sumOf(totals, view.sections[0].flows) }];
  if (view.secondHeadline) headlines.push({ label: view.secondHeadline, value: sumOf(totals, view.sections[1].flows) });
  const summary: { headline: string; value: number; headlines: typeof headlines; sections: typeof sections; net?: { label: string; value: number } } =
    { headline: headlines[0].label, value: headlines[0].value, headlines, sections };

  if (viewKey === "grid") {
    const net = headlines[0].value - headlines[1].value;
    // As in the Tesla app, a net that displays as 0.0 kWh reads Exported.
    summary.net = { label: Math.round(net * 10) > 0 ? "Imported" : "Exported", value: Math.abs(net) };
  }
  return summary;
};

// A span's kWh per flow from its steps' Wh: summed before dividing, in time order, as the day's totals are, so the whole
// day comes out exactly equal to them.
export function spanTotals(day: { data: Interval[]; totals: Totals }, from: number, to: number): Totals {
  const steps = day.data.filter(({ minute }) => minute >= from && minute < to);
  return Object.fromEntries(
    Object.keys(day.totals).map((flow) => [flow, steps.reduce((wh, step) => wh + ((step[`${flow}_wh`] as number | null) ?? 0), 0) / 1000]),
  );
}

export const hasBatteryHistory = (data: { battery_percentage?: number | null }[]) => data.some((r) => r.battery_percentage != null);

const TIME_LABELS: Record<number, string> = { 360: "6 AM", 720: "12 PM", 1080: "6 PM" };
export const TIME_TICKS = [360, 720, 1080];
export const timeTick = (minute: number) => TIME_LABELS[minute] ?? "";
export const clockTime = (minute: number) => `${Math.floor(minute / 60) % 12 || 12}:${String(minute % 60).padStart(2, "0")} ${minute < 720 ? "AM" : "PM"}`;

// Unit only on the top tick ("8 kW", "4", "0") to keep the axis narrow on phones.
export const unitOnTopTick = (unit: string) => (value: number | string, index: number, count: number) =>
  index === count - 1 ? `${value}${unit}` : `${value}`;

// Each step's stack: the larger of its tallest discharge (above zero) and charge (below) for an axis centered on zero.
const stackExtent = (rows: Record<string, number | null>[], series: { key: string }[]) =>
  rows.reduce(
    ([low, high], row) => {
      const values = series.map(({ key }) => row[key] ?? 0);
      return [Math.min(low, values.filter((v) => v < 0).reduce((a, v) => a + v, 0)), Math.max(high, values.filter((v) => v > 0).reduce((a, v) => a + v, 0))];
    },
    [0, 0],
  );

// An axis widened to whole steps of 1, 2 or 5 (times a power of ten), about four of them, with a tick at each, as
// Chart.js's axes had; Recharts' own ticks can land on steps like 850.
export function niceAxis(low: number, high: number) {
  const rough = (high - low) / 4;
  const power = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 5, 10].map((m) => m * power).find((s) => s >= rough)!;
  const round = (value: number) => Number(value.toFixed(10)) + 0;
  const [first, last] = [Math.floor(low / step), Math.ceil(high / step)];
  return {
    domain: [round(first * step), round(last * step)] as [number, number],
    ticks: Array.from({ length: last - first + 1 }, (_, i) => round((first + i) * step)),
  };
}

// The view's flows as Recharts areas: discharge and imports stack above zero, charge and exports below, each in its
// own stack, so a flow idle at zero never sits on top of the other side's. The Powerwall's axis is centered on zero and
// sized to the larger side, with magnitudes on both sides as in the Tesla app; others use at least 1 kW (±1 kW for Grid)
// so a few watts of metering noise read as flat.
export function viewChart(viewKey: string, data: Interval[], { vehicleData = false, expectedPeak = 0 }: Options & { expectedPeak?: number } = {}) {
  const series = sectionsFor(viewKey, vehicleData)
    .flatMap((s) => s.flows)
    .map((f) => ({ key: f.key, label: f.label, color: f.color, stack: f.sign > 0 ? ("above" as const) : ("below" as const) }));
  const signOf = Object.fromEntries(sectionsFor(viewKey, vehicleData).flatMap((s) => s.flows).map((f) => [f.key, f.sign]));
  const rows = data.map((record) => ({
    minute: record.minute,
    ...Object.fromEntries(series.map(({ key }) => {
      const value = record[`${key}_kw`];
      return [key, typeof value === "number" ? signOf[key] * value : null];
    })),
  })) as ({ minute: number } & Record<string, number | null>)[];
  const [low, high] = stackExtent(rows, series);
  if (viewKey === "powerwall") {
    const limit = Math.max(1, Math.ceil(Math.max(-low, high)));
    const kw = unitOnTopTick(" kW");
    return {
      series, rows,
      domain: [-limit, limit] as [number, number],
      ticks: [-limit, -limit / 2, 0, limit / 2, limit],
      tickLabel: (value: number, index: number, count: number) => kw(Math.abs(value), index, count),
    };
  }
  return {
    series, rows,
    ...niceAxis(Math.min(viewKey === "grid" ? -1 : 0, low), Math.max(1, high, expectedPeak)),
    tickLabel: unitOnTopTick(" kW"),
  };
}

// The Powerwall's charge level, 0 to 100%, with missing samples as breaks.
export const chargeLevel = (data: Interval[]) => ({
  rows: data.map((r) => ({ minute: r.minute, level: r.battery_percentage ?? null })),
  domain: [0, 100] as [number, number],
});

// Below this a flow is metering noise, a few watts: its band can't be seen, so its outline would only cover the
// outline of the band beneath in the wrong color.
const IDLE_KW = 0.05;

// Each flow's outline: the top of its band in its stack, drawn as a line of its own because a Recharts area outlines
// its whole top edge, and an idle band's top edge lies on the band beneath. A step where the flow is idle with idle
// neighbors is left empty, so no line runs along zero overnight or over another band; gaps stay gaps.
export function outlines({ series, rows }: Pick<ReturnType<typeof viewChart>, "series" | "rows">) {
  return rows.map((row, i) => {
    const tops: Record<string, number | null> = {};
    const reached = { above: 0, below: 0 };
    for (const { key, stack } of series) {
      const value = row[key];
      reached[stack] += value ?? 0;
      const idle = (r?: Record<string, number | null>) => !r || Math.abs(r[key] ?? 0) < IDLE_KW;
      tops[`${key}_top`] = value === null || (idle(row) && idle(rows[i - 1]) && idle(rows[i + 1])) ? null : reached[stack];
    }
    return { ...row, ...tops };
  });
}

export type OffGridSpan = { start: string; end: string; kind: string };
export type StormSpan = { start: string; end: string | null };
type SpanDay = { date: string; data: Interval[]; off_grid: OffGridSpan[]; storm_watch: StormSpan[] };

// A time's minute in the shown day, with seconds as a fraction, 0 or 1440 when it falls before or after it.
export function dayMinute(iso: string, date: string) {
  const ms = Date.parse(iso);
  const wall = wallTime(ms);
  if (wall.date !== date) return wall.date < date ? 0 : 1440;
  return wall.hour * 60 + wall.minute + (ms % 60_000) / 60_000;
}

const edge = (iso: string | null, date: string) => {
  if (iso === null) return "now";
  const minute = dayMinute(iso, date);
  return wallTime(Date.parse(iso)).date === date ? clockTime(Math.floor(minute)) : "midnight";
};

// The day's off-grid and storm watch spans, cut to the day for shading, each with its line for the list under the
// charts; storm watch adds what the Powerwalls charged from the grid inside it, each 5-minute record by its part inside.
export function daySpans({ date, data, off_grid, storm_watch }: SpanDay) {
  const cut = (start: string, end: string | null) => ({ from: dayMinute(start, date), to: end === null ? 1440 : dayMinute(end, date) });
  const fromGrid = (from: number, to: number) =>
    data.reduce((kwh, r) => kwh + Number(r.grid_to_powerwall_kw ?? 0) * Math.max(0, Math.min(r.minute + 5, to) - Math.max(r.minute, from)) / 60, 0);
  return [
    ...off_grid.map(({ start, end, kind }) => ({ kind: "off_grid" as const, ...cut(start, end), text: `Off grid (${kind}) ${edge(start, date)} to ${edge(end, date)}` })),
    ...storm_watch.map(({ start, end }) => {
      const span = cut(start, end);
      return { kind: "storm" as const, ...span, text: `Storm watch ${edge(start, date)} to ${edge(end, date)}, ${fromGrid(span.from, span.to).toFixed(1)} kWh charged from the grid` };
    }),
  ];
}

export type ExpectedHour = { start: string; kwh: number };

// The expected line's points, each lit hour's kWh as average kW at its middle and zero at the lit hours' two ends, and
// each step's own hour's expected kW for the details; a point's minute without a step gets a row of its own.
export function expectedRows<T extends { minute: number }>(
  rows: T[], expected: ExpectedHour[], date: string,
): (T & { expected?: number | null; expected_hour?: number | null })[] {
  const hours = expected.map(({ start, kwh }) => ({ from: dayMinute(start, date), kw: kwh }));
  const lit = hours.filter(({ kw }) => kw > 0);
  if (!lit.length) return rows;
  const points = new Map([[lit[0].from, 0], ...lit.map(({ from, kw }) => [from + 30, kw] as const), [lit.at(-1)!.from + 60, 0]]);
  const byMinute = new Map<number, T>(rows.map((row) => [row.minute, row]));
  for (const minute of points.keys()) if (!byMinute.has(minute)) byMinute.set(minute, { minute } as T);
  return [...byMinute.values()].sort((a, b) => a.minute - b.minute).map((row) => ({
    ...row,
    expected: points.get(row.minute) ?? null,
    expected_hour: hours.find(({ from }) => row.minute >= from && row.minute < from + 60)?.kw ?? null,
  }));
}
