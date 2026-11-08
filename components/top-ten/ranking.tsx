import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useId } from "react";

import { type Entry, held, lead } from "@/components/top-ten/entries";
import { Timeline } from "@/components/top-ten/timeline";

type Props = { record: string; chart: string; subtitle: string; flow: "solar" | "grid"; entries: Entry[]; today: string };

// Tesla red can't be text this small, so this year's mark is a red dot beside muted text.
const ThisYear = () => (
  <span className="flex items-center gap-1 text-[11px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
    <span aria-hidden className="size-1.5 rounded-full bg-primary" />this year
  </span>
);

export function Ranking({ record, chart, subtitle, flow, entries, today }: Props) {
  const id = useId();
  const [best, ...rest] = entries;
  const thisYear = today.slice(0, 4);
  return (
    <section aria-labelledby={id} className="flex flex-col gap-[18px] rounded-[10px] border bg-card px-4 py-5 sm:px-6">
      <div className="flex flex-wrap items-stretch gap-x-8 gap-y-6">
        <div className="flex min-w-0 flex-[1_1_260px] flex-col gap-2.5">
          <h2 id={id} className="flex items-center gap-2 text-[13px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">
            <span aria-hidden className={`size-2.5 rounded-xs ${flow === "solar" ? "bg-solar" : "bg-grid"}`} />{record}
          </h2>
          {best ? (
            <>
              <p className="flex items-baseline gap-2.5">
                <span className="font-mono text-[56px] leading-none font-semibold tracking-[-0.02em]">{best.value}</span>
                <span className="text-muted-foreground">kWh</span>
              </p>
              <Link href={best.href} className="flex min-h-8 w-fit items-center gap-1.5 font-medium hover:text-white">
                {best.long}<ChevronRight aria-hidden className="size-4 text-muted-foreground" />
              </Link>
              <div className="flex flex-col gap-1 text-[13px] text-muted-foreground">
                <span>Record for <span className="text-foreground">{held(best.since, today)}</span></span>
                {rest.length > 0 && <span><span className="font-mono text-foreground">{lead(entries)}</span> kWh ahead of #2</span>}
                <span>{subtitle}</span>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Nothing to rank yet</p>
          )}
        </div>
        {best && (
          <div className="flex min-w-0 flex-[999_1_480px] flex-col gap-2">
            <h3 className="text-sm font-medium text-muted-foreground">{chart}</h3>
            <Timeline label={chart} entries={entries} flow={flow} today={today} />
          </div>
        )}
      </div>
      {rest.length > 0 && (
        <ol start={2} className="flex flex-wrap gap-2 border-t pt-3.5">
          {rest.map((e) => (
            <li key={e.rank}>
              <Link href={e.href} className="flex min-h-11 items-center gap-2 rounded-lg border border-input bg-background px-3 text-sm hover:text-white">
                <span className="font-mono text-xs font-medium text-muted-foreground">#{e.rank}</span>
                <span className="font-mono font-medium">{e.value}</span>
                <span className="text-muted-foreground">{e.date}</span>
                {e.since.startsWith(thisYear) && <ThisYear />}
              </Link>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
