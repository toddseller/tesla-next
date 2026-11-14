"use server";

import { revalidatePath } from "next/cache";
import { owner } from "@/lib/admin/access";
import { parse, StatementError, store } from "@/lib/admin/statement";
import { fromForm, type Row, type Total } from "@/lib/admin/sums";
import { mark, recordPayout, unmark, VppError } from "@/lib/admin/vpp";
import { save } from "@/lib/admin/writer";
import { longDate } from "@/lib/calendar-dates";
import { siteToday } from "@/lib/scene/replay";
import { trueUpLabel } from "@/lib/true-up/reads";

export type BillResult = { ok: boolean; message: string; values?: { rows: Row[]; total: Total } } | null;

const dollars = (amount: number) => `$${amount.toFixed(2)}`;

// React resets a form after its action, so a refused table is sent back to be shown as it was typed.
export async function saveBill(_: BillResult, form: FormData): Promise<BillResult> {
  await owner();
  const { rows, total } = fromForm(form);

  let statement;
  try {
    statement = await parse(rows, total);
  } catch (error) {
    if (error instanceof StatementError) return { ok: false, message: `Stored nothing. ${error.message}.`, values: { rows, total } };
    throw error;
  }
  await save((client) => store(client, statement));
  revalidatePath("/admin");

  const count = statement.cycles.length;
  const year = trueUpLabel(statement.true_up_end_year);
  const message = statement.amount_due == null
    ? `Stored ${count} cycle${count === 1 ? "" : "s"} of ${year} from PG&E's bill: ${dollars(statement.nem_charges)} of NEM charges.`
    : `Stored ${count} cycles of ${year} from the true-up statement: ${dollars(statement.nem_charges)} of NEM charges, `
      + `${dollars(statement.minimum_delivery!)} of minimum delivery, ${dollars(statement.amount_due)} due.`;
  return { ok: true, message };
}

export type Result = { ok: boolean; message: string; values?: Record<string, string> } | null;

// A save whose own checks can refuse it: the refusal's reason, and nothing stored. The message is written only once the
// save has landed, since it names what its checks have passed.
async function saved(work: Parameters<typeof save>[0], message: () => string): Promise<Result> {
  try {
    await save(work);
  } catch (error) {
    if (error instanceof VppError) return { ok: false, message: `Stored nothing: ${error.message}.` };
    throw error;
  }
  revalidatePath("/admin");
  return { ok: true, message: message() };
}

export async function markVppDay(_: Result, form: FormData): Promise<Result> {
  await owner();
  const day = String(form.get("day") ?? "");
  return saved((client) => mark(client, day, siteToday()), () => `Marked ${longDate(day, true)} as a VPP day.`);
}

export async function unmarkVppDay(_: Result, form: FormData): Promise<Result> {
  await owner();
  const day = String(form.get("day") ?? "");
  return saved((client) => unmark(client, day), () => `Unmarked ${longDate(day, true)}.`);
}

// A refused payout is sent back as typed, as a refused bill is.
export async function savePayout(_: Result, form: FormData): Promise<Result> {
  await owner();
  const values = { season: String(form.get("season") ?? ""), amount: String(form.get("amount") ?? ""), paid_on: String(form.get("paid_on") ?? "") };
  const result = await saved(
    (client) => recordPayout(client, values.season, values.amount, values.paid_on, siteToday()),
    () => `Recorded the ${values.season} season: $${Number(values.amount).toFixed(2)}, paid ${longDate(values.paid_on)}.`,
  );
  return result?.ok ? result : { ...result!, values };
}
