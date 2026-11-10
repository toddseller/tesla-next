import { monthLabel } from "@/components/patterns/always-on";
import { type HourLoad, type HourMonth, hourGrids, stepOf } from "@/lib/patterns";

// Spelled out so Tailwind keeps every step's class.
const STEPS = ["bg-use-1", "bg-use-2", "bg-use-3", "bg-use-4", "bg-use-5", "bg-use-6", "bg-use-7"];
const KEY = ["0.5", "1", "1.5", "2", "2.5", "3", "3.5+"];
const AXIS: Record<number, [string, string]> = { 0: ["12a", "12 AM"], 6: ["6a", "6 AM"], 12: ["12p", "Noon"], 18: ["6p", "6 PM"] };

const hourName = (hour: number) => `${hour % 12 || 12} ${hour < 12 ? "AM" : "PM"}`;

function Grid({ caption, months }: { caption: string; months: HourMonth[] }) {
  return (
    <table className="w-full table-fixed border-separate border-spacing-px sm:border-spacing-0.5">
      <caption className="pb-2 text-left text-[15px] font-medium">{caption}</caption>
      <thead>
        <tr>
          <td className="w-[52px] sm:w-14" />
          {Array.from({ length: 24 }, (_, hour) => (
            <th key={hour} scope="col" className="p-0 text-left font-mono text-[10px] font-normal whitespace-nowrap text-muted-foreground sm:text-xs">
              <span className="sr-only">{hourName(hour)}</span>
              {AXIS[hour] && (
                <span aria-hidden>
                  <span className="sm:hidden">{AXIS[hour][0]}</span>
                  <span className="max-sm:hidden">{AXIS[hour][1]}</span>
                </span>
              )}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {months.map(({ month, watts }) => (
          <tr key={month}>
            <th scope="row" className="pr-1.5 text-left font-mono text-[11px] font-normal whitespace-nowrap text-muted-foreground sm:text-xs">
              <span className="sr-only">{monthLabel(month, "long")}</span>
              <span aria-hidden>{`${monthLabel(month, "short")} '${month.slice(2, 4)}`}</span>
            </th>
            {watts.map((w, hour) => (
              <td key={hour} className="p-0">
                <span data-part="square" className={`block h-3.5 rounded-[2px] sm:h-[18px] ${w === null ? "border border-border" : STEPS[stepOf(w)]}`}>
                  <span className="sr-only">{w === null ? "no readings" : `${(w / 1000).toFixed(1)} kW`}</span>
                </span>
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function HouseUseSection({ hours, today }: { hours: HourLoad[]; today: string }) {
  const { last, before } = hourGrids(hours, today);
  return (
    <section aria-labelledby="house-use" className="flex flex-col gap-5 rounded-[10px] border bg-card p-4 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 id="house-use" className="text-sm font-medium tracking-[0.06em] text-muted-foreground uppercase">When the house uses power</h2>
          <p className="text-sm text-muted-foreground">The house&apos;s average draw in each hour of the day, month by month, from every source</p>
        </div>
        {hours.length > 0 && (
          <div data-part="key" aria-hidden className="flex items-end gap-2 font-mono text-[11px] text-muted-foreground sm:text-xs">
            <div className="grid grid-cols-[repeat(7,36px)] sm:grid-cols-[repeat(7,40px)]">
              {KEY.map((label, i) => (
                <span key={label} data-part="step" className="flex flex-col gap-1">
                  {label}
                  <span className={`block h-2.5 sm:h-3 ${STEPS[i]}`} />
                </span>
              ))}
            </div>
            <span>kW</span>
          </div>
        )}
      </div>
      {hours.length === 0 ? (
        <p className="text-sm text-muted-foreground">No readings yet</p>
      ) : (
        <>
          <div className="grid gap-8 lg:grid-cols-2">
            <Grid caption="The last 12 months" months={last} />
            <Grid caption="The 12 months before" months={before} />
          </div>
          <p className="text-[13px] text-muted-foreground">
            Each square is the house&apos;s average use in that hour across the month, whether it came from solar, the Powerwalls or
            the grid. Both grids share one scale.
          </p>
        </>
      )}
    </section>
  );
}
