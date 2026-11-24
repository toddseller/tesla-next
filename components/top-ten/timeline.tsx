import { type CSSProperties, useEffect, useRef, useState } from "react";

import { type Entry, FLOW_DOT, type Flow, withUnit } from "@/components/top-ten/entries";
import { outageTick } from "@/lib/backup-figures";
import { niceAxis } from "@/lib/solar/day-views";

const utc = (day: string) => Date.parse(`${day}T00:00:00Z`);
const percent = (share: number) => `${(100 * share).toFixed(2)}%`;

type Dot = { rank: number; x: number; y: number };
type Box = { left: number; right: number; top: number; bottom: number };
type RankLabel = { text: string; first: number; left: number; top: number; line?: [number, number, number, number] };

const PLOT = 200;
// shortcut: 11px Plex Mono assumed 6.7px a character rather than measured; measure if the font changes.
const CHAR = 6.7;
const CLEAR = 8;
const STEPS = [0, -12, 12, -24, 24, -36, 36];
const overlaps = (a: Box, b: Box) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

export function placeRanks(dots: Dot[], width: number): RankLabel[] {
  const groups: Dot[][] = [];
  for (const dot of dots) {
    const near = groups.filter((g) => g.some((o) => Math.hypot(o.x - dot.x, o.y - dot.y) < 6));
    const merged = [...near.flat(), dot].sort((a, b) => a.rank - b.rank);
    groups.splice(0, groups.length, ...groups.filter((g) => !near.includes(g)), merged);
  }
  groups.sort((a, b) => a[0].rank - b[0].rank);

  const placed: Box[] = [];
  return groups.map((group) => {
    const [lead] = group;
    const text = group.map((d) => d.rank).join(", ");
    const w = text.length * CHAR;
    const gap = lead.rank === 1 ? 13 : CLEAR;
    // A rank level with another dot reads as that dot's unless it is twice as far from it as from its own.
    const others = dots.filter((d) => !group.includes(d)).flatMap((d) => [
      { left: d.x - CLEAR, right: d.x + CLEAR, top: d.y - CLEAR, bottom: d.y + CLEAR },
      { left: d.x - 2 * CLEAR, right: d.x + 2 * CLEAR, top: d.y, bottom: d.y },
    ]);
    const sides = lead.x + gap + w > width ? [-1, 1] : [1, -1];
    const spots = STEPS.flatMap((dy) => sides.map((side) => ({ dy, left: side > 0 ? lead.x + gap : lead.x - gap - w })));
    const box = ({ dy, left }: { dy: number; left: number }) => ({ left, right: left + w, top: lead.y + dy - 6, bottom: lead.y + dy + 6 });
    const spot = spots.find((s) => {
      const b = box(s);
      return b.top >= -CLEAR && b.bottom <= PLOT + CLEAR && ![...placed, ...others].some((o) => overlaps(o, b));
    }) ?? spots[0];
    const b = box(spot);
    placed.push(b);
    const line: RankLabel["line"] = spot.dy ? [lead.x, lead.y, b.left > lead.x ? b.left - 1 : b.right + 1, lead.y + spot.dy] : undefined;
    return { text, first: lead.rank, left: b.left, top: lead.y + spot.dy, line };
  });
}

// Positioned HTML rather than Recharts, whose ResponsiveContainer serves an empty box until the browser measures it.
export function Timeline({ label, entries, flow, today }: { label: string; entries: Entry[]; flow: Flow; today: string }) {
  const year = Number(today.slice(0, 4));
  const [from, to] = [utc("2021-10-01"), utc(`${year}-12-31`)];
  const across = (day: string) => (utc(day) - from) / (to - from);
  const left = (day: string) => percent(across(day));
  const figures = entries.map((e) => e.figure);
  // At least 1 kWh (or hour) tall, so a single entry still has an axis.
  const { domain: [low, high], ticks } = niceAxis(Math.min(...figures), Math.max(...figures, Math.min(...figures) + 1));
  // Outages read in days and hours, as their dots do; the rest in the entries' own unit, so the axis matches the ranking.
  const tick = entries[0]?.unit === "" ? outageTick : (t: number) => (entries[0].unit === "MWh" ? t / 1000 : t).toLocaleString("en-US");
  const down = (figure: number) => (high - figure) / (high - low);
  const top = (figure: number) => percent(down(figure));
  const years = Array.from({ length: year - 2021 }, (_, i) => 2022 + i);

  // The ranks are placed in pixels, so they wait for the plot's width.
  const plot = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const element = plot.current!;
    const measure = () => setWidth(element.clientWidth);
    measure();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    observer?.observe(element);
    return () => observer?.disconnect();
  }, []);
  const labels = width ? placeRanks(entries.map((e) => ({ rank: e.rank, x: width * across(e.when), y: PLOT * down(e.figure) })), width) : [];

  return (
    <div
      role="img"
      aria-label={`${label}: ${entries.map((e) => `#${e.rank} ${withUnit(e)} ${e.date}`).join("; ")}`}
      className={`grid ${entries[0]?.unit === "" ? "grid-cols-[72px_minmax(0,1fr)]" : "grid-cols-[44px_minmax(0,1fr)]"} grid-rows-[200px_22px] font-mono text-xs text-muted-foreground`}
    >
      <div aria-hidden className="relative">
        {ticks.map((t) => (
          <span key={t} className="absolute right-2 -translate-y-1/2 whitespace-nowrap" style={{ top: top(t) }}>{tick(t)}</span>
        ))}
      </div>
      <div ref={plot} aria-hidden className="relative border-b border-l border-input">
        {ticks.map((t) => <span key={t} className="absolute inset-x-0 border-t border-border" style={{ top: top(t) }} />)}
        {years.map((y) => <span key={y} className="absolute inset-y-0 border-l border-dashed border-border" style={{ left: left(`${y}-01-01`) }} />)}
        <span className="absolute inset-y-0 right-0 bg-muted-foreground/[0.08]" style={{ left: left(`${year}-01-01`) }}>
          <span className="absolute top-1 right-1.5 text-right text-[11px] leading-tight">this year</span>
        </span>
        {entries.toReversed().map((e) => (
          <span
            key={e.rank}
            title={`#${e.rank}: ${withUnit(e)}, ${e.date}`}
            className={`motion-pop absolute -translate-1/2 rounded-full ${FLOW_DOT[flow]} ${e.rank === 1 ? "size-2.5 ring-2 ring-primary ring-offset-[3px] ring-offset-card" : "size-2 ring-2 ring-card"}`}
            style={{ left: left(e.when), top: top(e.figure), "--i": e.rank - 1 } as CSSProperties}
          />
        ))}
        <svg className="pointer-events-none absolute inset-0 size-full overflow-visible stroke-muted-foreground">
          {labels.map((l) => l.line && <line key={l.first} x1={l.line[0]} y1={l.line[1]} x2={l.line[2]} y2={l.line[3]} />)}
        </svg>
        {labels.map((l) => (
          <span
            key={l.first}
            className="motion-pop absolute -translate-y-1/2 text-[11px] leading-3 font-semibold whitespace-nowrap text-foreground"
            style={{ left: l.left, top: l.top, "--i": l.first - 1 } as CSSProperties}
          >
            {l.text}
          </span>
        ))}
      </div>
      <span />
      <div aria-hidden className="relative">
        {years.map((y) => <span key={y} className="absolute top-[5px] -translate-x-1/2" style={{ left: left(`${y}-01-01`) }}>{y}</span>)}
      </div>
    </div>
  );
}
