import { skyOf } from "@/components/solar/sky";
import type { ForecastCard as Card, SkyWhen } from "@/lib/forecast";
import { shiftDay, TIME_ZONE } from "@/lib/scene/replay";

const clock = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: TIME_ZONE });
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
      <p className="text-[13px] text-muted-foreground">
        Open-Meteo&apos;s sunlight forecast, scaled by what the panels made in the last 30 days.
        {days !== null && goodDay !== null && ` Bars run to a good day, ${goodDay} kWh, the best of those 30.`} A forecast is usually within about 4
        kWh; coastal fog is the hardest to call.
      </p>
    </section>
  );
}
