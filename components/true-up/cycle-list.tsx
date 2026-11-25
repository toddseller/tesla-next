import { ChevronRight } from "lucide-react";

import { Measured } from "@/components/measured";
import { type Cycle, chargesText, cycleDates, estimateText, kwh, netLabel, type Started, startedCycles, totals, uncorrectedDays, yearName } from "@/lib/true-up/text";

const ROW = "grid grid-cols-[repeat(auto-fit,minmax(min(100%,150px),1fr))] sm:grid-cols-[minmax(0,1.3fr)_repeat(4,minmax(0,1fr))] items-baseline gap-x-4 gap-y-1.5 border-t py-3.5";

const Figure = ({ name, value }: { name: string; value: string }) => (
  <span className="text-sm text-muted-foreground">{name} <span className="text-foreground"><Measured text={value} /></span></span>
);

const Energy = ({ imported, exported, net }: { imported: number; exported: number; net: number }) => (
  <>
    <Figure name="Imported" value={kwh(imported)} />
    <Figure name="Exported" value={kwh(exported)} />
    <Figure name="Net" value={`${kwh(net)} ${netLabel(net).toLowerCase()}`} />
  </>
);

const CycleRows = ({ cycles }: { cycles: Started[] }) => (
  <ul className="flex flex-col">
    {cycles.map((cycle) => {
      const [charges, estimate] = [chargesText(cycle), estimateText(cycle)];
      return (
        <li key={cycle.first_day} className={ROW}>
          <span className="font-semibold">{cycleDates(cycle)}</span>
          <Energy {...cycle} />
          {charges && (
            <span className="flex flex-col items-end gap-0.5">
              <span><Measured text={charges} /></span>
              {estimate && <span className="text-xs text-muted-foreground">{estimate}</span>}
            </span>
          )}
        </li>
      );
    })}
  </ul>
);

// No charges unless every cycle has them, since a partial sum would read as the year's.
function Year({ year, cycles, open }: { year: string; cycles: Started[]; open: boolean }) {
  const charged = cycles.every((c) => c.nem_charges !== null);
  const charges = charged && chargesText({
    nem_charges: Math.round(cycles.reduce((total, c) => total + c.nem_charges!, 0) * 100) / 100,
    nem_source: cycles.some((c) => c.nem_source === "calculated") ? "calculated" : "statement",
  });
  return (
    <details open={open} className="group">
      <summary className={`${ROW} cursor-pointer list-none [&::-webkit-details-marker]:hidden`}>
        <span className="font-semibold">
          <ChevronRight size={14} aria-hidden className="mr-1.5 inline align-[-1px] transition-transform group-open:rotate-90" />
          {yearName(year)}
        </span>
        <Energy {...totals(cycles)} />
        {charges && <span className="text-end"><Measured text={charges} /></span>}
      </summary>
      <CycleRows cycles={cycles} />
    </details>
  );
}

// Each started cycle's grid energy and NEM charges, wrapping on a phone rather than scrolling sideways.
export function CycleList({ cycles, allTime = false }: { cycles: Cycle[]; allTime?: boolean }) {
  const started = startedCycles(cycles);
  const calculated = started.some((c) => c.nem_source === "calculated");
  const billed = started.some((c) => c.nem_source === "statement");
  const notes = [
    calculated && "est.: calculated from PG&E's published rates.",
    billed && "Charges are PG&E's, from its bills, with the estimate for the same cycle under each.",
  ].filter(Boolean);
  const years = [...new Set(started.map((cycle) => cycle.true_up))];
  return (
    <>
      {years.length > 1
        ? years.map((year, i) => <Year key={year} year={year} cycles={started.filter((cycle) => cycle.true_up === year)} open={!allTime || i === years.length - 1} />)
        : <CycleRows cycles={started} />}
      {notes.length > 0 && (
        <p className="text-[13px] text-muted-foreground">
          {notes.join(" ")} Before taxes; the Base Services Charge and WestLight Energy&apos;s generation charges are billed separately.
        </p>
      )}
    </>
  );
}

export function MeteringNote({ cycles }: { cycles: Cycle[] }) {
  const days = uncorrectedDays(startedCycles(cycles));
  if (!days) return null;
  return (
    <p role="note" className="text-[13px] text-muted-foreground">
      {days === 1 ? "1 day" : `${days} days`} before April 27, 2026 still {days === 1 ? "uses" : "use"} Tesla&apos;s grid readings, which read
      about half of what PG&amp;E&apos;s meter recorded because of a Tesla metering fault since corrected.
    </p>
  );
}
