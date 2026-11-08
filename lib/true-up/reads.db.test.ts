// Ported from anton-tesla-api-ws tests/test_meter_reads.py's read-side tests, against the tests' throwaway PostgreSQL.
import type { Client } from "pg";
import { afterAll, beforeAll, beforeEach, expect, test, vi } from "vitest";
import { ownDatabase, publishedReads as datesOf, storeReads } from "@/test/true-up";

let owner: Client;
let reads: typeof import("./reads");

const store = (year: number, dates?: string[]) => storeReads(owner, year, dates);

beforeAll(async () => {
  owner = await ownDatabase("tsr_reads");
  reads = await import("./reads");
});

beforeEach(async () => {
  await owner.query("DELETE FROM meter_read");
});

afterAll(async () => {
  await owner.end();
  vi.unstubAllEnvs();
});

test("stored reads are used as published", async () => {
  await store(2026);
  expect(await reads.readsFor(2026)).toEqual(datesOf(2026));
});

test("a year without reads is estimated on the 6th, off weekends", async () => {
  const estimated = await reads.readsFor(2022);

  expect(estimated).toHaveLength(12);
  expect(estimated[2]).toBe("2022-03-07"); // March 6, 2022 is a Sunday
  expect(estimated[7]).toBe("2022-08-05"); // August 6, 2022 is a Saturday
  expect(estimated[0]).toBe("2022-01-06"); // a Thursday stays
});

test("a partly stored year falls back to the estimate", async () => {
  await store(2026, datesOf(2026).slice(0, 11));
  expect(await reads.readsFor(2026)).toEqual(reads.estimatedReads(2026));
});

test("a true-up year has the 12 cycles ending the day before the October read", async () => {
  for (const year of [2024, 2025, 2026]) await store(year);

  const cycles = await reads.billingCycles("2025-10-01", "2026-09-30");

  expect(cycles).toHaveLength(12);
  expect(cycles[0]).toEqual(["2025-10-03", "2025-11-03"]);
  expect(cycles.at(-1)).toEqual(["2026-09-03", "2026-10-04"]);
});

test("cycles across estimated and published years", async () => {
  for (const year of [2024, 2025, 2026]) await store(year);

  // December 6, 2023 is estimated (a Wednesday); January 6, 2024 is published.
  expect(await reads.billingCycles("2023-12-01", "2023-12-31")).toEqual([["2023-12-06", "2024-01-05"]]);
});

test("a quarter has the cycles starting in each month", async () => {
  for (const year of [2024, 2025, 2026]) await store(year);

  const cycles = await reads.billingCycles("2026-01-01", "2026-03-31");

  expect(cycles.map(([first]) => first.slice(5, 7))).toEqual(["01", "02", "03"]);
  expect(cycles[0]).toEqual(["2026-01-06", "2026-02-04"]);
});

const current = (years: Awaited<ReturnType<typeof reads.trueUpYears>>) =>
  years.filter((year) => year.current).map((year) => [year.start_date, year.end_date]);

test.each([
  ["2026-10-04", "2025-10-01", "2026-09-30"], // the day before the October read
  ["2026-10-05", "2026-10-01", "2027-09-30"], // the read day starts the next cycle
  ["2026-10-10", "2026-10-01", "2027-09-30"],
])("on %s the current true-up year is %s to %s", async (today, start, end) => {
  for (const year of [2024, 2025, 2026]) await store(year);

  const years = await reads.trueUpYears(today);

  expect(current(years)).toEqual([[start, end]]);
  expect(years.find((year) => year.label === "'25 - '26")!.last_read_date).toBe("2026-10-05");
});

test("the list starts at 2021-22", async () => {
  const years = await reads.trueUpYears("2026-03-15");

  // 2022 has no published schedule: its October read is estimated (Thursday the 6th).
  expect(years[0]).toEqual({ label: "'21 - '22", start_date: "2021-10-01", end_date: "2022-09-30", last_read_date: "2022-10-06", current: false });
  expect(years).toHaveLength(5);
});

test("true-up years are labeled by their two years", () => {
  expect(reads.trueUpLabel(2026)).toBe("'25 - '26");
  expect(reads.trueUpLabel(2100)).toBe("'99 - '00");
});

test.each([
  ["2026-10-04", 2026], // the day before the October read
  ["2026-10-05", 2027], // the read day starts the next true-up year
  ["2026-03-15", 2026],
  ["2026-12-31", 2027],
])("%s belongs to the true-up year ending in %i, with an October read of October 5", (day, year) => {
  expect(reads.endYearOf(day, "2026-10-05")).toBe(year);
});
