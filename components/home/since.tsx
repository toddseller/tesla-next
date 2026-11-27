"use client";

import { Line, LineChart, ReferenceArea, ReferenceLine, XAxis, YAxis } from "recharts";

import { Doorway } from "@/components/home/doorway";
import { DetailsBox, type Hover } from "@/components/home/chart-details";
import { AxisTick } from "@/components/solar/axis-tick";
import { dollarRange, rangeExplained } from "@/lib/true-up/text";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { longDate } from "@/lib/calendar-dates";
import { yearTicks } from "@/lib/home/records";
import { niceAxis } from "@/lib/solar/day-views";
import { FIRST_DAY } from "@/lib/scene/replay";
import { energy, energyAxis } from "@/lib/units";

type Month = { month: string; solar: number; house: number };
type Year = { year: number | null; projected: boolean };
type Payback = { solar: Year & { month: string | null }; system: Year; powerwalls: { year: number | null; wont?: boolean } };
type Props = {
  today: string; months: Month[]; solar: number; matched: number; payback: Payback | null;
  // The current true-up year: its net, solar's share of the house's use so far, and True-Up's estimate of what it will owe.
  net: number; share: number | null; owed: readonly [number, number] | null; trueUpEnd: string;
};

// A pair of running totals reads in one unit, the larger one's.
const pair = (a: number, b: number) => [energy(a, 0, Math.max(a, b)).join(" "), energy(b, 0, Math.max(a, b)).join(" ")];
const monthName = (month: string) => new Date(`${month}-01T00:00:00Z`).toLocaleString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
const at = (month: string) => Date.parse(`${month}-01T00:00:00Z`);

export function Since({ today, months, solar, matched, net, share, owed, trueUpEnd, payback }: Props) {
  let [made, used] = [0, 0];
  const rows = months.map((m) => ({ t: at(m.month), solar: (made += m.solar), house: (used += m.house) }));
  const systemYear = payback?.system.year ?? null;
  // The chart ends at today, all of it real; a projected whole-system year is said under it instead.
  const end = Date.parse(today);
  const projected = systemYear !== null && payback!.system.projected;
  // The month solar paid back, once reached: the chart draws it as a dotted line and its key says it.
  const paidMonth = payback && !payback.solar.projected ? payback.solar.month : null;
  const solarPaid = payback?.solar.year ? (payback.solar.projected ? `Solar should pay for itself in ${payback.solar.year}, projected.` : `Solar paid for itself in ${payback.solar.month ? monthName(payback.solar.month) : payback.solar.year}.`) : null;
  const powerwalls = payback ? (payback.powerwalls.wont ? "The Powerwalls won't pay for themselves within their warranty." : payback.powerwalls.year ? `The Powerwalls should pay for themselves in ${payback.powerwalls.year}.` : null) : null;
  const paybackWords = [paidMonth ? null : solarPaid, powerwalls].filter(Boolean).join(" ");
  const [madeText, usedText] = pair(made, used);
  const axis = niceAxis(0, Math.max(1, made, used));
  const label = `Running totals since ${longDate(FIRST_DAY)}: solar ${madeText} against the house's ${usedText}${solarPaid ? `; ${solarPaid}` : ""}${systemYear ? ` The whole system pays back in ${systemYear}${payback!.system.projected ? ", projected" : ""}.` : ""}`;

  return (
    <section aria-labelledby="since" className="flex flex-col gap-6">
      <h2 id="since" className="text-[52px] leading-[0.9] font-semibold tracking-[-0.04em] md:text-[112px]">Since 2021</h2>
      <p className="max-w-[60ch] text-[15px] text-pretty text-muted-foreground">Everything the panels have generated, against everything the house has used, month by month since the system started.</p>
      <div className="flex flex-wrap gap-x-5 gap-y-1 font-mono text-[13px]">
        <span className="flex items-center gap-2"><span aria-hidden className="h-[3px] w-3.5 rounded-sm bg-solar" />solar generated</span>
        <span className="flex items-center gap-2"><span aria-hidden className="h-[3px] w-3.5 rounded-sm bg-home" />house used, car included</span>
      </div>
      <div role="img" aria-label={label}>
        <ChartContainer config={{}} className="aspect-auto h-64 w-full">
          <LineChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <XAxis dataKey="t" type="number" domain={[at("2021-10"), end]} ticks={yearTicks(at("2021-10"), end)} tickFormatter={(t) => String(new Date(t).getUTCFullYear())} tickLine={false} axisLine={false} />
            <YAxis tick={<AxisTick label={energyAxis(axis.ticks.at(-1)!)} />} domain={axis.domain} ticks={axis.ticks} tickLine={false} axisLine={false} width={64} />
            <ChartTooltip content={<SinceDetails />} />
            {/* Clipped at today: the year it pays back, the box runs past the axis, and Recharts would drop it whole. */}
            {systemYear && !projected && <ReferenceArea x1={Date.UTC(systemYear, 0, 1)} x2={Date.UTC(systemYear, 11, 31)} fill="var(--muted-foreground)" fillOpacity={0.08} stroke="none" ifOverflow="hidden" />}
            {paidMonth && <ReferenceLine x={at(paidMonth)} stroke="var(--foreground)" strokeDasharray="2 3" />}
            <ReferenceLine x={Date.parse(today)} stroke="var(--foreground)" label={{ value: "now", position: "insideBottomRight", fill: "var(--foreground)", fontSize: 12 }} />
            <Line dataKey="house" stroke="var(--color-home)" strokeWidth={2} dot={false} isAnimationActive={false} />
            <Line dataKey="solar" stroke="var(--color-solar)" strokeWidth={2.5} dot={false} isAnimationActive={false} />
          </LineChart>
        </ChartContainer>
      </div>
      {payback && (
        <p className="flex flex-wrap gap-x-5 gap-y-1 font-mono text-[13px] text-muted-foreground">
          {paidMonth && <span>dotted line: solar paid back, {monthName(paidMonth)}</span>}
          {systemYear && !projected && <span>shaded box: the whole system paid back in {systemYear}</span>}
        </p>
      )}
      {projected && <p className="text-[15px] text-pretty">The whole system is projected to pay back in {systemYear}.</p>}
      <div className="grid gap-x-10 gap-y-6 border-t pt-6 md:grid-cols-2">
        <div className="flex flex-col gap-3">
          <p className="text-xl leading-snug font-medium text-pretty">
            {matched >= 100
              ? <>Solar has generated as much as the house used: <span className="font-mono whitespace-nowrap text-solar">{energy(solar, 0).join(" ")}</span>, {matched}%.</>
              : <>Solar has generated <span className="font-mono whitespace-nowrap text-solar">{energy(solar, 0).join(" ")}</span>, {matched}% of what the house used.</>}
          </p>
          {share !== null && (
            <p className="text-[15px] text-pretty text-muted-foreground">
              {matched >= 100 && share < 100 && `That ${matched}% rests on the early years, when solar covered more than the house used. `}
              {rangeExplained({ name: "This true-up year", under: true, soFar: true, share, net })}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-4">
          {owed && (
            <div className="flex flex-col gap-1">
              <b className="font-mono text-2xl font-semibold">{dollarRange(owed)}</b>
              <span className="text-[13px] text-muted-foreground">{`on track to owe at the October ${trueUpEnd.slice(0, 4)} true-up`}</span>
            </div>
          )}
          {paybackWords && <p className="text-[15px] text-pretty">{paybackWords}</p>}
        </div>
      </div>
      <Doorway href="/true-up">The true-up and payback</Doorway>
    </section>
  );
}

export function SinceDetails({ active, payload }: Hover<{ t: number; solar: number; house: number }>) {
  const row = payload?.[0]?.payload;
  if (!active || !row) return null;
  const [solar, house] = pair(row.solar, row.house);
  return (
    <DetailsBox title={monthName(new Date(row.t).toISOString().slice(0, 7))} details={[
      { name: "Solar generated", value: solar, color: "var(--color-solar)" },
      { name: "House used", value: house, color: "var(--color-home)" },
    ]} />
  );
}
