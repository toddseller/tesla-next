// payback() prices only the current true-up year again: finished years are kept once priced (system-payback review).
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, expect, test, vi } from "vitest";

const trueUpSavings = vi.hoisted(() => vi.fn(async (start: string) => ({ solar_saved: 6_000, powerwalls_added: -150, through: start.startsWith("2026") ? "2026-11-09" : "2025-10-02" })));
vi.mock("@/lib/true-up/savings", () => ({ trueUpSavings }));
vi.mock("@/lib/true-up/cost", () => ({ vppSeason: async () => null }));
vi.mock("@/lib/backup", () => ({ backupHistory: async () => ({ summary: { outages: 0, seconds: 0, longest: null } }) }));
vi.mock("@/lib/db", () => ({ db: { query: async () => ({ rows: [] }) } }));
vi.mock("@/lib/true-up/reads", () => ({
  trueUpYears: async () => [
    { label: "'23 - '24", start_date: "2023-10-01", end_date: "2024-09-30", current: false },
    { label: "'24 - '25", start_date: "2024-10-01", end_date: "2025-09-30", current: false },
    { label: "'26 - '27", start_date: "2026-10-01", end_date: "2027-09-30", current: true },
  ],
}));

beforeAll(() => {
  const path = join(mkdtempSync(join(tmpdir(), "costs-")), "costs.json");
  writeFileSync(path, JSON.stringify({ solar: 25_000, powerwalls: 20_000, sales_tax: 3_000, credit_rate: 0.26 }));
  vi.stubEnv("SYSTEM_COSTS_FILE", path);
});

afterAll(() => vi.unstubAllEnvs());

test("a second call prices only the current year again", async () => {
  const { payback } = await import("./payback");
  await payback("2026-11-09");
  await payback("2026-11-09");
  const starts = trueUpSavings.mock.calls.map(([start]) => start);
  expect(starts.filter((start) => start === "2023-10-01")).toHaveLength(1);
  expect(starts.filter((start) => start === "2024-10-01")).toHaveLength(1);
  expect(starts.filter((start) => start === "2026-10-01")).toHaveLength(2);
});
