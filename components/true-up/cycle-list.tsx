import { type Cycle, chargesText, cycleDates, estimateText, kwh, netLabel, startedCycles, uncorrectedDays } from "@/lib/true-up/text";

const Figure = ({ name, value }: { name: string; value: string }) => (
  <span className="text-sm text-muted-foreground">{name} <span className="font-mono text-foreground">{value}</span></span>
);

// Each started cycle's grid energy and NEM charges, wrapping on a phone rather than scrolling sideways.
export function CycleList({ cycles }: { cycles: Cycle[] }) {
  const started = startedCycles(cycles);
  const calculated = started.some((c) => c.nem_source === "calculated");
  const billed = started.some((c) => c.nem_source === "statement");
  const notes = [
    calculated && "est.: calculated from PG&E's published rates.",
    billed && "Charges are PG&E's, from its bills, with the estimate for the same cycle under each.",
  ].filter(Boolean);
  return (
    <>
      <ul className="flex flex-col">
        {started.map((cycle) => {
          const [charges, estimate] = [chargesText(cycle), estimateText(cycle)];
          return (
            <li key={cycle.first_day} className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,150px),1fr))] items-baseline gap-x-4 gap-y-1.5 border-t py-3.5">
              <span className="font-semibold">{cycleDates(cycle)}</span>
              <Figure name="Imported" value={kwh(cycle.imported)} />
              <Figure name="Exported" value={kwh(cycle.exported)} />
              <Figure name="Net" value={`${kwh(cycle.net)} ${netLabel(cycle.net).toLowerCase()}`} />
              {charges && (
                <span className="flex flex-col items-end gap-0.5">
                  <span className="font-mono">{charges}</span>
                  {estimate && <span className="text-xs text-muted-foreground">{estimate}</span>}
                </span>
              )}
            </li>
          );
        })}
      </ul>
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
