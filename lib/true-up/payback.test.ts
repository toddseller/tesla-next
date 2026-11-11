// Payback (system-payback spec), with placeholder costs only: the owner's real costs never enter the repository.
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, test, vi } from "vitest";

import { earlyEstimate, earlyYears, monthOf, netCosts, paybackDate, powerwallsPayback, readCosts } from "./payback";

const COSTS = { solar: 25_000, powerwalls: 20_000, sales_tax: 3_000, credit_rate: 0.26 };

describe("netCosts", () => {
  test("each part's price plus its share of the tax, less the credit", () => {
    const { solar, powerwalls } = netCosts(COSTS);
    expect(solar).toBeCloseTo(19_733.33, 2);
    expect(powerwalls).toBeCloseTo(15_786.67, 2);
  });
});

describe("earlyEstimate", () => {
  test("the first priced year's saving scaled by solar output and by average cost", () => {
    expect(earlyEstimate({ saving: 5_000, solarKwh: 10_000, cost: 0.35931 }, { solarKwh: 9_500, cost: 0.30334 })).toBeCloseTo(4_010.09, 2);
  });
});

describe("earlyYears", () => {
  const YEARS = [{ start_date: "2021-10-01", end_date: "2022-09-30" }, { start_date: "2022-10-01", end_date: "2023-09-30" }];
  // Solar output from PTO only, so '21 - '22's estimate already covers just its days from PTO.
  const kwh = (endYear: number) => ({ 2022: 9_500, 2023: 10_500, 2024: 10_000 })[endYear]!;

  test("'21 - '22 starts at PTO, so its estimate isn't cut to PTO a second time", () => {
    const [first, second] = earlyYears({ saving: 5_000, solarKwh: 10_000 }, kwh, YEARS);
    expect(first).toMatchObject({ start: "2021-10-22", end: "2022-09-30", priced: false });
    expect(first.saving).toBeCloseTo((5_000 * 0.95 * 0.30334) / 0.35931, 6);
    expect(second.start).toBe("2022-10-01");
    expect(second.saving).toBeCloseTo((5_000 * 1.05 * 0.35142) / 0.35931, 6);
    expect(paybackDate([first], first.saving).date).toBe("2022-09-30");
  });
});

// True-up years with their savings, the current one counted through its last day.
const year = (start: string, end: string, saving: number, priced = true) => ({ start, end, saving, priced });

describe("paybackDate", () => {
  test("'21 - '22 counts from PTO, 344 of its 365 days", () => {
    const [first] = [year("2021-10-01", "2022-09-30", 4_010.09, false)];
    expect(paybackDate([first], 3_779.37).date).toBe("2022-09-30");
  });

  test("the crossing year is counted at an even rate through its days", () => {
    const years = [year("2021-10-22", "2024-09-30", 18_000, false), year("2024-10-01", "2025-09-30", 6_000)];
    const payback = paybackDate(years, 19_733.33);
    expect(payback).toMatchObject({ projected: false, estimated: true });
    expect(payback.date).toBe("2025-01-14");
  });

  test("before the cost is reached, the rest is projected at the average of the priced years", () => {
    // $21,000 saved by September 30, 2025, $4,733.33 left at $6,000 a year: about 288 days more.
    const years = [year("2021-10-22", "2023-09-30", 9_000, false), year("2023-10-01", "2024-09-30", 6_000), year("2024-10-01", "2025-09-30", 6_000)];
    const payback = paybackDate(years, 25_733.33);
    expect(payback.projected).toBe(true);
    expect(payback.date!.slice(0, 7)).toBe("2026-07");
  });

  test("the whole system: $30,000 saved by September 30, 2026, $5,520 left at $6,000 a year", () => {
    const years = [
      year("2021-10-22", "2023-09-30", 12_000, false), year("2023-10-01", "2024-09-30", 6_000),
      year("2024-10-01", "2025-09-30", 6_000), year("2025-10-01", "2026-09-30", 6_000),
    ];
    expect(paybackDate(years, 35_520).date!.slice(0, 4)).toBe("2027");
  });

  test("a year counted only so far ends at its last counted day", () => {
    const years = [year("2021-10-22", "2025-09-30", 19_000, false), year("2025-10-01", "2025-12-31", 1_500)];
    expect(paybackDate(years, 19_733.33).date).toBe("2025-11-14");
  });

  test("with nothing priced, nothing can be projected", () => {
    expect(paybackDate([year("2021-10-22", "2023-09-30", 9_000, false)], 19_733.33)).toEqual({ date: null, projected: true, estimated: true });
  });
});

describe("powerwallsPayback", () => {
  test("a net that would take more than 10 years won't pay back", () => {
    const years = [{ added: -150, vpp: 433.33 }, { added: -150, vpp: 433.33 }, { added: -150, vpp: 433.34 }];
    expect(powerwallsPayback(15_786.67, years, "2026-11-09")).toEqual({ year: null, wont: true });
  });

  test("a net of nothing or less won't pay back", () => {
    expect(powerwallsPayback(15_786.67, [{ added: -150, vpp: 100 }], "2026-11-09")).toEqual({ year: null, wont: true });
  });

  test("a net that would cover the rest within 10 years gives the year", () => {
    expect(powerwallsPayback(10_000, [{ added: 500, vpp: 1_500 }, { added: 500, vpp: 1_500 }], "2026-11-09")).toEqual({ year: 2029, wont: false });
  });
});

describe("readCosts", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });
  const file = (text: string) => {
    const path = join(mkdtempSync(join(tmpdir(), "costs-")), "costs.json");
    writeFileSync(path, text);
    return path;
  };

  test("reads the file SYSTEM_COSTS_FILE names", () => {
    vi.stubEnv("SYSTEM_COSTS_FILE", file(JSON.stringify(COSTS)));
    expect(readCosts()).toEqual(COSTS);
  });

  test("an empty file, as compose mounts /dev/null without the variable, is null and logs nothing", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubEnv("SYSTEM_COSTS_FILE", file(""));
    expect(readCosts()).toBeNull();
    expect(error).not.toHaveBeenCalled();
  });

  test("unset, missing or malformed is null, logged without the file's contents", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubEnv("SYSTEM_COSTS_FILE", "");
    expect(readCosts()).toBeNull();
    vi.stubEnv("SYSTEM_COSTS_FILE", "/nonexistent/costs.json");
    expect(readCosts()).toBeNull();
    vi.stubEnv("SYSTEM_COSTS_FILE", file('{"solar": 12345, "powerwalls": "lots"}'));
    expect(readCosts()).toBeNull();
    expect(error.mock.calls.flat().join(" ")).not.toContain("12345");
  });
});

// system-payback, "Payback data": the month solar paid back leaves the server; a projected one gives its year alone.
describe("monthOf", () => {
  test("a payback that has happened gives its month; a projected or unknown one gives none", () => {
    expect(monthOf({ date: "2025-06-14", projected: false, estimated: true })).toBe("2025-06");
    expect(monthOf({ date: "2027-03-02", projected: true, estimated: true })).toBeNull();
    expect(monthOf({ date: null, projected: true, estimated: true })).toBeNull();
  });
});
