"use client";

import { useActionState } from "react";

import { type Result, savePayout } from "@/app/admin/actions";
import { DayField } from "@/components/admin/day-field";
import { Notice } from "@/components/admin/notice";
import { INPUT, SAVE } from "@/components/admin/styles";
import { longDate } from "@/lib/calendar-dates";

type Props = { seasons: number[]; today: string; latest: { season: number; amount: number; paid_on: string } | null };

export function PayoutSection({ seasons, today, latest }: Props) {
  // Each result remounts the form, so a refusal shows what was typed and a recorded payout starts it empty again.
  const [state, dispatch, pending] = useActionState(async (previous: { version: number; result: Result }, form: FormData) => {
    return { version: previous.version + 1, result: await savePayout(previous.result, form) };
  }, { version: 0, result: null });
  const typed = state.result?.values;
  // Tesla pays after a season ends, so the last season to have ended comes first.
  const ended = seasons.filter((season) => `${season}-10-31` < today).at(-1) ?? seasons.at(-1);
  return (
    <section aria-labelledby="vpp-payout" className="flex flex-col gap-3.5 rounded-[10px] border bg-card px-4 py-5 sm:px-6">
      <h2 id="vpp-payout" className="text-sm font-medium tracking-[0.06em] text-muted-foreground uppercase">VPP payout</h2>
      <p className="text-[13px] text-muted-foreground">
        {latest
          ? `Recorded for the ${latest.season} season: $${latest.amount.toFixed(2)}, paid ${longDate(latest.paid_on)}. Recording a season again replaces it.`
          : "No payout recorded yet."}
      </p>
      {state.result && <Notice ok={state.result.ok}>{state.result.message}</Notice>}
      <form key={state.version} action={dispatch} className="grid grid-cols-2 items-end gap-2.5 sm:flex sm:flex-wrap">
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Season
          <select name="season" aria-label="Season" defaultValue={typed?.season ?? ended} className={`${INPUT} font-sans sm:w-28`}>
            {[...seasons].reverse().map((season) => <option key={season} value={season}>{season}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Amount ($)
          <input name="amount" aria-label="Amount ($)" defaultValue={typed?.amount} placeholder="728.26" className={`${INPUT} sm:w-40`} />
        </label>
        <div className="col-span-2">
          <DayField name="paid_on" label="Paid on" first={`${seasons[0]}-11-01`} last={today} value={typed?.paid_on} />
        </div>
        <button type="submit" disabled={pending} className={SAVE}>Record payout</button>
      </form>
    </section>
  );
}
