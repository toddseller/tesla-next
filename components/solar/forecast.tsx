import { Bar as Column, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { AxisTick } from "@/components/solar/axis-tick";
import { kwh, roundedRect } from "@/components/solar/range-chart";
import { skyOf } from "@/components/solar/sky";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import type { ByHour as Hourly, ForecastCard as Card, SkyWhen } from "@/lib/forecast";
import { shiftDay, TIME_ZONE } from "@/lib/scene/replay";
import { niceAxis, unitOnTopTick } from "@/lib/solar/day-views";

const clock = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: TIME_ZONE });
const hourOf = new Intl.DateTimeFormat("en-US", { hour: "numeric", timeZone: TIME_ZONE });
const onDay = (day: string, options: Intl.DateTimeFormatOptions) =>
  new Date(`${day}T12:00:00Z`).toLocaleString("en-US", { ...options, timeZone: "UTC" });
const percent = (part: number, whole: number) => `${Math.round(Math.min(1, part / whole) * 1000) / 10}%`;

function Bar({ label, part, whole }: { label: string; part: number; whole: number | null }) {
  return (
    <div role="img" aria-label={label} className="h-2 overflow-hidden rounded bg-border">
      <div className="h-full rounded bg-solar" style={{ width: whole ? percent(part, whole) : "0%" }} />
    </div>
  );
}

function Sky({ code, when, className = "" }: { code: number; when?: SkyWhen; className?: string }) {
  const { label, icon: Icon } = skyOf(code, when);
  return (
    <span className={`items-center gap-1.5 text-[13px] text-muted-foreground ${className}`}>
      <Icon aria-hidden className="size-4 text-solar" />
      {label}
    </span>
  );
}

function Today({ today }: { today: Card["today"] }) {
  const soFar = today.soFar ?? 0;
  return (
    <div role="group" aria-label="Today" className="flex flex-col gap-2.5 rounded-lg bg-secondary p-3.5 outline outline-1 -outline-offset-1 outline-solar sm:p-4">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium">Today</span>
        {today.code !== null && <Sky code={today.code} when={today.sky} className="flex" />}
      </div>
      {today.expected !== null && (
        <>
          <p className="flex items-baseline gap-1.5">
            <span className="font-mono text-[26px] font-semibold sm:text-[28px]">{today.expected}</span>
            <span className="text-sm text-muted-foreground">kWh expected</span>
          </p>
          <Bar label={`${soFar.toFixed(1)} of about ${today.expected} kWh so far`} part={soFar} whole={today.expected} />
        </>
      )}
      <span className="text-[13px] text-muted-foreground">
        <span className="font-mono text-foreground">{soFar.toFixed(1)} kWh</span> so far
      </span>
    </div>
  );
}

type HourRow = Hourly["hours"][number] & { label: string; top: number };
type HourShape = { x?: number; y?: number; width?: number; height?: number; payload?: HourRow };

// One drawn column: the expected kWh faded, the made kWh solid in front, and a tick where made passed expected.
function HourColumn({ x = 0, y = 0, width = 0, height = 0, payload }: HourShape) {
  if (!payload) return <g />;
  const { start, expected, made, top } = payload;
  const bottom = y + height;
  const tall = (kwh: number) => (top > 0 ? (kwh / top) * height : 0);
  return (
    <g>
      <path data-part="expected" data-hour={start} d={roundedRect(x, bottom - tall(expected), width, tall(expected), true, false)} className="fill-solar/25" />
      {made !== null && <path data-part="made" data-hour={start} d={roundedRect(x, bottom - tall(made), width, tall(made), true, false)} className="fill-solar" />}
      {made !== null && made > expected && (
        <rect data-part="tick" data-hour={start} x={x - 3} y={bottom - tall(expected) - 1.5} width={width + 6} height={3} rx={1.5} className="fill-foreground" />
      )}
    </g>
  );
}

// "9–10 AM", or "11 AM–12 PM" across noon.
function hourSpan(start: string) {
  const [from, to] = [Date.parse(start), Date.parse(start) + 3_600_000].map((ms) => {
    const parts = hourOf.formatToParts(new Date(ms));
    return { hour: parts.find((p) => p.type === "hour")!.value, half: parts.find((p) => p.type === "dayPeriod")!.value };
  });
  return from.half === to.half ? `${from.hour}–${to.hour} ${to.half}` : `${from.hour} ${from.half}–${to.hour} ${to.half}`;
}

export function HourDetails({ active, payload }: { active?: boolean; payload?: readonly { payload?: Hourly["hours"][number] }[] }) {
  const hour = payload?.[0]?.payload;
  if (!active || !hour) return null;
  const line = (name: string, value: number, swatch: string) => (
    <span className="flex items-center gap-2">
      <span className={`size-2 rounded-full ${swatch}`} />
      {name}
      <span className="ml-auto font-mono">{kwh(value)}</span>
    </span>
  );
  return (
    <div className="flex min-w-40 flex-col gap-1.5 rounded-lg border border-input bg-background px-3.5 py-3 text-sm shadow-xl">
      <span className="font-semibold">{hourSpan(hour.start)}</span>
      {hour.made !== null && line("Made", hour.made, "bg-solar")}
      {line("Expected", hour.expected, "bg-solar/25")}
    </div>
  );
}

function ByNow({ byNow }: { byNow: NonNullable<Hourly["byNow"]> }) {
  const figure = (kwh: number) => <span className="font-mono text-foreground">{kwh.toFixed(1)}</span>;
  return (
    <span className="text-[13px] text-muted-foreground">
      {figure(byNow.made)}
      {byNow.over ? <> kWh made today, against {figure(byNow.expected)} expected</> : (
        <> kWh made by {clock.format(new Date(byNow.at))}, against {figure(byNow.expected)} expected by now</>
      )}
    </span>
  );
}

function TodayByHour({ byHour }: { byHour: Hourly }) {
  const rows: HourRow[] = byHour.hours.map((hour) => ({ ...hour, label: hourOf.format(new Date(hour.start)), top: Math.max(hour.expected, hour.made ?? 0) }));
  const axis = niceAxis(0, Math.max(1, ...rows.map((row) => row.top)));
  return (
    <div role="group" aria-label="Today by hour" className="flex flex-col gap-3 rounded-lg bg-secondary p-3.5 sm:p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-5 gap-y-2">
        <div className="flex flex-wrap items-baseline gap-x-3.5 gap-y-1">
          <h3 className="text-sm font-medium">Today by hour</h3>
          {byHour.byNow && <ByNow byNow={byHour.byNow} />}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="size-3 rounded-[3px] bg-solar" />Made</span>
          <span className="flex items-center gap-1.5"><span className="size-3 rounded-[3px] bg-solar/25" />Expected</span>
          <span className="flex items-center gap-1.5"><span className="h-[3px] w-3.5 rounded-sm bg-foreground" />Expected, where beaten</span>
        </div>
      </div>
      <ChartContainer config={{}} className="aspect-auto h-48 w-full sm:h-56">
        <BarChart data={rows} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={8} />
          <YAxis tick={<AxisTick label={(value, index, count) => unitOnTopTick(" kWh")(value, index, count)} />} domain={axis.domain} ticks={axis.ticks} tickLine={false} axisLine={false} width={56} />
          <ChartTooltip cursor={{ className: "fill-white/5" }} content={<HourDetails />} />
          <Column dataKey="top" isAnimationActive={false} shape={HourColumn} />
        </BarChart>
      </ChartContainer>
      <p className="text-xs text-muted-foreground">
        kWh in each hour. An hour&apos;s expected kWh is its forecast sunlight, scaled by what that hour of the day made in the last 30 days.
      </p>
    </div>
  );
}

export function ForecastCard({ card }: { card: Card }) {
  const { days, goodDay, staleSince } = card;
  return (
    <section aria-labelledby="forecast" className="flex flex-col gap-4 rounded-[10px] border bg-card p-4 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="forecast" className="text-sm font-medium tracking-[0.06em] text-muted-foreground uppercase">Solar forecast</h2>
        {staleSince && <span className="text-[13px] text-muted-foreground">{`Forecast from ${clock.format(new Date(staleSince))}`}</span>}
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        <Today today={card.today} />
        {days === null ? (
          <p className="text-sm text-muted-foreground sm:col-span-3 sm:self-center">No forecast right now</p>
        ) : (
          <ul aria-label="The next three days" className="flex flex-col sm:col-span-3 sm:grid sm:grid-cols-3 sm:gap-3">
            {days.map(({ day, expected, code }) => (
              <li key={day}
                className="grid grid-cols-[96px_minmax(0,1fr)_64px] items-center gap-2.5 border-t py-2.5 sm:flex sm:flex-col sm:items-stretch sm:rounded-lg sm:border-0 sm:bg-secondary sm:p-4">
                <span className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between">
                  <span className="text-sm sm:font-medium">{day === shiftDay(card.today.day, 1) ? "Tomorrow" : onDay(day, { weekday: "long" })}</span>
                  <span className="text-xs text-muted-foreground max-sm:hidden">{onDay(day, { month: "short", day: "numeric" })}</span>
                  <Sky code={code} className="flex sm:hidden" />
                </span>
                <span className="order-3 text-right font-mono text-sm sm:order-2 sm:flex sm:items-baseline sm:gap-1.5 sm:text-left">
                  <span className="sm:text-[28px] sm:font-semibold">{expected}</span>
                  <span className="sm:text-sm sm:text-muted-foreground"> kWh</span>
                </span>
                <span className="order-2 sm:order-3">
                  <Bar label={`${expected} kWh against a good day of ${goodDay}`} part={expected} whole={goodDay} />
                </span>
                <Sky code={code} className="hidden sm:order-4 sm:flex" />
              </li>
            ))}
          </ul>
        )}
      </div>
      {card.byHour && <TodayByHour byHour={card.byHour} />}
      <p className="text-[13px] text-muted-foreground">
        Open-Meteo&apos;s sunlight forecast, scaled by what the panels made in the last 30 days.
        {days !== null && goodDay !== null && ` Bars run to a good day, ${goodDay} kWh, the best of those 30.`} A forecast is usually within about 4
        kWh; coastal fog is the hardest to call.
      </p>
    </section>
  );
}
