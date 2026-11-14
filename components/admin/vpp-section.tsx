"use client";

import { useActionState } from "react";

import { markVppDay, type Result, unmarkVppDay } from "@/app/admin/actions";
import { DayField } from "@/components/admin/day-field";
import { Notice } from "@/components/admin/notice";
import { OUTLINE, SAVE } from "@/components/admin/styles";
import { longDate } from "@/lib/calendar-dates";

type Props = { season: number; today: string; days: { date: string; kwh: number }[] };

export function VppSection({ season, today, days }: Props) {
  // Each result remounts the mark form, so a marked day's picker starts empty again.
  const [state, dispatch, pending] = useActionState(async (previous: { version: number; result: Result }, form: FormData) => {
    const result = await (form.has("unmark") ? unmarkVppDay : markVppDay)(previous.result, form);
    return { version: previous.version + 1, result };
  }, { version: 0, result: null });
  const end = `${season}-10-31`;
  return (
    <section aria-labelledby="vpp-days" className="flex flex-col gap-3.5 rounded-[10px] border bg-card px-4 py-5 sm:px-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="vpp-days" className="font-semibold">{`VPP days, ${season} season`}</h2>
        <span className="text-xs text-muted-foreground">May 1 to October 31</span>
      </div>
      {state.result && <Notice ok={state.result.ok}>{state.result.message}</Notice>}
      {days.length ? (
        <ul aria-label="Marked days" className="flex flex-col text-sm">
          {days.map(({ date, kwh }) => (
            <li key={date} className="flex items-center gap-3 border-t py-2">
              <span className="font-medium">{longDate(date, true)}</span>
              <span className="ml-auto font-mono text-muted-foreground">{`${kwh.toFixed(1)} kWh`}</span>
              <form action={dispatch}>
                <input type="hidden" name="day" value={date} />
                <input type="hidden" name="unmark" value="1" />
                <button type="submit" disabled={pending} aria-label={`Unmark ${longDate(date, true)}`} className={OUTLINE}>Unmark</button>
              </form>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[13px] text-muted-foreground">{`No days marked in the ${season} season yet.`}</p>
      )}
      <form key={state.version} action={dispatch} className="flex flex-wrap items-end gap-2">
        <DayField name="day" label="Day to mark" first={`${season}-05-01`} last={today < end ? today : end} marked={days.map((day) => day.date)} />
        <button type="submit" disabled={pending} className={SAVE}>Mark VPP day</button>
      </form>
    </section>
  );
}
