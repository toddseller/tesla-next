// payback() against a database of its own, with placeholder costs in a temporary file (system-payback spec).
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Client } from "pg";
import { afterAll, beforeAll, expect, test, vi } from "vitest";

import { ownDatabase, seedIntervals, storeReads, storeRevision } from "@/test/true-up";

let owner: Client;
let payback: typeof import("./payback").payback;

const COSTS = { solar: 25_000, powerwalls: 20_000, sales_tax: 3_000, credit_rate: 0.26 };
const costsFile = () => {
  const path = join(mkdtempSync(join(tmpdir(), "costs-")), "costs.json");
  writeFileSync(path, JSON.stringify(COSTS));
  return path;
};

beforeAll(async () => {
  owner = await ownDatabase("tsr_payback");
  ({ payback } = await import("./payback"));
  for (const year of [2024, 2025, 2026]) await storeReads(owner, year);
  await storeRevision(owner, "2023-09-01");
  // A sunny week in each priced year, and solar output for the two estimated years.
  for (const [first, last] of [["2023-10-05", "2023-10-11"], ["2024-10-05", "2024-10-11"], ["2025-10-05", "2025-10-11"]]) {
    await seedIntervals(owner, first, last, { solar_generated_wh: 300, house_from_solar_wh: 100, grid_exported_from_solar_wh: 200, house_from_grid_wh: 50, grid_imported_wh: 50 });
  }
  await owner.query(`INSERT INTO data (date, solar_generated) SELECT d::date::text, 20 FROM generate_series('2021-10-22'::date, '2023-09-30'::date, '1 day') d`);
  await owner.query(`INSERT INTO data (date, solar_generated) SELECT d::date::text, 20 FROM generate_series('2023-10-01'::date, '2024-09-30'::date, '1 day') d`);
});

afterAll(async () => {
  await owner.end();
  vi.unstubAllEnvs();
});

test("without a costs file there is no payback", async () => {
  vi.stubEnv("SYSTEM_COSTS_FILE", "");
  expect(await payback("2026-11-09")).toBeNull();
});

test("with one, only years and markers leave: solar, solar for the whole system, the Powerwalls, and their outage record", async () => {
  vi.stubEnv("SYSTEM_COSTS_FILE", costsFile());
  const answer = (await payback("2026-11-09"))!;
  expect(Object.keys(answer).sort()).toEqual(["outages", "powerwalls", "solar", "system"]);
  expect(answer.solar).toMatchObject({ estimated: true });
  expect(answer.system).toMatchObject({ estimated: true });
  expect(answer.powerwalls).toEqual({ year: null, wont: true });
  expect(answer.outages).toEqual({ count: 0, hours: 0, longest_hours: null });
  for (const part of [answer.solar, answer.system]) expect(Object.keys(part).sort()).toEqual(["estimated", "projected", "year"]);
  // No cost, net cost or amount left: the placeholder costs' figures never appear in the answer.
  expect(JSON.stringify(answer)).not.toMatch(/25000|20000|3000|19733|15786/);
});
