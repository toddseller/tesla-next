import Link from "next/link";

import type { Payback } from "@/lib/true-up/payback";

// The timeline runs from PTO through the end of the Powerwalls' 10-year warranty, or a later year it has to show, with a
// tick every other year.
const FROM = Date.parse("2021-10-22T00:00:00Z");
const WARRANTY = Date.parse("2031-10-22T00:00:00Z");
const WARRANTY_ENDS = 2031;
const yearStart = (year: number) => Date.parse(`${year}-01-01T00:00:00Z`);
// The track and every dot share one centre line, so the dots sit on it.
const HEIGHT = 80;
const LINE = 56;
const DOT = 14;
const BAR = { top: LINE - 2, height: 4 };

function heading({ solar, system }: Payback) {
  if (solar.year === null) return "Solar's payback can't be projected yet";
  const own = solar.projected ? `Solar is projected to pay for itself in ${solar.year}` : `Solar paid for itself in ${solar.year}`;
  if (system.year === null) return own;
  if (!system.projected) return `${own}, and paid for the whole system in ${system.year}`;
  return solar.projected ? `${own}, and for the whole system in ${system.year}` : `${own}, and is projected to pay for the whole system in ${system.year}`;
}

type Mark = { label: string; year: number; ms: number; style: string };

export function PaybackCard({ payback, today }: { payback: Payback; today: string }) {
  const { solar, system, powerwalls, outages } = payback;
  const now = Date.parse(`${today}T00:00:00Z`);
  const thisYear = Number(today.slice(0, 4));
  // A year's marker sits mid-year, since only the year leaves the server.
  const midYear = (year: number) => Date.parse(`${year}-07-01T00:00:00Z`);
  const marks: Mark[] = [
    solar.year !== null && { label: solar.projected ? "Solar (projected)" : "Solar paid back", year: solar.year, ms: midYear(solar.year), style: solar.projected ? "border-2 border-solar bg-card" : "bg-solar" },
    { label: "Today", year: thisYear, ms: now, style: "border-2 border-muted-foreground bg-card" },
    system.year !== null && { label: system.projected ? "Whole system (projected)" : "Whole system paid", year: system.year, ms: midYear(system.year), style: system.projected ? "border-2 border-solar bg-card" : "bg-solar" },
    { label: "Powerwall warranty ends", year: WARRANTY_ENDS, ms: WARRANTY, style: "bg-powerwall" },
  ].filter((mark): mark is Mark => Boolean(mark)).sort((a, b) => a.ms - b.ms);
  const last = Math.max(...marks.map((mark) => mark.year));
  // From 2022, the first January 1 after PTO.
  const ticks = Array.from({ length: Math.ceil((last - 2022) / 2) + 1 }, (_, i) => 2022 + 2 * i);
  const to = yearStart(ticks.at(-1)! + 1);
  const share = (ms: number) => (ms - FROM) / (to - FROM);
  const at = (ms: number) => `${share(ms) * 100}%`;
  // Labels near the ends hang inward, so they stay inside the card.
  const align = (ms: number) => (share(ms) > 0.85 ? "end" : share(ms) < 0.1 ? "start" : "center");
  const ALIGN = { start: "items-start", center: "-translate-x-1/2 items-center", end: "-translate-x-full items-end" };
  const spoken = [
    "Timeline from October 2021, when the system went in",
    solar.year !== null && `solar ${solar.projected ? "is projected to pay" : "paid"} for itself in ${solar.year}`,
    `today is ${thisYear}`,
    system.year !== null && `solar ${system.projected ? "is projected to pay" : "paid"} for the whole system in ${system.year}`,
    `the Powerwall warranty ends in ${WARRANTY_ENDS}`,
  ].filter(Boolean);
  return (
    <section aria-labelledby="payback" className="flex flex-col gap-5 rounded-[10px] border bg-card px-4 py-5 sm:px-6">
      <div className="flex flex-col gap-0.5">
        <h2 id="payback" className="font-semibold">Payback</h2>
        <p className="text-sm text-muted-foreground">{heading(payback)}</p>
      </div>
      <div role="img" aria-label={`${spoken[0]}: ${spoken.slice(1).join(", ")}`}>
        {/* Across the card on wider screens, down it on a phone. */}
        <div aria-hidden className="hidden flex-col gap-2 sm:flex">
          {/* Neighbouring labels take turns between two rows, so close years don't overlap. */}
          <div data-part="timeline" className="relative" style={{ height: HEIGHT }}>
            <div data-part="track" className="absolute inset-x-0 rounded-full bg-input" style={BAR} />
            <div className="absolute left-0 rounded-full bg-solar" style={{ ...BAR, width: at(now) }} />
            {system.year !== null && system.projected && midYear(system.year) > now && (
              <div data-part="projection" className="absolute" style={{
                ...BAR, left: at(now), width: `${(share(midYear(system.year)) - share(now)) * 100}%`,
                background: "repeating-linear-gradient(90deg, var(--color-solar) 0 8px, transparent 8px 14px)",
              }} />
            )}
            {marks.map((mark, i) => (
              <div key={mark.label} data-part="mark" data-row={i % 2} data-align={align(mark.ms)}
                className={`absolute flex flex-col text-xs whitespace-nowrap ${ALIGN[align(mark.ms)]}`}
                style={{ left: at(mark.ms), bottom: HEIGHT - LINE - DOT / 2 }}>
                <span>{mark.label}</span>
                <span className="w-px bg-input" style={{ height: i % 2 ? 10 : 28 }} />
                <span data-part="dot" className={`rounded-full shadow-[0_0_0_3px_var(--card)] ${mark.style}`} style={{ width: DOT, height: DOT }} />
              </div>
            ))}
          </div>
          <div className="relative h-4 font-mono text-xs text-muted-foreground">
            {ticks.map((year) => <span key={year} data-part="tick" className="absolute -translate-x-1/2" style={{ left: at(yearStart(year)) }}>{year}</span>)}
          </div>
        </div>
        <ol aria-hidden className="flex flex-col sm:hidden">
          {[{ label: "System went in (PTO)", year: 2021, ms: FROM, style: "bg-muted-foreground" }, ...marks]
            .map((step, i, steps) => (
              <li key={step.label} className="flex gap-3.5">
                <span className="flex w-3 shrink-0 flex-col items-center">
                  <span data-part="dot" className={`mt-1 size-3 rounded-full ${step.style}`} />
                  {i < steps.length - 1 && <span data-part="rail" className={`min-h-7 w-[3px] flex-1 ${step.ms < now ? "bg-solar" : "bg-input"}`} />}
                </span>
                <span className="flex flex-col pb-3">
                  <span className="font-mono text-[15px] font-semibold">{step.year}</span>
                  <span className="text-[13px] text-muted-foreground">{step.label}</span>
                </span>
              </li>
            ))}
        </ol>
      </div>
      <div className="flex flex-col gap-1 border-t pt-3.5 text-sm">
        <p>
          {powerwalls.wont
            ? "The Powerwalls won't pay for themselves in dollars before their warranty ends."
            : `The Powerwalls are projected to pay for themselves in ${powerwalls.year}.`}
        </p>
        {powerwalls.wont && (
          <Link href="/impact?backup=all" className="text-[13px] text-muted-foreground hover:text-foreground">
            {`What they did instead: ${outages.count} outages, ${outages.hours} h off the grid${outages.longest_hours !== null ? `, the longest ${outages.longest_hours} h` : ""}`}
          </Link>
        )}
      </div>
      <p className="text-[13px] text-muted-foreground">
        Years only. &apos;21 - &apos;22 and &apos;22 - &apos;23 are estimated from &apos;23 - &apos;24 by solar output and the average rate in PG&amp;E
        and Peninsula Clean Energy&apos;s rate comparisons; the federal credit is taken as a rate on the cost.
      </p>
    </section>
  );
}
