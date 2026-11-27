"use client";

import { Line, LineChart, XAxis, YAxis } from "recharts";

import { DetailsBox, type Hover } from "@/components/home/chart-details";

import { Doorway } from "@/components/home/doorway";
import { Figure } from "@/components/home/today";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import type { latestFigures, MonthLoad } from "@/lib/patterns";

type Figures = ReturnType<typeof latestFigures>;
// The latest months' figures come worked out on the server: lib/patterns also reads the database.
type Props = { today: string; months: MonthLoad[]; figures: Figures };

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const monthName = (month: string) => new Date(`${month}-01T00:00:00Z`).toLocaleString("en-US", { month: "long", timeZone: "UTC" });
const signed = (n: number) => `${n > 0 ? "+" : ""}${n}`;
const yearEarlier = (month: string) => `${+month.slice(0, 4) - 1}${month.slice(4)}`;
// Three months in a row reads as a change in the house, not a month's noise.
const RUN = 3;
// Last year stands apart from the years before it, since the figures beside the chart compare against it.
const LINES = {
  this: { stroke: "var(--color-home)", strokeOpacity: 1, strokeWidth: 2.5 },
  last: { stroke: "var(--muted-foreground)", strokeOpacity: 1, strokeWidth: 1.5 },
  earlier: { stroke: "var(--muted-foreground)", strokeOpacity: 0.3, strokeWidth: 1.5 },
};

// Since when the always-on load has run above (or below) the same month a year earlier, or how the latest month compares.
function comparison(months: MonthLoad[], figures: NonNullable<Figures>) {
  if (!figures.before) return null;
  const watts = new Map(months.map((m) => [m.month, m.watts]));
  const sign = (month: string) => Math.sign((watts.get(month) ?? 0) - (watts.get(yearEarlier(month)) ?? Number.NaN));
  const latest = months.at(-1)!.month;
  let start = months.length - 1;
  while (start > 0 && watts.has(yearEarlier(months[start - 1].month)) && sign(months[start - 1].month) === sign(latest)) start--;
  const way = sign(latest) > 0 ? "above" : "below";
  if (months.length - start >= RUN && sign(latest) !== 0) return `Since ${monthName(months[start].month)} it has run ${way} last year.`;
  const change = Math.abs(figures.watts - figures.before.watts);
  return change ? `${figures.label} ran ${change} W ${way} ${figures.before.label}.` : `${figures.label} ran the same as ${figures.before.label}.`;
}


export function Habits({ today, months, figures }: Props) {
  const compared = figures && comparison(months, figures);
  // The watts, not Patterns' rounded kWh a day, say more or less: a 20 W drop rounds to -0 kWh.
  const gap = figures?.before ? figures.watts - figures.before.watts : null;
  const years = [...new Set(months.map((m) => m.month.slice(0, 4)))];
  const thisYear = today.slice(0, 4);
  const lastYear = String(+thisYear - 1);
  const line = (year: string) => LINES[year === thisYear ? "this" : year === lastYear ? "last" : "earlier"];
  const key = [[thisYear, LINES.this], [lastYear, LINES.last], ...(years.some((y) => y < lastYear) ? [["earlier years", LINES.earlier] as const] : [])] as const;
  const rows = MONTHS.map((name, i) => ({
    name,
    ...Object.fromEntries(months.filter((m) => +m.month.slice(5) === i + 1).map((m) => [m.month.slice(0, 4), m.watts])),
  }));

  return (
    <section aria-labelledby="habits" className="flex flex-col gap-8">
      <h2 id="habits" className="text-[52px] leading-[0.9] font-semibold tracking-[-0.04em] text-home md:text-[112px]">Habits</h2>
      <div className="grid items-start gap-x-14 gap-y-8 md:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex flex-col gap-3">
          <ChartContainer config={{}} className="aspect-auto h-60 w-full">
            <LineChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <XAxis dataKey="name" tickLine={false} axisLine={false} />
              <YAxis unit=" W" tickLine={false} axisLine={false} width={68} />
              <ChartTooltip content={<HabitsDetails />} />
              {years.map((year) => (
                <Line key={year} dataKey={year} {...line(year)} dot={false} isAnimationActive={false} connectNulls={false} />
              ))}
            </LineChart>
          </ChartContainer>
          <ul aria-label="Lines" className="flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-muted-foreground">
            {key.map(([name, { stroke, strokeOpacity, strokeWidth }]) => (
              <li key={name} className="flex items-center gap-2">
                <span aria-hidden className="w-4" style={{ borderTop: `${strokeWidth}px solid ${stroke}`, opacity: strokeOpacity }} />
                {name}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-5">
          <p className="text-[15px] text-pretty text-muted-foreground">
            What the house draws overnight, when everything that can sleep is asleep.{compared && ` ${compared}`}
          </p>
          {figures && <Figure value={figures.watts} unit="W" label={figures.label} className="text-3xl text-home" />}
          {figures?.before && <Figure value={figures.before.watts} unit="W" label={figures.before.label} className="text-muted-foreground" />}
          {gap !== null && <Figure value={signed(gap)} unit="W" label={`about ${signed(figures!.kwhPerDay!)} kWh a day ${gap >= 0 ? "more" : "less"} than a year ago`} />}
          <Doorway href="/patterns">The patterns behind it</Doorway>
        </div>
      </div>
    </section>
  );
}

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function HabitsDetails({ active, payload }: Hover<Record<string, number | string>>) {
  const row = payload?.[0]?.payload;
  if (!active || !row) return null;
  const years = Object.keys(row).filter((key) => key !== "name").sort().reverse();
  return <DetailsBox title={MONTH_NAMES[MONTHS.indexOf(String(row.name))]} details={years.map((year) => ({ name: year, value: `${row[year]} W` }))} />;
}
