import { expect, test } from "vitest";
import { FIRST_METER_DAY, METER_FIX_DATE, readingsOf, reachesCorrected, withReadings } from "./meter";

// meter-correction, "The corrected days".
test("PG&E's readings run from 2023-10-06, and Tesla reads right from 2026-04-27", () => {
  expect(FIRST_METER_DAY).toBe("2023-10-06");
  expect(METER_FIX_DATE).toBe("2026-04-27");
});

test("only readings=tesla asks for Tesla's figures", () => {
  expect(readingsOf("tesla")).toBe("tesla");
  expect(readingsOf(undefined)).toBe("corrected");
  expect(readingsOf(null)).toBe("corrected");
  expect(readingsOf("pge")).toBe("corrected");
  expect(readingsOf(["tesla", "tesla"])).toBe("corrected");
});

test("a span reaches the corrected days when it overlaps 2023-10-06 to 2026-04-26", () => {
  expect(reachesCorrected("2025-10-01", "2025-10-31")).toBe(true);
  expect(reachesCorrected("2026-04-26", "2026-05-31")).toBe(true);
  expect(reachesCorrected("2026-04-27", "2026-05-31")).toBe(false);
  expect(reachesCorrected("2022-01-01", "2023-10-05")).toBe(false);
  expect(reachesCorrected("2021-10-10", "2023-10-06")).toBe(true);
});

test("an address in Tesla's view gains readings=tesla, the corrected view nothing", () => {
  expect(withReadings("/impact?start=2025-10-01&end=2025-10-31", "tesla")).toBe("/impact?start=2025-10-01&end=2025-10-31&readings=tesla");
  expect(withReadings("/patterns", "tesla")).toBe("/patterns?readings=tesla");
  expect(withReadings("/patterns", "corrected")).toBe("/patterns");
});
