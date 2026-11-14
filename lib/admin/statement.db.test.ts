// Ported from anton-tesla-api-ws tests/test_true_up_statement.py, against the tests' throwaway PostgreSQL, with the
// statements' CSV fixtures read into the admin form's rows.
import type { Client } from "pg";
import { afterAll, beforeAll, beforeEach, expect, test, vi } from "vitest";
import { fixture, monthly, table } from "@/test/statement";
import { ownDatabase, storeReads, storeRevision } from "@/test/true-up";
import type { Row, Total } from "./sums";

let owner: Client;
let statement: typeof import("./statement");
let writer: typeof import("./writer");

beforeAll(async () => {
  owner = await ownDatabase("admin_statement");
  statement = await import("./statement");
  writer = await import("./writer");
});

beforeEach(async () => {
  await owner.query("DELETE FROM meter_read; DELETE FROM rate_revision; DELETE FROM true_up_statement; DELETE FROM true_up_statement_cycle");
  for (const year of [2024, 2025, 2026]) await storeReads(owner, year);
  // 32 days at this rate is the $12.90 the true-up statement later gives the first cycle of '25 - '26.
  await storeRevision(owner, "2025-09-01", { minimum_delivery_daily: 0.40313 });
});

afterAll(async () => {
  await writer.writer.end();
  await (await import("@/lib/db")).db.end();
  await owner.end();
  vi.unstubAllEnvs();
});

const edited = (year: number, old: string, replacement: string) => {
  const text = fixture(year);
  expect(text.split(old)).toHaveLength(2);
  return table(text.replace(old, replacement));
};

const saved = async ([rows, total]: [Row[], Total]) => {
  const parsed = await statement.parse(rows, total);
  await writer.save((client) => statement.store(client, parsed));
  return parsed;
};

const cycles = async () =>
  (await owner.query("SELECT end_read::text AS end_read, nem_charges FROM true_up_statement_cycle ORDER BY end_read")).rows
    .map((cycle) => [cycle.end_read, cycle.nem_charges]);

const stored = async (year: number) =>
  (await owner.query("SELECT nem_charges, minimum_delivery, amount_due FROM true_up_statement WHERE true_up_end_year = $1", [year])).rows[0];

test("the 2026 statement", async () => {
  await saved(table(fixture(2026)));

  expect(await stored(2026)).toEqual({ nem_charges: 827.82, minimum_delivery: 60.09, amount_due: 767.73 });
  const all = await cycles();
  expect(all).toHaveLength(12);
  expect(all[0]).toEqual(["2025-11-04", 113.41]);
  expect(all.at(-1)).toEqual(["2026-10-05", 101.41]);
  const last = (await owner.query("SELECT net_peak_kwh, net_off_peak_kwh, net_kwh, true_up_end_year FROM true_up_statement_cycle WHERE end_read = '2026-10-05'")).rows[0];
  expect(last).toEqual({ net_peak_kwh: -59, net_off_peak_kwh: 411, net_kwh: 352, true_up_end_year: 2026 });
});

test("the 2025 statement's older dates map to their reads", async () => {
  await saved(table(fixture(2025)));

  expect(await stored(2025)).toEqual({ nem_charges: 699.9, minimum_delivery: 145.07, amount_due: 554.83 });
  // 11/03/2024 is the day before the November 4 read; 10/03/2025 is the October 3 read.
  const all = await cycles();
  expect(all[0]).toEqual(["2024-11-04", 52.89]);
  expect(all.at(-1)).toEqual(["2025-10-03", 100.49]);
});

test("saving again replaces the statement", async () => {
  await saved(table(fixture(2026)));

  await saved(edited(2026, "10/05/2026,-59,411,352,101.41,0\nTOTAL,419,2020,2437,827.82,60.09",
    "10/05/2026,-59,411,352,101.51,0\nTOTAL,419,2020,2437,827.92,60.09"));

  const all = await cycles();
  expect(all).toHaveLength(12);
  expect(all.at(-1)).toEqual(["2026-10-05", 101.51]);
  expect((await stored(2026)).amount_due).toBe(767.83);
});

test.each([
  ["11/04/2025,64,300,364,113.41", "11/04/2025,64,300,364,131.41", "NEM charges sum to 845.82, not the total of 827.82"],
  ["11/04/2025,64,300,364", "11/04/2025,46,300,364", "11/04/2025: peak and off-peak sum to 346, not its net of 364"],
  ["06/05/2026,-104,-293,-397,-101.36,0", ",,,,,", "expected 12 cycles, found 11"],
  ["06/05/2026,", "06/15/2026,", "06/15/2026 isn't a meter read or the day before one"],
  ["10/05/2026,-59,411,352,101.41,0", "10/05/2026,-59,411,352,101.41,9", "minimum delivery charges sum to 69.09, not the total of 60.09"],
])("figures that don't add up store nothing: %s", async (old, replacement, reason) => {
  await expect(saved(edited(2026, old, replacement))).rejects.toThrow(reason);
  expect(await cycles()).toEqual([]);
});

test("a figure that isn't a number names its row", async () => {
  await expect(saved(edited(2026, "02/05/2026,206,", "02/05/2026,2O6,"))).rejects.toThrow("02/05/2026: peak kWh isn't a number");
});

test("an end date that isn't MM/DD/YYYY says so", async () => {
  await expect(saved(edited(2026, "02/05/2026,", "2026-02-05,"))).rejects.toThrow("2026-02-05 isn't a date (MM/DD/YYYY)");
});

test("a table without its TOTAL row stores nothing", async () => {
  const [rows] = table(fixture(2026));
  const blank = { peak_kwh: "", off_peak_kwh: "", net_kwh: "", nem_charges: "", minimum_delivery: "" };
  await expect(saved([rows, blank])).rejects.toThrow("expected one TOTAL row");
});

test("blank rows are left out", async () => {
  const [rows, total] = table(fixture(2026));
  const blank = { end_date: " ", peak_kwh: "", off_peak_kwh: "", net_kwh: "", nem_charges: "", minimum_delivery: "" };
  await saved([[blank, ...rows.slice(0, 6), blank, ...rows.slice(6)], total]);
  expect(await cycles()).toHaveLength(12);
});

test("the stored statement says what it holds", async () => {
  const parsed = await saved(table(fixture(2026)));
  expect(parsed).toMatchObject({ true_up_end_year: 2026, nem_charges: 827.82, minimum_delivery: 60.09, amount_due: 767.73 });
  expect(parsed.cycles.map((cycle) => cycle.end_read)).toEqual([
    "2025-11-04", "2025-12-05", "2026-01-06", "2026-02-05", "2026-03-09", "2026-04-07",
    "2026-05-06", "2026-06-05", "2026-07-06", "2026-08-04", "2026-09-03", "2026-10-05",
  ]);
});

// --- A monthly bill's table: the cycles so far, without minimum delivery --------------

test("a monthly bill stores its cycles and nothing about the year", async () => {
  const parsed = await saved(monthly(["11/04/2025,64,300,364,113.41"], "64,300,364,113.41"));

  expect(await cycles()).toEqual([["2025-11-04", 113.41]]);
  const cycle = (await owner.query("SELECT net_kwh, true_up_end_year, minimum_delivery FROM true_up_statement_cycle")).rows[0];
  expect(cycle).toEqual({ net_kwh: 364, true_up_end_year: 2026, minimum_delivery: 12.9 });
  expect(await stored(2026)).toBeUndefined();
  expect(parsed.amount_due).toBeNull();
});

test("the next month's bill replaces the last", async () => {
  await saved(monthly(["11/04/2025,64,300,364,113.40"], "64,300,364,113.40"));

  await saved(monthly(["11/04/2025,64,300,364,113.41", "12/05/2025,247,302,549,172.92"], "311,602,913,286.33"));

  expect(await cycles()).toEqual([["2025-11-04", 113.41], ["2025-12-05", 172.92]]);
});

test("a monthly bill must start at the year's first cycle", async () => {
  await expect(saved(monthly(["12/05/2025,247,302,549,172.92"], "247,302,549,172.92")))
    .rejects.toThrow("the table must start at the true-up year's first cycle");
  expect(await cycles()).toEqual([]);
});

test("a monthly bill after the true-up statement stores nothing", async () => {
  await saved(table(fixture(2026)));

  await expect(saved(monthly(["11/04/2025,64,300,364,113.00"], "64,300,364,113.00")))
    .rejects.toThrow("'25 - '26's true-up statement is already stored");
  const all = await cycles();
  expect(all).toHaveLength(12);
  expect(all[0]).toEqual(["2025-11-04", 113.41]);
});

test("12 cycles need minimum delivery", async () => {
  const [rows, total] = table(fixture(2026));
  const without = rows.map((row) => ({ ...row, minimum_delivery: "" }));

  await expect(saved([without, { ...total, minimum_delivery: "" }]))
    .rejects.toThrow("12 cycles are a true-up statement, which needs minimum delivery");
  expect(await cycles()).toEqual([]);
});

test("minimum delivery on only some rows names the first row without it", async () => {
  await expect(saved(edited(2026, "03/09/2026,107,247,353,126.35,9.68", "03/09/2026,107,247,353,126.35,")))
    .rejects.toThrow("03/09/2026: minimum delivery isn't a number");
  expect(await cycles()).toEqual([]);
});

// --- What the admin page shows ---------------------------------------------------------

test("a year's stored bill: its cycles oldest first, and the amount due once its statement is stored", async () => {
  await saved(monthly(["11/04/2025,64,300,364,113.41"], "64,300,364,113.41"));
  expect(await statement.storedBill(2026)).toEqual({
    cycles: [{ end_read: "2025-11-04", net_peak_kwh: 64, net_off_peak_kwh: 300, net_kwh: 364, nem_charges: 113.41, minimum_delivery: 12.9 }],
    amountDue: null,
  });

  await saved(table(fixture(2026)));
  const bill = await statement.storedBill(2026);
  expect(bill.cycles.map((cycle) => cycle.end_read)).toEqual([...bill.cycles.map((cycle) => cycle.end_read)].sort());
  expect(bill.cycles).toHaveLength(12);
  expect(bill.amountDue).toBe(767.73);
  expect(await statement.storedBill(2027)).toEqual({ cycles: [], amountDue: null });
});

test("the years with stored cycles", async () => {
  expect(await statement.billYears()).toEqual([]);
  await saved(table(fixture(2025)));
  await saved(table(fixture(2026)));
  expect((await statement.billYears()).sort()).toEqual([2025, 2026]);
});
