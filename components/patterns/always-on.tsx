import { lastTwelve, latestFigures, type MonthLoad, sameMonth } from "@/lib/patterns";

const watts = (w: number) => `${w.toLocaleString("en-US")} W`;
const share = (w: number, top: number) => `${(100 * w) / top}%`;
export const monthLabel = (month: string, style: "long" | "short" | "narrow") =>
  new Date(`${month}-01T00:00:00Z`).toLocaleString("en-US", { month: style, ...(style === "long" && { year: "numeric" }), timeZone: "UTC" });
// From zero to at least 1 kW, up to the next quarter kW, so a very high month can't run off the chart.
const scaleTop = (values: number[]) => Math.max(1000, Math.ceil(Math.max(...values) / 250) * 250);

function Figure({ label, value, after }: { label: string; value: string; after?: string }) {
  return (
    <p className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground sm:text-[13px]">{label}</span>
      <span className="flex flex-col sm:flex-row sm:items-baseline sm:gap-1.5">
        <span className="font-mono text-xl font-semibold sm:text-[28px]">{value}</span>
        {after && <span className="text-xs text-muted-foreground sm:text-sm">{after}</span>}
      </span>
    </p>
  );
}

function Figures({ months, today }: { months: MonthLoad[]; today: string }) {
  const latest = latestFigures(months, today)!;
  const { kwhPerDay, before } = latest;
  return (
    <div className="grid w-full grid-cols-3 gap-2 sm:flex sm:w-auto sm:gap-7">
      <Figure label={latest.label} value={watts(latest.watts)} />
      {before && (
        <>
          <Figure label={before.label} value={watts(before.watts)} />
          <Figure label="Difference" value={`${kwhPerDay! > 0 ? "+" : ""}${kwhPerDay} kWh`} after="a day" />
        </>
      )}
    </div>
  );
}

function SameMonth({ months }: { months: MonthLoad[] }) {
  const { name, rows } = sameMonth(months);
  const top = scaleTop(rows.map((row) => row.watts));
  return (
    <div className="flex flex-col gap-3">
      <h3 id="same-month" className="text-[15px] font-medium">{`${name} in each year`}</h3>
      <div role="table" aria-labelledby="same-month" className="flex flex-col gap-2">
        {rows.map((row, i) => {
          const latest = i === rows.length - 1;
          return (
            <div role="row" key={row.year} className={`grid min-h-7 grid-cols-[52px_minmax(0,1fr)_64px] items-center gap-2.5 text-sm sm:grid-cols-[110px_minmax(0,1fr)_80px] sm:gap-3.5 ${latest ? "" : "text-muted-foreground"}`}>
              <span role="rowheader">{row.year}</span>
              <span aria-hidden className="h-3 overflow-hidden rounded bg-secondary sm:h-3.5">
                <span className={`block h-full rounded ${latest ? "bg-home" : "bg-muted-foreground/40"}`} style={{ width: share(row.watts, top) }} />
              </span>
              <span role="cell" className="text-right font-mono">{watts(row.watts)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LastTwelve({ months: all }: { months: MonthLoad[] }) {
  const months = lastTwelve(all);
  const top = scaleTop(months.flatMap(({ watts, before }) => [watts ?? 0, before ?? 0]));
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 id="last-twelve" className="text-[15px] font-medium">The last 12 months</h3>
        <div aria-hidden className="flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-muted-foreground">
          <span className="flex items-center gap-2"><span className="size-3 rounded-[3px] bg-home" />That month</span>
          <span className="flex items-center gap-2"><span className="h-[3px] w-4 rounded-sm bg-foreground" />A year earlier</span>
        </div>
      </div>
      <div className="flex gap-1.5 pt-2 sm:gap-2.5">
        <div aria-hidden className="-mt-1.5 flex h-[170px] w-8 flex-col justify-between text-right font-mono text-[11px] text-muted-foreground sm:h-[200px] sm:w-10 sm:text-xs">
          <span>{top / 1000} kW</span><span>{(top / 2).toLocaleString("en-US")}</span><span>0</span>
        </div>
        <div className="relative min-w-0 flex-1">
          <span aria-hidden className="absolute inset-x-0 top-0 border-t border-dashed border-input" />
          <span aria-hidden className="absolute inset-x-0 top-[85px] border-t border-dashed border-input sm:top-[100px]" />
          <span aria-hidden className="absolute inset-x-0 top-[170px] border-t border-input sm:top-[200px]" />
          <ol aria-labelledby="last-twelve" className="flex gap-1.5 sm:gap-3.5">
            {months.map(({ month, watts: now, before }) => (
              <li key={month} className="flex min-w-0 flex-1 flex-col gap-1.5">
                <span className="sr-only">
                  {`${monthLabel(month, "long")}: ${now === null ? "no counted nights" : watts(now)}, ${before === null ? "no figure a year earlier" : `a year earlier ${watts(before)}`}`}
                </span>
                <span aria-hidden className="relative flex h-[170px] items-end sm:h-[200px]">
                  {now !== null && <span data-part="bar" className="block w-full rounded-t-[3px] bg-home sm:rounded-t" style={{ height: share(now, top) }} />}
                  {before !== null && (
                    <span data-part="year-earlier" className="absolute -inset-x-0.5 h-[3px] rounded-sm bg-foreground sm:-inset-x-1" style={{ bottom: share(before, top) }} />
                  )}
                </span>
                <span aria-hidden className="text-center font-mono text-[11px] text-muted-foreground sm:text-xs">
                  <span className="sm:hidden">{monthLabel(month, "narrow")}</span>
                  <span className="max-sm:hidden">{monthLabel(month, "short")}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

export function AlwaysOnSection({ months, today }: { months: MonthLoad[]; today: string }) {
  return (
    <section aria-labelledby="always-on" className="flex flex-col gap-6 rounded-[10px] border bg-card p-4 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 id="always-on" className="text-sm font-medium tracking-[0.06em] text-muted-foreground uppercase">Always-on load</h2>
          <p className="text-sm text-muted-foreground">What the house draws when everything that can sleep is asleep</p>
        </div>
        {months.length > 0 && <Figures months={months} today={today} />}
      </div>
      {months.length === 0 ? (
        <p className="text-sm text-muted-foreground">No overnight readings yet</p>
      ) : (
        <>
          <SameMonth months={months} />
          <hr />
          <LastTwelve months={months} />
          <p className="text-[13px] text-muted-foreground">
            A month&apos;s figure is its middle night: the house&apos;s lowest 5 minutes between 1 and 5 AM. A car charge or spike that
            doesn&apos;t last the whole night doesn&apos;t move it.
          </p>
        </>
      )}
    </section>
  );
}
