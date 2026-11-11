import Link from "next/link";
import { type CSSProperties, useEffect, useRef, useState } from "react";

import { duration } from "@/lib/backup-figures";
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

type Mark = { label: string; year: number; ms: number; style: string; ring: string; solar?: boolean; month?: string | null };

// Solar's month, "2025-06", as the card writes it ("Jun '25") and as a screen reader hears it ("June 2025").
const monthName = (month: string, width: "short" | "long") =>
  new Intl.DateTimeFormat("en-US", { month: width, timeZone: "UTC" }).format(Date.parse(`${month}-01T00:00:00Z`));
const shortMonth = (month: string) => `${monthName(month, "short")} '${month.slice(2, 4)}`;

// The story chosen on the motion prototype: once the timeline is in view, the line crosses the whole track at an even
// 6 s and stops 900 ms at each mark, where it lands: the dot pops in and rings, the connector draws up, and the label
// grows past its size and settles, solar's the most.
const START_MS = 200;
const PACE_MS = 6000;
const STOP_MS = 900;
const LAND_MS = 260;
const CONNECTOR_AFTER_MS = 160;
const CONNECTOR_MS = 260;
const LABEL_AFTER_MS = 320;
const GROW_MS = 600;
const peak = (step: { solar?: boolean }) => (step.solar ? 1.4 : 1.15);
// Solar's month fades in once its label has settled, while its 28 px connector shrinks down from the label to 12 px.
const MONTH_AFTER_MS = LABEL_AFTER_MS + GROW_MS;
const MONTH_MS = 400;
const SHRUNK = 12 / 28;
const MONTH_ALIGN = { start: "left-0", center: "left-1/2 -translate-x-1/2", end: "right-0" };
const DASHES = (angle: number) => `repeating-linear-gradient(${angle}deg, var(--color-solar) 0 8px, transparent 8px 14px)`;

type Stretch = { from: number; to: number; dashed: boolean; delay: number; duration: number };

// Once in view, the line travels from mark to mark at an even pace, solid up to today and dashed to
// `dashedTo`; each mark gets the time its stop starts. A mark past the drawn line stops where the line already is.
function story(shares: number[], today: number, dashedTo: number | null) {
  const drawn = dashedTo ?? today;
  const stretches: Stretch[] = [];
  const stops: number[] = [];
  let [time, at] = [START_MS, 0];
  for (const share of shares) {
    const to = Math.min(share, drawn);
    while (at < to) {
      const dashed = at >= today;
      const end = dashed ? to : Math.min(to, today);
      stretches.push({ from: at, to: end, dashed, delay: time, duration: (end - at) * PACE_MS });
      [time, at] = [time + (end - at) * PACE_MS, end];
    }
    stops.push(time);
    time += STOP_MS;
  }
  return { stretches, stops, length: time };
}

// Waiting, a piece is hidden (shown again without JavaScript or with reduced motion, app/motion.css); playing, it plays
// its part from `delay`; done, it's drawn as it is, so a later render never replays it.
type Phase = "waiting" | "playing" | "done";
const motion = (phase: Phase, name: string, delay: number, duration: number): { className: string; style: CSSProperties } =>
  phase === "waiting" ? { className: "motion-waiting", style: {} }
    : phase === "playing" ? { className: name, style: { animationDelay: `${delay}ms`, animationDuration: `${duration}ms` } }
      : { className: "", style: {} };

export function PaybackCard({ payback, today }: { payback: Payback; today: string }) {
  const { solar, system, powerwalls, outages } = payback;
  const now = Date.parse(`${today}T00:00:00Z`);
  const thisYear = Number(today.slice(0, 4));
  // A year's marker sits mid-year; solar's sits mid-month, the month being the one finer figure that leaves the server.
  const midYear = (year: number) => Date.parse(`${year}-07-01T00:00:00Z`);
  const marks = ([
    solar.year !== null && { label: solar.projected ? "Solar (projected)" : "Solar paid back", year: solar.year, ms: solar.month ? Date.parse(`${solar.month}-15T00:00:00Z`) : midYear(solar.year), style: solar.projected ? "border-2 border-solar bg-card" : "bg-solar", ring: "bg-solar", solar: true, month: solar.month ? shortMonth(solar.month) : null },
    { label: "Today", year: thisYear, ms: now, style: "border-2 border-muted-foreground bg-card", ring: "bg-muted-foreground" },
    system.year !== null && { label: system.projected ? "Whole system (projected)" : "Whole system paid", year: system.year, ms: midYear(system.year), style: system.projected ? "border-2 border-solar bg-card" : "bg-solar", ring: "bg-solar" },
    { label: "Powerwall warranty ends", year: WARRANTY_ENDS, ms: WARRANTY, style: "bg-powerwall", ring: "bg-powerwall" },
  ] as (Mark | false)[]).filter((mark): mark is Mark => Boolean(mark)).sort((a, b) => a.ms - b.ms);
  const last = Math.max(...marks.map((mark) => mark.year));
  // From 2022, the first January 1 after PTO.
  const ticks = Array.from({ length: Math.ceil((last - 2022) / 2) + 1 }, (_, i) => 2022 + 2 * i);
  const to = yearStart(ticks.at(-1)! + 1);
  const share = (ms: number) => (ms - FROM) / (to - FROM);
  const at = (ms: number) => `${share(ms) * 100}%`;
  // Labels near the ends hang inward, so they stay inside the card.
  const align = (ms: number) => (share(ms) > 0.85 ? "end" : share(ms) < 0.1 ? "start" : "center");
  const ALIGN = { start: "items-start", center: "-translate-x-1/2 items-center", end: "-translate-x-full items-end" };
  const dashedTo = system.year !== null && system.projected && midYear(system.year) > now ? share(midYear(system.year)) : null;
  const { stretches, stops, length } = story(marks.map((mark) => share(mark.ms)), share(now), dashedTo);
  // The card is below the fold on desktop: the story waits until half the timeline is in view, then plays once.
  const [phase, setPhase] = useState<Phase>("waiting");
  const timeline = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (phase !== "waiting") return;
    // A browser that can't tell when the card is in view gets the finished timeline, not one that never appears.
    if (typeof IntersectionObserver !== "function") return setPhase("done");
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      setPhase("playing");
    }, { threshold: 0.5 });
    if (timeline.current) observer.observe(timeline.current);
    return () => observer.disconnect();
  }, [phase]);
  useEffect(() => {
    if (phase !== "playing") return;
    const timer = setTimeout(() => setPhase("done"), length);
    return () => clearTimeout(timer);
  }, [phase, length]);
  const spoken = [
    "Timeline from October 2021, when the system went in",
    solar.year !== null && `solar ${solar.projected ? "is projected to pay" : "paid"} for itself in ${solar.month ? `${monthName(solar.month, "long")} ${solar.year}` : solar.year}`,
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
      <div ref={timeline} role="img" aria-label={`${spoken[0]}: ${spoken.slice(1).join(", ")}`}>
        {/* Across the card on wider screens, down it on a phone. */}
        <div aria-hidden className="hidden flex-col gap-2 sm:flex">
          {/* Neighbouring labels take turns between two rows, so close years don't overlap. */}
          <div data-part="timeline" className="relative" style={{ height: HEIGHT }}>
            <div data-part="track" className="absolute inset-x-0 rounded-full bg-input" style={BAR} />
            {/* One stretch per stop, so the line can pause at each mark; only the ends are rounded, as one bar's were. */}
            {stretches.map((stretch, i) => {
              const drawing = motion(phase, "motion-stretch", stretch.delay, stretch.duration);
              const ends = stretch.dashed ? "" : `bg-solar ${i === 0 ? "rounded-l-full" : ""} ${stretches[i + 1]?.dashed !== false ? "rounded-r-full" : ""}`;
              return (
                <div key={stretch.from} data-part={stretch.dashed ? "projection" : "stretch"} className={`absolute ${ends} ${drawing.className}`}
                  style={{ ...BAR, left: `${stretch.from * 100}%`, width: `${(stretch.to - stretch.from) * 100}%`, ...(stretch.dashed && { background: DASHES(90) }), ...drawing.style }} />
              );
            })}
            {marks.map((mark, i) => {
              const label = motion(phase, "motion-grow", stops[i] + LABEL_AFTER_MS, GROW_MS);
              const connector = mark.month && phase === "playing"
                ? { className: "motion-raise-shrink", style: {
                  animationDelay: `${stops[i] + CONNECTOR_AFTER_MS}ms, ${stops[i] + MONTH_AFTER_MS}ms`,
                  animationDuration: `${CONNECTOR_MS}ms, ${MONTH_MS}ms`, "--shrink": SHRUNK,
                } as CSSProperties }
                : motion(phase, "motion-raise", stops[i] + CONNECTOR_AFTER_MS, CONNECTOR_MS);
              // At rest the month stands over the connector's top 16 px, so the connector keeps 12 and the label its height.
              const shrunk = mark.month && phase !== "playing" ? { transform: `scaleY(${SHRUNK})` } : {};
              const month = motion(phase, "motion-fade", stops[i] + MONTH_AFTER_MS, MONTH_MS);
              const dot = motion(phase, "motion-land", stops[i], LAND_MS);
              return (
                <div key={mark.label} data-part="mark" data-row={i % 2} data-align={align(mark.ms)}
                  className={`absolute flex flex-col text-xs whitespace-nowrap ${ALIGN[align(mark.ms)]}`}
                  style={{ left: at(mark.ms), bottom: HEIGHT - LINE - DOT / 2 }}>
                  <span data-part="label" className={`origin-bottom ${label.className}`} style={{ ...label.style, "--peak": peak(mark) } as CSSProperties}>{mark.label}</span>
                  {mark.month && (
                    <span data-part="month" className={`absolute font-mono leading-4 text-muted-foreground ${MONTH_ALIGN[align(mark.ms)]} ${month.className}`}
                      style={{ bottom: DOT + 28 * SHRUNK, ...month.style }}>{mark.month}</span>
                  )}
                  <span data-part="connector" className={`w-px origin-bottom bg-input ${connector.className}`} style={{ height: i % 2 ? 10 : 28, ...shrunk, ...connector.style }} />
                  <span className="relative block" style={{ width: DOT, height: DOT }}>
                    {phase === "playing" && <span data-part="ring" className={`motion-ring absolute inset-0 rounded-full ${mark.ring}`} style={{ animationDelay: `${stops[i]}ms` }} />}
                    <span data-part="dot" className={`relative block rounded-full shadow-[0_0_0_3px_var(--card)] ${mark.style} ${dot.className}`}
                      style={{ width: DOT, height: DOT, ...dot.style }} />
                  </span>
                </div>
              );
            })}
          </div>
          <div className="relative h-4 font-mono text-xs text-muted-foreground">
            {ticks.map((year) => <span key={year} data-part="tick" className="absolute -translate-x-1/2" style={{ left: at(yearStart(year)) }}>{year}</span>)}
          </div>
        </div>
        <ol aria-hidden className="flex flex-col sm:hidden">
          {[{ label: "System went in (PTO)", year: 2021, ms: FROM, style: "bg-muted-foreground", ring: "bg-muted-foreground" } as Mark, ...marks]
            .map((step, i, steps) => {
              // The step's stop, PTO's being the story's start; the rail below it draws on to the next step's stop.
              const stop = i === 0 ? START_MS : stops[i - 1];
              const next = steps[i + 1];
              const rail = !next ? null : next.ms <= now ? "solid" : dashedTo !== null && share(next.ms) <= dashedTo ? "dashed" : "grey";
              const start = i === 0 ? START_MS : stop + STOP_MS;
              const drawing = motion(phase, rail === "grey" ? "" : "motion-drop", start, stops[i] - start);
              const dot = motion(phase, "motion-land", stop, LAND_MS);
              const text = motion(phase, "motion-grow", i === 0 ? START_MS : stop + LABEL_AFTER_MS, GROW_MS);
              const month = motion(phase, "motion-fade", stop + MONTH_AFTER_MS, MONTH_MS);
              return (
                <li key={step.label} className="flex gap-3.5">
                  <span className="relative flex w-3 shrink-0 flex-col items-center">
                    {/* The track behind the dot (4 px above it, 12 px tall), so it runs unbroken before the dots appear; from
                        the first dot's centre and to the last one's. Placed without a transform, which drew it a device
                        pixel off the rails. */}
                    <span data-part="track-bridge" aria-hidden className="absolute left-[calc(50%-1.5px)] w-[3px] bg-input"
                      style={{ top: i === 0 ? 10 : 0, height: (next ? 16 : 10) - (i === 0 ? 10 : 0) }} />
                    <span className="relative mt-1 size-3">
                      {phase === "playing" && <span data-part="ring" className={`motion-ring absolute inset-0 rounded-full ${step.ring}`} style={{ animationDelay: `${stop}ms` }} />}
                      <span data-part="dot" className={`absolute inset-0 rounded-full ${step.style} ${dot.className}`} style={dot.style} />
                    </span>
                    {/* The grey track, as across the card, with the drawn line over it. */}
                    {rail && (
                      <span data-part="rail-track" className="relative min-h-7 w-[3px] flex-1 bg-input">
                        <span data-part="rail" className={`absolute inset-0 ${rail === "solid" ? "bg-solar" : rail === "grey" ? "bg-input" : ""} ${drawing.className}`}
                          style={{ ...(rail === "dashed" && { background: DASHES(180) }), ...drawing.style }} />
                      </span>
                    )}
                  </span>
                  <span data-part="step-text" className={`flex origin-left flex-col pb-3 ${text.className}`} style={{ ...text.style, "--peak": peak(step) } as CSSProperties}>
                    <span className="font-mono text-[15px] font-semibold">{step.year}</span>
                    <span className="text-[13px] text-muted-foreground">
                      {step.label}
                      {step.month && <span data-part="month" className={`font-mono ${month.className}`} style={month.style}>{` · ${step.month}`}</span>}
                    </span>
                  </span>
                </li>
              );
            })}
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
            {`What they did instead: ${outages.count} outages, ${duration(outages.seconds)} off the grid${outages.longest_seconds !== null ? `, the longest ${duration(outages.longest_seconds)}` : ""}`}
          </Link>
        )}
      </div>
      <p className="text-[13px] text-muted-foreground">
        Years, and the month solar paid back. &apos;21 - &apos;22 and &apos;22 - &apos;23 are estimated from &apos;23 - &apos;24 by solar output and the average rate in PG&amp;E
        and Peninsula Clean Energy&apos;s rate comparisons; the federal credit is taken as a rate on the cost.
      </p>
    </section>
  );
}
