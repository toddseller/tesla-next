"use client";

import { useRouter } from "next/navigation";
import { startTransition, useActionState, useState } from "react";

import { type BillResult, saveBill } from "@/app/admin/actions";
import { Notice } from "@/components/admin/notice";
import { INPUT, OUTLINE, SAVE } from "@/components/admin/styles";
import type { StoredCycle } from "@/lib/admin/statement";
import { addUp, FIGURES, type Figure, fromForm, loaded, misses, NAMES, type Row, shown, type Total } from "@/lib/admin/sums";

const CYCLES = 12;
const HEADINGS: Record<Figure, string> = {
  peak_kwh: "Peak kWh", off_peak_kwh: "Off-peak kWh", net_kwh: "Net kWh", nem_charges: "NEM charges ($)", minimum_delivery: "Min. delivery ($)",
};
const BLANK_TOTAL = Object.fromEntries(FIGURES.map((figure) => [figure, ""])) as Total;
const BLANK_ROW: Row = { end_date: "", ...BLANK_TOTAL };

const readDate = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
const money = (value: number) => `${value < 0 ? "−" : ""}$${Math.abs(value).toFixed(2)}`;

type Values = { rows: Row[]; total: Total };
// Each result remounts the form (its version is the key), so its inputs start from what the result says to show.
type State = { version: number; result: BillResult; values?: Values };

// Which row a refusal names: its message starts with the row's end date as typed.
const namedRow = (state: State) =>
  state.result?.ok === false ? state.values?.rows.findIndex((row) => row.end_date.trim() && state.result!.message.startsWith(`Stored nothing. ${row.end_date.trim()}`)) ?? -1 : -1;

type Props = { years: { year: number; label: string }[]; year: number; cycles: StoredCycle[]; amountDue: number | null };

export function BillSection({ years, year, cycles, amountDue }: Props) {
  const router = useRouter();
  const label = years.find((y) => y.year === year)?.label;
  // A load fills the form without a request; a save goes to the server.
  const [state, dispatch, pending] = useActionState(async (previous: State, input: FormData | Values): Promise<State> => {
    if (!(input instanceof FormData)) return { version: previous.version + 1, result: null, values: input };
    const result = await saveBill(previous.result, input);
    return { version: previous.version + 1, result, values: result?.values };
  }, { version: 0, result: null });
  const bad = namedRow(state);
  const values = state.values ?? { rows: [], total: BLANK_TOTAL };
  const rows = Array.from({ length: CYCLES }, (_, i) => values.rows[i] ?? BLANK_ROW);

  return (
    <section aria-labelledby="bill-figures" className="flex flex-col gap-3.5 rounded-[10px] border bg-card px-4 py-5 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="bill-figures" className="font-semibold">Bill figures</h2>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 whitespace-nowrap text-xs text-muted-foreground">
            True-up year
            <select aria-label="True-up year" className={`${INPUT} w-auto font-sans`} value={year}
              onChange={(event) => router.push(`/admin?year=${event.target.value}`, { scroll: false })}>
              {years.map((y) => <option key={y.year} value={y.year}>{y.label}</option>)}
            </select>
          </label>
          <span className="rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground">
            {amountDue == null ? "No true-up statement yet" : `True-up statement stored: ${money(amountDue)} due`}
          </span>
        </div>
      </div>

      {cycles.length ? (
        <>
          <div aria-hidden="true" className="hidden gap-x-4 text-xs text-muted-foreground sm:grid sm:grid-cols-[minmax(110px,1.2fr)_repeat(4,minmax(0,1fr))]">
            <span>Read ending the cycle</span>
            <span className="text-right">Peak kWh</span>
            <span className="text-right">Off-peak kWh</span>
            <span className="text-right">Net kWh</span>
            <span className="text-right">NEM charges</span>
          </div>
          <ul aria-label="Stored cycles" className="flex flex-col text-sm">
            {cycles.map((cycle) => (
              <li key={cycle.end_read} className="grid grid-cols-[1fr_auto] items-baseline gap-x-4 gap-y-0.5 border-t py-2 sm:grid-cols-[minmax(110px,1.2fr)_repeat(4,minmax(0,1fr))]">
                <span>{readDate.format(new Date(`${cycle.end_read}T00:00:00Z`))}</span>
                <span className="col-span-2 row-start-2 text-xs text-muted-foreground sm:col-span-1 sm:row-start-auto sm:text-right sm:font-mono sm:text-sm sm:text-foreground"><Named>Peak</Named>{cycle.net_peak_kwh}</span>
                <span className="col-span-2 text-xs text-muted-foreground sm:col-span-1 sm:text-right sm:font-mono sm:text-sm sm:text-foreground"><Named>Off-peak</Named>{cycle.net_off_peak_kwh}</span>
                <span className="col-span-2 text-xs text-muted-foreground sm:col-span-1 sm:text-right sm:font-mono sm:text-sm sm:text-foreground"><Named>Net</Named>{cycle.net_kwh}</span>
                <span className="col-start-2 row-start-1 text-right font-mono sm:col-start-auto sm:row-start-auto">{money(cycle.nem_charges)}</span>
              </li>
            ))}
          </ul>
        </>
      ) : null}
      {cycles.length ? (
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className={OUTLINE} onClick={() => startTransition(() => dispatch(loaded(cycles, amountDue != null)))}>Load into form</button>
          <span className="text-xs text-muted-foreground">Fills the form below with these cycles, to correct one and save the table again</span>
        </div>
      ) : (
        <p className="text-[13px] text-muted-foreground">{`No cycles stored for ${label} yet.`}</p>
      )}

      <form action={dispatch} className="flex flex-col gap-3 border-t pt-3.5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-sm font-semibold">Enter a bill</h3>
          <p className="text-xs text-muted-foreground">Type PG&amp;E&apos;s &quot;Summary of NEM Charges&quot; table as printed. Leave minimum delivery blank for a monthly bill.</p>
        </div>
        {state.result && <Notice ok={state.result.ok}>{state.result.message}</Notice>}
        <BillRows key={state.version} rows={rows} total={values.total} bad={bad} />
        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={pending} className={SAVE}>Save bill</button>
          <span className="text-xs text-muted-foreground">Replaces the year&apos;s stored cycles</span>
        </div>
      </form>
    </section>
  );
}

// A stored figure's name: shown beside it on a phone, under the column's heading on a wider screen.
const Named = ({ children }: { children: string }) => <span className="font-sans sm:sr-only">{`${children} `}</span>;

const ROW_GRID = "grid grid-cols-3 gap-2 rounded-lg border p-2.5 sm:grid-cols-[34px_132px_repeat(5,minmax(84px,1fr))] sm:items-center sm:rounded-none sm:border-0 sm:p-0";

// The rows' sums follow the inputs as they're typed; the TOTAL stays as typed from the bill, the check that catches a
// mistyped row.
function BillRows({ rows, total, bad }: { rows: Row[]; total: Total; bad: number }) {
  const [typed, setTyped] = useState({ rows, total });
  return (
    <div className="flex flex-col gap-2.5 sm:gap-1.5" onChange={(event) => setTyped(fromForm(new FormData(event.currentTarget.closest("form")!)))}>
      <div aria-hidden="true" className="hidden gap-2 text-xs text-muted-foreground sm:grid sm:grid-cols-[34px_132px_repeat(5,minmax(84px,1fr))]">
        <span />
        <span>End date</span>
        {FIGURES.map((figure) => <span key={figure}>{HEADINGS[figure]}</span>)}
      </div>
      {rows.map((row, i) => (
        <div key={i} className={`${ROW_GRID} ${i === bad ? "border-destructive/60" : ""}`}>
          <span className="col-span-3 text-xs text-muted-foreground sm:col-span-1 sm:text-right sm:font-mono">
            <span className="sm:hidden">Cycle </span>{i + 1}
          </span>
          <Field name="end_date" label={`Cycle ${i + 1} end date`} heading="End date" value={row.end_date} placeholder="MM/DD/YYYY" invalid={i === bad} wide />
          {FIGURES.map((figure) => (
            <Field key={figure} name={figure} label={`Cycle ${i + 1} ${NAMES[figure]}`} heading={HEADINGS[figure]} value={row[figure]} invalid={i === bad} />
          ))}
        </div>
      ))}
      <div className={`${ROW_GRID} bg-muted sm:mt-1.5 sm:border-t sm:bg-transparent sm:pt-2.5`}>
        <span className="col-span-3 text-xs font-semibold tracking-wider sm:col-span-2">TOTAL</span>
        {FIGURES.map((figure) => (
          <Field key={figure} name={`total_${figure}`} label={`TOTAL ${NAMES[figure]}`} heading={HEADINGS[figure]} value={total[figure]} />
        ))}
      </div>
      <div className={`${ROW_GRID} border-0 p-0 font-mono text-xs text-muted-foreground`}>
        <span className="col-span-3 font-sans sm:col-span-2 sm:text-right">Rows add to</span>
        <ul role="list" aria-label="Rows add to" className="contents">
          {FIGURES.map((figure) => {
            const off = misses(typed.rows, typed.total, figure);
            return (
              <li key={figure} className={`px-2.5 ${off ? "text-destructive" : ""}`}>
                <span className="font-sans sm:sr-only">{HEADINGS[figure]} </span>{shown(figure, addUp(typed.rows, figure))}{off && " ≠ total"}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

type FieldProps = { name: string; label: string; heading: string; value: string; placeholder?: string; invalid?: boolean; wide?: boolean };

function Field({ name, label, heading, value, placeholder, invalid, wide }: FieldProps) {
  return (
    <label className={`flex min-w-0 flex-col gap-1 text-xs text-muted-foreground ${wide ? "col-span-2 sm:col-span-1" : ""}`}>
      <span className="sm:sr-only" aria-hidden="true">{heading}</span>
      <input name={name} aria-label={label} defaultValue={value} placeholder={placeholder} aria-invalid={invalid || undefined} className={INPUT} />
    </label>
  );
}
