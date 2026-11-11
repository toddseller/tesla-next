import type { CSSProperties } from "react";

import { type Entry, FLOW_DOT, type Flow } from "@/components/top-ten/entries";
import { niceAxis } from "@/lib/solar/day-views";

const utc = (day: string) => Date.parse(`${day}T00:00:00Z`);
const percent = (share: number) => `${(100 * share).toFixed(2)}%`;
const dotSize = (rank: number) => (rank === 1 ? "size-[26px]" : rank <= 3 ? "size-5" : "size-[11px]");

// Positioned HTML rather than Recharts, whose ResponsiveContainer serves an empty box until the browser measures it.
export function Timeline({ label, entries, flow, today }: { label: string; entries: Entry[]; flow: Flow; today: string }) {
  const year = Number(today.slice(0, 4));
  const [from, to] = [utc("2021-10-01"), utc(`${year}-12-31`)];
  const left = (day: string) => percent((utc(day) - from) / (to - from));
  const figures = entries.map((e) => e.figure);
  // At least 1 kWh (or hour) tall, so a single entry still has an axis.
  const { domain: [low, high], ticks } = niceAxis(Math.min(...figures), Math.max(...figures, Math.min(...figures) + 1));
  const top = (figure: number) => percent((high - figure) / (high - low));
  const years = Array.from({ length: year - 2021 }, (_, i) => 2022 + i);

  return (
    <div
      role="img"
      aria-label={`${label}: ${entries.map((e) => `#${e.rank} ${e.value} ${e.unit} ${e.date}`).join("; ")}`}
      className="grid grid-cols-[44px_minmax(0,1fr)] grid-rows-[200px_22px] font-mono text-xs text-muted-foreground"
    >
      <div aria-hidden className="relative">
        {ticks.map((t) => (
          <span key={t} className="absolute right-2 -translate-y-1/2" style={{ top: top(t) }}>{t.toLocaleString("en-US")}</span>
        ))}
      </div>
      <div aria-hidden className="relative border-b border-l border-input">
        {ticks.map((t) => <span key={t} className="absolute inset-x-0 border-t border-border" style={{ top: top(t) }} />)}
        {years.map((y) => <span key={y} className="absolute inset-y-0 border-l border-dashed border-border" style={{ left: left(`${y}-01-01`) }} />)}
        <span title="This year" className="absolute inset-y-0 right-0 bg-primary/[0.06]" style={{ left: left(`${year}-01-01`) }} />
        {entries.toReversed().map((e) => (
          <span
            key={e.rank}
            title={`#${e.rank}: ${e.value} ${e.unit}, ${e.date}`}
            className={`motion-pop absolute flex -translate-1/2 items-center justify-center rounded-full text-[11px] font-semibold text-background ${FLOW_DOT[flow]} ${dotSize(e.rank)} ${e.rank === 1 ? "ring-2 ring-primary ring-offset-[3px] ring-offset-card" : "ring-2 ring-card"}`}
            style={{ left: left(e.when), top: top(e.figure), "--i": e.rank - 1 } as CSSProperties}
          >
            {e.rank === 2 || e.rank === 3 ? e.rank : ""}
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
