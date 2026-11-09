import type { ReactNode } from "react";

import type { Savings } from "@/lib/true-up/savings";
import { type Cost, savingsText } from "@/lib/true-up/text";

const COLORS: Record<string, string> = { paid: "bg-grid", powerwalls: "bg-powerwall", solar: "bg-solar", saved: "bg-solar" };

function Key({ swatch, label, value, children }: { swatch: string; label: string; value: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 sm:max-w-[420px]">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 sm:flex-col sm:gap-1">
        <span className="flex items-center gap-2 text-[13px] text-muted-foreground"><span aria-hidden className={`size-2.5 rounded-[3px] ${swatch}`} />{label}</span>
        <span className="font-mono text-xl font-semibold">{value}</span>
      </div>
      {children && <p className="text-[13px] text-muted-foreground">{children}</p>}
    </div>
  );
}

export function SavingsCard({ savings, season, current }: { savings: Savings; season: Cost["vpp"]; current: boolean }) {
  const text = savingsText(savings, season, current);
  const { powerwalls } = text;
  const cost = savings.powerwalls_added < 0;
  return (
    <section aria-labelledby="savings" className="flex flex-col gap-4 rounded-[10px] border bg-card px-4 py-5 sm:px-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <div className="flex flex-col gap-2">
          <h2 id="savings" className="text-sm font-medium text-muted-foreground">What the system saved</h2>
          <p className="flex flex-wrap items-baseline gap-2">
            <span className="font-mono text-[34px] leading-none font-semibold">{text.saved}</span>
            <span className="text-sm text-muted-foreground">{text.unit}</span>
          </p>
        </div>
        <p className="max-w-[460px] text-[13px] text-muted-foreground">{text.estimates}</p>
      </div>
      <div role="img" aria-label={text.bar.label} className="flex h-7 gap-0.5 overflow-hidden rounded-md">
        {text.bar.parts.map(([part, dollars]) => <div key={part} className={COLORS[part]} style={{ flexGrow: dollars, flexBasis: 0 }} />)}
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-x-10">
        <Key swatch="bg-grid" label="Paid" value={text.paid}>{text.paidSplit}</Key>
        <Key swatch="bg-solar" label="Solar saved" value={text.solar}>Against buying it all from the grid</Key>
      </div>
      <div role="group" aria-labelledby="powerwalls" className="grid gap-4 border-t pt-4 sm:grid-cols-3 sm:gap-6">
        <div className="flex flex-col gap-1">
          <span id="powerwalls" className="flex items-center gap-2 text-[13px] text-muted-foreground">
            <span aria-hidden className={`size-2.5 rounded-[3px] ${cost ? "ring-[1.5px] ring-powerwall ring-inset" : "bg-powerwall"}`} />Powerwalls
          </span>
          <span className="font-mono text-xl font-semibold">{powerwalls.bill}</span>
          {powerwalls.vpp && <p className="text-[13px] text-muted-foreground">{powerwalls.vpp}</p>}
          {!powerwalls.whatIf && powerwalls.nem2 && <p className="text-[13px] text-muted-foreground">{powerwalls.nem2}</p>}
        </div>
        <div className="flex flex-col gap-2.5">
          {powerwalls.parts.map(([label, value]) => (
            <div key={label} className="flex items-baseline justify-between gap-3 sm:flex-col sm:gap-1">
              <span className="text-[13px] text-muted-foreground">{label}</span>
              <span className="font-mono text-lg font-semibold">{value}</span>
            </div>
          ))}
        </div>
        {powerwalls.whatIf && (
          <div role="group" aria-label="What if (simulation)" className="flex flex-col gap-1.5 rounded-lg border border-dashed px-3.5 py-3">
            <span aria-hidden className="text-[13px] text-muted-foreground">What if (simulation)</span>
            <span className="font-mono text-lg font-semibold">{powerwalls.whatIf.value}</span>
            <p className="text-[13px] text-muted-foreground">{[powerwalls.whatIf.line, powerwalls.nem2].filter(Boolean).join(" ")}</p>
          </div>
        )}
      </div>
    </section>
  );
}
