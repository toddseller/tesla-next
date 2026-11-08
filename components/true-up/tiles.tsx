import { type ReactNode, useId } from "react";

import type { TrueUpYear } from "@/lib/true-up/reads";
import {
  billedText, chargesSoFarText, type Cost, type Cycle, kwh, netLabel, projectionText, startedCycles, type TileText, totals,
  trueUpText, vppText,
} from "@/lib/true-up/text";

const Figure = ({ children }: { children: ReactNode }) => <span className="font-mono text-foreground">{children}</span>;

function Tile({ title, value, unit, children }: { title: string; value: string | null; unit: string | null; children: ReactNode }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="flex flex-col gap-2 rounded-[10px] border bg-card px-[22px] py-5">
      <h2 id={id} className="text-sm font-medium text-muted-foreground">{title}</h2>
      {value && (
        <p className="flex flex-wrap items-baseline gap-2">
          <span className="font-mono text-[34px] leading-none font-semibold">{value}</span>
          {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
        </p>
      )}
      <div className="flex flex-col gap-2 text-[13px] text-muted-foreground">{children}</div>
    </section>
  );
}

const TextTile = ({ title, text }: { title: string; text: TileText }) => (
  <Tile title={title} value={text.value} unit={text.unit}><p>{text.line}</p></Tile>
);

const withLabel = (value: number) => <><Figure>{kwh(value)}</Figure> {netLabel(value).toLowerCase()}</>;

// The range's tiles: its net always, and with one true-up year shown, its dollars and VPP credit.
export function Tiles({ cycles, cost, year, today }: { cycles: Cycle[]; cost: Cost | null; year: TrueUpYear | null; today: string }) {
  const started = startedCycles(cycles);
  const sum = totals(started);
  const billed = year && billedText(started);
  const vpp = year && cost && vppText(cost.vpp, today);
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] gap-4">
      <Tile title={year?.current ? "Net so far" : year ? "Net for the year" : "Net"} value={kwh(sum.net)} unit={`kWh ${netLabel(sum.net).toLowerCase()}`}>
        <p>Imported <Figure>{kwh(sum.imported)}</Figure> · Exported <Figure>{kwh(sum.exported)}</Figure> kWh</p>
        <p>Peak (4 to 9 p.m.) {withLabel(sum.peak)} · Off-peak {withLabel(sum.offPeak)}</p>
      </Tile>
      {year && cost && (year.current
        ? cost.charges_so_far !== null && <TextTile title="Charges so far" text={chargesSoFarText(cost, started)} />
        : <TextTile title="True-up" text={trueUpText(cost)} />)}
      {year?.current && cost?.kwh_projection && <TextTile title="Projected true-up" text={projectionText(cost.kwh_projection, cost.projections)} />}
      {billed && <TextTile title="Billed against estimate" text={billed} />}
      {vpp && <TextTile title="Tesla VPP credit" text={vpp} />}
    </div>
  );
}
