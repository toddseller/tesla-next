import { powerwallYears, type PowerwallYear } from "@/lib/patterns";

const kwh = (value: number) => `${value.toLocaleString("en-US")} kWh`;
const percent = (value: number | null) => (value === null ? "–" : `${value}%`);

function Tile({ label, value, detail, wide }: { label: string; value: string; detail: string; wide?: boolean }) {
  return (
    <div className={`flex flex-col gap-1 rounded-lg bg-secondary p-3 sm:gap-1.5 sm:p-4 ${wide ? "col-span-2 sm:col-span-1" : ""}`}>
      <span className="text-[13px] text-muted-foreground">{label}</span>
      <span className="font-mono text-2xl font-semibold sm:text-[28px]">{value}</span>
      <span className="text-xs text-muted-foreground sm:text-[13px]">{detail}</span>
    </div>
  );
}

// One row each for a phone's three stacked lines and a wide screen's five columns.
const ROW = "flex flex-wrap items-center gap-x-1.5 gap-y-1.5 sm:grid sm:grid-cols-[130px_minmax(0,1fr)_96px_90px_100px] sm:gap-x-3";

export function PowerwallSection({ years, today }: { years: PowerwallYear[]; today: string }) {
  const { rows, total } = powerwallYears(years, today);
  const latest = rows.at(-1);
  const largest = Math.max(1, ...rows.map((row) => row.kwh));
  return (
    <section aria-labelledby="powerwall-use" className="flex flex-col gap-5 rounded-[10px] border bg-card p-4 sm:p-6">
      <div className="flex flex-col gap-1">
        <h2 id="powerwall-use" className="text-sm font-medium tracking-[0.06em] text-muted-foreground uppercase">Powerwall use</h2>
        <p className="text-sm text-muted-foreground">How hard the Powerwalls work, and how much of what goes in comes back out</p>
      </div>
      {!latest ? (
        <p className="text-sm text-muted-foreground">No Powerwall data yet</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3">
            <Tile label={`Cycles in ${latest.year}`} value={`${latest.cycles}`} detail={`${total.cycles} since ${rows[0].year}`} />
            <Tile label={`Round trip in ${latest.year}`} value={percent(latest.roundTrip)} detail="of each kWh in came back out" />
            <Tile label={`Out of the Powerwalls in ${latest.year}`} value={kwh(latest.kwh)} detail={`${kwh(total.kwh)} since ${rows[0].year}`} wide />
          </div>
          <div role="table" aria-label="Powerwall use by year" className="flex flex-col text-sm">
            <div role="row" className={`${ROW} py-2 text-[13px] text-muted-foreground max-sm:sr-only`}>
              <span role="columnheader">Year</span>
              <span role="columnheader" className="sm:col-span-2">Out of the Powerwalls</span>
              <span role="columnheader" className="sm:text-right">Cycles</span>
              <span role="columnheader" className="sm:text-right">Round trip</span>
            </div>
            {rows.map((row) => (
              <div role="row" key={row.year} className={`${ROW} border-t py-2.5`}>
                <span role="rowheader" className="flex-1 sm:order-1">
                  {row.year}
                  {row.note && <span className="text-xs text-muted-foreground"> {row.note}</span>}
                </span>
                <span role="cell" className="text-right font-mono sm:order-3">{kwh(row.kwh)}</span>
                <span aria-hidden className="h-2 basis-full overflow-hidden rounded bg-secondary sm:order-2 sm:h-2.5">
                  <span className="block h-full rounded bg-powerwall" style={{ width: `${(100 * row.kwh) / largest}%` }} />
                </span>
                <span role="cell" className="font-mono text-xs text-muted-foreground sm:order-4 sm:text-right sm:text-sm sm:text-foreground">
                  {row.cycles}<span className="sm:hidden"> cycles</span>
                </span>
                <span role="cell" className="font-mono text-xs text-muted-foreground sm:order-5 sm:text-right sm:text-sm sm:text-foreground">
                  <span className="sm:hidden">· </span>{percent(row.roundTrip)}<span className="sm:hidden"> round trip</span>
                </span>
              </div>
            ))}
          </div>
          <p className="text-[13px] text-muted-foreground">
            A cycle is 40.5 kWh out, the three Powerwalls&apos; rated size. Round trip is energy out over energy in, from solar and the grid.
          </p>
        </>
      )}
    </section>
  );
}
