import { type ReactNode, useId } from "react";

import { CountUp } from "@/components/count-up";
import { Term, WithTerm } from "@/components/term";
import type { TermName } from "@/lib/terms";

import type { TrueUpYear } from "@/lib/true-up/reads";
import {
  billedText, chargesSoFarText, type Cost, type Cycle, netLabel, startedCycles, type TileText, totals,
  trueUpText, vppText,
} from "@/lib/true-up/text";
import { energy } from "@/lib/units";

const Figure = ({ children }: { children: ReactNode }) => <span className="font-mono text-foreground">{children}</span>;

function Tile({ title, value, unit, children }: { title: ReactNode; value: string | null; unit: string | null; children: ReactNode }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="@container flex flex-col gap-2 rounded-[10px] border bg-card px-[22px] py-5">
      <h2 id={id} className="text-sm font-medium tracking-[0.06em] text-muted-foreground uppercase">{title}</h2>
      {value && (
        <p className="flex flex-wrap items-baseline gap-2">
          {/* Mono means measured: words like "Not started" stay in the sans. Five tiles to a row leave each about 168px of
              content, too narrow for 34px figures; every other layout leaves at least 194px. */}
          <span className={`${/\d/.test(value) ? "font-mono" : ""} text-[28px] @[180px]:text-[34px] leading-none font-semibold`}><CountUp text={value} /></span>
          {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
        </p>
      )}
      <div className="flex flex-col gap-2 text-[13px] text-balance text-muted-foreground">{children}</div>
    </section>
  );
}

const TextTile = ({ title, text, terms = [] }: { title: ReactNode; text: TileText; terms?: TermName[] }) => (
  <Tile title={title} value={text.value} unit={text.unit}><p><WithTerm text={text.line} terms={terms} /></p></Tile>
);

// Each figure carries its own unit: imports can pass 1,000 kWh while exports don't.
const Energy = ({ value }: { value: number }) => {
  const [figure, unit] = energy(Math.abs(value), 1);
  return <><Figure>{figure}</Figure> {unit}</>;
};
const withLabel = (value: number) => <><Energy value={value} /> {netLabel(value).toLowerCase()}</>;

// The range's tiles: its net always, and with one true-up year shown, its dollars and VPP credit. The current year's
// projection is the page's headline.
export function Tiles({ cycles, cost, year, today }: { cycles: Cycle[]; cost: Cost | null; year: TrueUpYear | null; today: string }) {
  const started = startedCycles(cycles);
  const sum = totals(started);
  const billed = year && billedText(started);
  const vpp = year && cost && vppText(cost.vpp, today);
  const net = energy(Math.abs(sum.net), 1);
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] gap-4 xl:auto-cols-fr xl:grid-flow-col xl:grid-cols-none">
      <Tile title={year?.current ? "Net so far" : year ? "Net for the year" : "Net"} value={net[0]} unit={`${net[1]} ${netLabel(sum.net).toLowerCase()}`}>
        <p>Imported <Energy value={sum.imported} /> · Exported <Energy value={sum.exported} /></p>
        <p><Term name="peak">Peak (4 to 9 p.m.)</Term> {withLabel(sum.peak)} · Off-peak {withLabel(sum.offPeak)}</p>
      </Tile>
      {year && cost && (year.current
        ? cost.charges_so_far !== null && <TextTile title="Charges so far" text={chargesSoFarText(cost, started)} terms={["nem"]} />
        : <TextTile title="True-up" text={trueUpText(cost)} terms={["nem", "nsc"]} />)}
      {billed && <TextTile title="Billed against estimate" text={billed} />}
      {vpp && <TextTile title={<>Tesla <Term name="vpp">VPP</Term> credit</>} text={vpp} />}
    </div>
  );
}
