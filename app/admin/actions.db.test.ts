import type { Client } from "pg";
import { afterAll, beforeAll, beforeEach, expect, test, vi } from "vitest";
import type { Row, Total } from "@/lib/admin/sums";
import { fixture, monthly, table } from "@/test/statement";
import { ownDatabase, storeReads, storeRevision } from "@/test/true-up";

let isOwner = true;
vi.mock("@/lib/admin/access", () => ({
  owner: async () => {
    if (!isOwner) throw new Error("NEXT_NOT_FOUND");
  },
}));
const revalidatePath = vi.fn();
vi.mock("next/cache", () => ({ revalidatePath: (path: string) => revalidatePath(path) }));

let owner: Client;
let actions: typeof import("./actions");

beforeAll(async () => {
  owner = await ownDatabase("admin_actions");
  actions = await import("./actions");
});

beforeEach(async () => {
  isOwner = true;
  revalidatePath.mockClear();
  await owner.query("DELETE FROM meter_read; DELETE FROM rate_revision; DELETE FROM true_up_statement; DELETE FROM true_up_statement_cycle");
  for (const year of [2024, 2025, 2026]) await storeReads(owner, year);
  await storeRevision(owner, "2025-09-01", { minimum_delivery_daily: 0.40313 });
});

afterAll(async () => {
  await (await import("@/lib/admin/writer")).writer.end();
  await (await import("@/lib/db")).db.end();
  await owner.end();
  vi.unstubAllEnvs();
});

const BLANK: Row = { end_date: "", peak_kwh: "", off_peak_kwh: "", net_kwh: "", nem_charges: "", minimum_delivery: "" };

// The bill form as posted: always 12 rows, blank where nothing was typed, and its TOTAL row.
const form = ([rows, total]: [Row[], Total]) => {
  const data = new FormData();
  for (const row of [...rows, ...Array<Row>(12 - rows.length).fill(BLANK)]) {
    for (const [name, value] of Object.entries(row)) data.append(name, value);
  }
  for (const [name, value] of Object.entries(total)) data.append(`total_${name}`, value);
  return data;
};

const cycleCount = async () => Number((await owner.query("SELECT count(*) FROM true_up_statement_cycle")).rows[0].count);

test("without the owner nothing is read or stored", async () => {
  isOwner = false;
  await expect(actions.saveBill(null, form(table(fixture(2026))))).rejects.toThrow("NEXT_NOT_FOUND");
  expect(await cycleCount()).toBe(0);
  expect(revalidatePath).not.toHaveBeenCalled();
});

test("a refused table says why and comes back as it was typed", async () => {
  const typed = table(fixture(2026).replace("11/04/2025,64,300,364", "11/04/2025,46,300,364"));

  const result = await actions.saveBill(null, form(typed));

  expect(result).toEqual({
    ok: false,
    message: "Stored nothing. 11/04/2025: peak and off-peak sum to 346, not its net of 364.",
    values: { rows: typed[0], total: typed[1] },
  });
  expect(await cycleCount()).toBe(0);
  expect(revalidatePath).not.toHaveBeenCalled();
});

test("a true-up statement is stored and says what it stored", async () => {
  const result = await actions.saveBill(null, form(table(fixture(2026))));

  expect(result).toEqual({
    ok: true,
    message: "Stored 12 cycles of '25 - '26 from the true-up statement: $827.82 of NEM charges, $60.09 of minimum delivery, $767.73 due.",
  });
  expect(await cycleCount()).toBe(12);
  expect(revalidatePath).toHaveBeenCalledWith("/admin");
});

test("a monthly bill says how many cycles it stored", async () => {
  const result = await actions.saveBill(null, form(monthly(["11/04/2025,64,300,364,113.41"], "64,300,364,113.41")));

  expect(result).toEqual({ ok: true, message: "Stored 1 cycle of '25 - '26 from PG&E's bill: $113.41 of NEM charges." });
  expect(await cycleCount()).toBe(1);
});

test("a stored statement loaded into the form, corrected and saved again, replaces it", async () => {
  await actions.saveBill(null, form(table(fixture(2026))));
  const { storedBill } = await import("@/lib/admin/statement");
  const { loaded } = await import("@/lib/admin/sums");
  const { rows, total } = loaded((await storedBill(2026)).cycles, true);

  const result = await actions.saveBill(null, form([rows.map((row, i) => (i === 11 ? { ...row, nem_charges: "101.51" } : row)), { ...total, nem_charges: "827.92" }]));

  expect(result?.message).toContain("$767.83 due");
  expect((await owner.query("SELECT nem_charges FROM true_up_statement_cycle WHERE end_read = '2026-10-05'")).rows[0].nem_charges).toBe(101.51);
});

// --- VPP days ---------------------------------------------------------------------------

const day = (date: string) => {
  const data = new FormData();
  data.append("day", date);
  return data;
};
const vppMarked = async () => (await owner.query("SELECT date FROM data WHERE is_vpp ORDER BY date")).rows.map((row) => row.date);

test("marking and unmarking need the owner", async () => {
  await owner.query("DELETE FROM data; INSERT INTO data (date, powerwall_to_grid, is_vpp) VALUES ('2026-09-03', 18.9, true), ('2026-09-18', 12.6, false)");
  isOwner = false;
  await expect(actions.markVppDay(null, day("2026-09-18"))).rejects.toThrow("NEXT_NOT_FOUND");
  await expect(actions.unmarkVppDay(null, day("2026-09-03"))).rejects.toThrow("NEXT_NOT_FOUND");
  expect(await vppMarked()).toEqual(["2026-09-03"]);
});

test("marking a day says so, and a refusal says why", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(Date.parse("2026-11-14T20:00:00Z"));
  try {
    await owner.query("DELETE FROM data; INSERT INTO data (date, powerwall_to_grid, is_vpp) VALUES ('2026-09-03', 18.9, true), ('2026-09-18', 12.6, false)");
    expect(await actions.markVppDay(null, day("2026-09-18"))).toEqual({ ok: true, message: "Marked Friday, September 18, 2026 as a VPP day." });
    expect(revalidatePath).toHaveBeenCalledWith("/admin");
    expect(await actions.markVppDay(null, day("2026-11-20"))).toEqual({ ok: false, message: "Stored nothing: November 20, 2026 has no data yet." });
    expect(await actions.unmarkVppDay(null, day("2026-09-03"))).toEqual({ ok: true, message: "Unmarked Thursday, September 3, 2026." });
    expect(await vppMarked()).toEqual(["2026-09-18"]);
  } finally {
    vi.useRealTimers();
  }
});

// --- VPP payout -------------------------------------------------------------------------

const payout = (season: string, amount: string, paidOn: string) => {
  const data = new FormData();
  data.append("season", season);
  data.append("amount", amount);
  data.append("paid_on", paidOn);
  return data;
};

test("recording a payout needs the owner", async () => {
  await owner.query("DELETE FROM vpp_payout");
  isOwner = false;
  await expect(actions.savePayout(null, payout("2025", "728.26", "2026-04-15"))).rejects.toThrow("NEXT_NOT_FOUND");
  expect((await owner.query("SELECT * FROM vpp_payout")).rows).toEqual([]);
});

test("a recorded payout says so, and a refusal says why and keeps what was typed", async () => {
  await owner.query("DELETE FROM vpp_payout");
  expect(await actions.savePayout(null, payout("2025", "728.26", "2026-04-15")))
    .toEqual({ ok: true, message: "Recorded the 2025 season: $728.26, paid April 15, 2026." });
  expect(revalidatePath).toHaveBeenCalledWith("/admin");
  expect(await actions.savePayout(null, payout("2025", "0", "2026-04-15"))).toEqual({
    ok: false, message: "Stored nothing: the amount must be positive.", values: { season: "2025", amount: "0", paid_on: "2026-04-15" },
  });
});

test.each(["", "soon", "2026-02-30"])("a day of %j is refused, not an error", async (date) => {
  expect((await actions.savePayout(null, payout("2025", "728.26", date)))?.message).toBe("Stored nothing: pick the date it was paid.");
  expect((await actions.markVppDay(null, day(date)))?.message).toBe("Stored nothing: pick a day.");
  expect((await actions.unmarkVppDay(null, day(date)))?.message).toBe("Stored nothing: pick a day.");
});
