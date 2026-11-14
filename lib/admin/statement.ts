// PG&E's true-up statements and monthly bills, typed into the admin page's form from the "Summary of NEM Charges" table
// and checked against themselves; ported from anton-tesla-api-ws services/true_up_statement.py. Statements from
// September 2025 on print the read that ends each cycle; earlier ones print the day before it.
import type { PoolClient } from "pg";
import { db } from "@/lib/db";
import { pyRound } from "@/lib/intervals/python";
import { shiftDay } from "@/lib/scene/replay";
import { loadPricing } from "@/lib/true-up/cost";
import { minimumDelivery } from "@/lib/true-up/pricing";
import { OCTOBER, readsFor, trueUpEndYear, trueUpLabel } from "@/lib/true-up/reads";
import { CHECKED, type Figure, FIGURES, filled, isBlank, isMonthly, KWH_TOLERANCE, NAMES, type Row, sumMisses, type Total } from "./sums";

const CYCLES = 12;

export class StatementError extends Error {}

const number = (value: string, row: string, figure: Figure) => {
  const parsed = Number(value);
  if (isBlank(value) || !Number.isFinite(parsed)) throw new StatementError(`${row}: ${NAMES[figure]} isn't a number`);
  return parsed;
};

// Python's {:g}, which anton's messages print kWh with.
const g = (value: number) => String(Number(value.toPrecision(6)));
const pad = (value: string) => value.padStart(2, "0");

// The read that ends the cycle: the printed date, or the day after it on older statements.
function readFor(printed: string, reads: string[]) {
  const [, month, day, year] = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(printed) ?? [];
  const date = `${year}-${pad(month ?? "")}-${pad(day ?? "")}`;
  if (!year || shiftDay(date, 0) !== date) throw new StatementError(`${printed} isn't a date (MM/DD/YYYY)`);
  const read = [date, shiftDay(date, 1)].find((candidate) => reads.includes(candidate));
  if (!read) throw new StatementError(`${printed} isn't a meter read or the day before one`);
  return read;
}

export type Statement = Awaited<ReturnType<typeof parse>>;

// The typed table, checked; throws StatementError saying what doesn't add up. A table whose minimum delivery inputs are
// all blank, the TOTAL's included, is a monthly bill: PG&E prints that column only on the true-up statement.
export async function parse(typed: Row[], total: Total) {
  const rows = filled(typed).map((row) => ({ ...row, end_date: row.end_date.trim() }));
  if (FIGURES.every((figure) => isBlank(total[figure]))) throw new StatementError("expected one TOTAL row");
  const monthly = isMonthly(rows, total);
  if (monthly && rows.length >= CYCLES) throw new StatementError(`${CYCLES} cycles are a true-up statement, which needs minimum delivery`);
  if (!monthly && rows.length !== CYCLES) throw new StatementError(`expected ${CYCLES} cycles, found ${rows.length}`);
  if (!rows.length) throw new StatementError("expected at least one cycle");

  const years = rows.map((row) => Number(row.end_date.slice(-4))).filter(Number.isInteger);
  const [low, high] = years.length ? [Math.min(...years), Math.max(...years)] : [2000, 2000];
  const reads = (await Promise.all(Array.from({ length: high - low + 3 }, (_, i) => readsFor(low - 1 + i)))).flat().sort();
  const endReads = rows.map((row) => readFor(row.end_date, reads));
  const first = reads.indexOf(endReads[0]);
  if (endReads.join() !== reads.slice(first, first + rows.length).join()) {
    throw new StatementError(`the end dates aren't ${rows.length} consecutive meter reads`);
  }
  const endYear = await trueUpEndYear(shiftDay(endReads.at(-1)!, -1));
  if (endReads[0] !== (await readsFor(endYear - 1))[OCTOBER + 1]) throw new StatementError("the table must start at the true-up year's first cycle");
  if (monthly && (await db.query("SELECT 1 FROM true_up_statement WHERE true_up_end_year = $1", [endYear])).rowCount) {
    throw new StatementError(`${trueUpLabel(endYear)}'s true-up statement is already stored`);
  }

  for (const row of rows) {
    const [peak, offPeak, net] = (["peak_kwh", "off_peak_kwh", "net_kwh"] as const).map((figure) => number(row[figure], row.end_date, figure));
    if (Math.abs(peak + offPeak - net) > KWH_TOLERANCE) {
      throw new StatementError(`${row.end_date}: peak and off-peak sum to ${g(peak + offPeak)}, not its net of ${g(net)}`);
    }
  }
  for (const [figure, name, tolerance] of CHECKED.filter(([figure]) => !monthly || figure !== "minimum_delivery")) {
    const added = rows.reduce((sum, row) => sum + number(row[figure], row.end_date, figure), 0);
    const typedTotal = number(total[figure], "TOTAL", figure);
    if (sumMisses(added, typedTotal, rows.length, tolerance)) {
      throw new StatementError(`${name} sum to ${added.toFixed(2)}, not the total of ${typedTotal.toFixed(2)}`);
    }
  }

  const nemCharges = number(total.nem_charges, "TOTAL", "nem_charges");
  const minimum = monthly ? null : number(total.minimum_delivery, "TOTAL", "minimum_delivery");
  const starts = reads.slice(first - 1, first - 1 + rows.length);
  const revisions = monthly ? (await loadPricing()).revisions : [];
  return {
    true_up_end_year: endYear,
    nem_charges: nemCharges,
    minimum_delivery: minimum,
    amount_due: minimum == null ? null : pyRound(nemCharges - minimum, 2),
    cycles: rows.map((row, i) => ({
      end_read: endReads[i],
      net_peak_kwh: number(row.peak_kwh, row.end_date, "peak_kwh"),
      net_off_peak_kwh: number(row.off_peak_kwh, row.end_date, "off_peak_kwh"),
      net_kwh: number(row.net_kwh, row.end_date, "net_kwh"),
      nem_charges: number(row.nem_charges, row.end_date, "nem_charges"),
      // A monthly bill doesn't print it; nothing reads it per cycle, and the statement replaces it.
      minimum_delivery: monthly ? minimumDelivery(starts[i], shiftDay(endReads[i], -1), revisions) : number(row.minimum_delivery, row.end_date, "minimum_delivery"),
    })),
  };
}

// Stores a parsed statement or monthly bill in the caller's transaction, replacing the same true-up year's cycles.
export async function store(client: PoolClient, statement: Statement) {
  const year = statement.true_up_end_year;
  await client.query("DELETE FROM true_up_statement_cycle WHERE true_up_end_year = $1", [year]);
  if (statement.amount_due != null) {
    await client.query(
      `INSERT INTO true_up_statement (true_up_end_year, nem_charges, minimum_delivery, amount_due) VALUES ($1, $2, $3, $4)
       ON CONFLICT (true_up_end_year) DO UPDATE SET nem_charges = $2, minimum_delivery = $3, amount_due = $4`,
      [year, statement.nem_charges, statement.minimum_delivery, statement.amount_due],
    );
  }
  for (const cycle of statement.cycles) {
    await client.query(
      `INSERT INTO true_up_statement_cycle (end_read, true_up_end_year, net_peak_kwh, net_off_peak_kwh, net_kwh, nem_charges, minimum_delivery)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (end_read) DO UPDATE SET true_up_end_year = $2, net_peak_kwh = $3, net_off_peak_kwh = $4, net_kwh = $5, nem_charges = $6, minimum_delivery = $7`,
      [cycle.end_read, year, cycle.net_peak_kwh, cycle.net_off_peak_kwh, cycle.net_kwh, cycle.nem_charges, cycle.minimum_delivery],
    );
  }
}

export type StoredCycle = Statement["cycles"][number];

// A true-up year's stored cycles, oldest first, and its amount due once its true-up statement is stored.
export async function storedBill(year: number) {
  const [cycles, statement] = await Promise.all([
    db.query<StoredCycle>(
      `SELECT end_read::text AS end_read, net_peak_kwh, net_off_peak_kwh, net_kwh, nem_charges, minimum_delivery
       FROM true_up_statement_cycle WHERE true_up_end_year = $1 ORDER BY end_read`,
      [year],
    ),
    db.query<{ amount_due: number }>("SELECT amount_due FROM true_up_statement WHERE true_up_end_year = $1", [year]),
  ]);
  return { cycles: cycles.rows, amountDue: statement.rows[0]?.amount_due ?? null };
}

export const billYears = async () =>
  (await db.query<{ year: number }>("SELECT DISTINCT true_up_end_year AS year FROM true_up_statement_cycle")).rows.map((row) => row.year);
