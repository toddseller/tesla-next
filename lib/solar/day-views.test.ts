// Ported from anton-tesla-api-ws utils/dayViews.test.js: the summaries with their values unchanged; the Chart.js
// dataset and option tests rewritten for the Recharts series, rows and axes that replace them, checking the same
// stacking and axis ranges; the estimate tests dropped with the dashes they checked.
import { describe, expect, test } from "vitest";

import { chargeLevel, clockTime, daySpans, FLOW_COLORS, hasBatteryHistory, outlines, timeTick, unitOnTopTick, viewChart, viewSummary } from "./day-views";

// Oct 16, 2026 at watt-hour precision (Tesla app: Total Generated 43.3, Home 12.3 kWh).
const totals = {
  solar_to_home: 12.27,
  solar_to_powerwall: 20.26,
  solar_to_grid: 10.77,
  powerwall_to_home: 17.56,
  powerwall_to_grid: 0.0,
  grid_to_home: 0.056,
  grid_to_powerwall: 0.0,
};

const data = [
  { minute: 0, solar_to_home_kw: 0, solar_to_powerwall_kw: 0, solar_to_grid_kw: 0, powerwall_to_home_kw: 0.9,
    powerwall_to_grid_kw: 0, grid_to_home_kw: 0, grid_to_powerwall_kw: 0, battery_percentage: 61 },
  { minute: 720, solar_to_home_kw: 1.2, solar_to_powerwall_kw: 4.8, solar_to_grid_kw: 0.4, powerwall_to_home_kw: 0,
    powerwall_to_grid_kw: 0, grid_to_home_kw: 0, grid_to_powerwall_kw: 0, battery_percentage: null },
  { minute: 725, solar_to_home_kw: null, solar_to_powerwall_kw: null, solar_to_grid_kw: null,
    powerwall_to_home_kw: null, powerwall_to_grid_kw: null, grid_to_home_kw: null, grid_to_powerwall_kw: null,
    battery_percentage: 75 },
];

describe("viewSummary", () => {
  test("solar: total generated and where it went", () => {
    const summary = viewSummary("solar", totals);

    expect(summary.headline).toBe("Total Generated");
    expect(summary.value.toFixed(1)).toBe("43.3");
    expect(summary.sections[0].title).toBe("Used By");
    expect(summary.sections[0].items.map((i) => [i.label, i.kwh.toFixed(1), i.percent])).toEqual([
      ["Home", "12.3", 28],
      ["Powerwall", "20.3", 47],
      ["Grid", "10.8", 25],
    ]);
  });

  test("home: total usage and its sources", () => {
    const summary = viewSummary("home", totals);

    expect(summary.headline).toBe("Total Usage");
    expect(summary.value.toFixed(1)).toBe("29.9");
    expect(summary.sections[0].items.map((i) => i.label)).toEqual(["Solar", "Powerwall", "Grid"]);
  });

  test("powerwall: discharged and charged headlines with both breakdowns", () => {
    const summary = viewSummary("powerwall", totals);

    expect(summary.headline).toBe("Discharged");
    expect(summary.value.toFixed(1)).toBe("17.6");
    expect(summary.headlines.map((h) => [h.label, h.value.toFixed(1)])).toEqual([["Discharged", "17.6"], ["Charged", "20.3"]]);
    expect(summary.sections.map((s) => s.title)).toEqual(["Discharged To", "Charged From"]);
  });

  test("powerwall headlines as in the Tesla app", () => {
    const summary = viewSummary("powerwall", { powerwall_to_home: 15.1, solar_to_powerwall: 4.2, grid_to_powerwall: 2.1 });

    expect(summary.headlines.map((h) => [h.label, h.value.toFixed(1)])).toEqual([["Discharged", "15.1"], ["Charged", "6.3"]]);
  });

  test("other views have a single headline", () => {
    expect(viewSummary("home", totals).headlines).toHaveLength(1);
    expect(viewSummary("home", totals).net).toBeUndefined();
  });

  test("grid headlines Imported and Exported, with net export when exports exceed imports", () => {
    const summary = viewSummary("grid", totals);
    const [imported, exported] = summary.headlines;

    expect(summary.headlines.map((h) => h.label)).toEqual(["Imported", "Exported"]);
    expect((exported.value - imported.value).toFixed(1)).toBe("10.7");
    expect(summary.net!.label).toBe("Exported");
    expect(summary.net!.value.toFixed(1)).toBe("10.7");
    expect(summary.sections.map((s) => s.title)).toEqual(["Imported To", "Exported From"]);
  });

  test("grid: net import when imports exceed exports", () => {
    // Oct 6, as in the Tesla app: 84.7 imported, 55.0 exported, 29.7 net imported.
    const summary = viewSummary("grid", {
      grid_to_home: 17.689, grid_to_vehicle: 34.34, grid_to_powerwall: 32.664, solar_to_grid: 28.823, powerwall_to_grid: 26.209,
    }, { vehicleData: true });

    expect(summary.headlines.map((h) => [h.label, h.value.toFixed(1)])).toEqual([["Imported", "84.7"], ["Exported", "55.0"]]);
    expect([summary.net!.label, summary.net!.value.toFixed(1)]).toEqual(["Imported", "29.7"]);
  });

  test("grid: a net that displays as 0.0 kWh reads Exported", () => {
    expect(viewSummary("grid", {}).net).toEqual({ label: "Exported", value: 0 });
    expect(viewSummary("grid", { grid_to_home: 0.042, solar_to_grid: 0.019 }).net!.label).toBe("Exported");
  });

  test("a day with no data shows zero kWh and no percentages", () => {
    const summary = viewSummary("solar", {});

    expect(summary.value).toBe(0);
    expect(summary.sections[0].items.every((i) => i.percent === null && i.kwh === 0)).toBe(true);
  });

  test("metering noise totals show no percentages", () => {
    // Oct 17: 42 Wh imported, 19 + 24 Wh exported.
    const summary = viewSummary("grid", { grid_to_home: 0.042, solar_to_grid: 0.019, powerwall_to_grid: 0.024 });

    expect(summary.sections.flatMap((s) => s.items.map((i) => i.percent))).toEqual([null, null, null, null]);
  });

  test("percentages return once a total reaches 0.1 kWh when displayed", () => {
    const items = viewSummary("grid", { grid_to_home: 0.04, grid_to_powerwall: 0.02 }).sections[0].items;

    expect(items.map((i) => i.percent)).toEqual([67, 33]);
  });
});

describe("viewChart", () => {
  test("solar stacks home, powerwall, grid areas above zero on minutes since midnight", () => {
    const { series, rows } = viewChart("solar", data);

    expect(series.map((s) => [s.label, s.stack])).toEqual([["Home", "above"], ["Powerwall", "above"], ["Grid", "above"]]);
    expect(rows[1]).toMatchObject({ minute: 720, solar_to_home: 1.2 });
  });

  test("grid stacks imports above zero and exports below zero", () => {
    const { series, rows } = viewChart("grid", data);

    expect(series.map((s) => [s.label, s.stack])).toEqual([
      ["Home", "above"], ["Powerwall", "above"], ["Solar", "below"], ["Powerwall", "below"],
    ]);
    expect(rows[1]).toMatchObject({ minute: 720, solar_to_grid: -0.4 });
  });

  test("missing values stay null so areas break", () => {
    expect(viewChart("solar", data).rows[2]).toMatchObject({ minute: 725, solar_to_home: null });
    expect(chargeLevel(data).rows.map((r) => r.level)).toEqual([61, null, 75]);
  });

  test("each flow keeps its color", () => {
    const { series } = viewChart("powerwall", data);
    expect(series.find((s) => s.key === "powerwall_to_home")!.color).toBe(FLOW_COLORS.home);
    expect(series.find((s) => s.key === "solar_to_powerwall")!.color).toBe(FLOW_COLORS.solar);
  });
});

describe("axes", () => {
  test("the time of day, not the minute's number", () => {
    expect([760, 0, 5, 720, 1435].map(clockTime)).toEqual(["12:40 PM", "12:00 AM", "12:05 AM", "12:00 PM", "11:55 PM"]);
  });

  test("full-day axis with 6 AM, 12 PM, 6 PM ticks", () => {
    expect([360, 720, 1080].map(timeTick)).toEqual(["6 AM", "12 PM", "6 PM"]);
  });

  test("unit only on the top tick", () => {
    const label = unitOnTopTick(" kW");
    expect([0, 4, 8].map((value, i) => label(value, i, 3))).toEqual(["0", "4", "8 kW"]);
    expect(unitOnTopTick("%")(100, 2, 3)).toBe("100%");
  });

  test("power views have a minimum 1 kW range so noise reads flat", () => {
    const quiet = [{ minute: 0, grid_to_home_kw: 0.02, solar_to_grid_kw: 0.01, solar_to_home_kw: 0.01, powerwall_to_home_kw: 0 }];
    expect(viewChart("solar", quiet).domain).toEqual([0, 1]);
    expect(viewChart("home", quiet).domain).toEqual([0, 1]);
    expect(viewChart("grid", quiet).domain).toEqual([-1, 1]);
  });

  test("a normal day still scales past 1 kW, to a round number as Chart.js did", () => {
    expect(viewChart("solar", [{ minute: 720, solar_to_home_kw: 1.2, solar_to_powerwall_kw: 5.1, solar_to_grid_kw: 1.2 }]).domain).toEqual([0, 8]);
    expect(viewChart("solar", [{ minute: 720, solar_to_home_kw: 1.39, solar_to_powerwall_kw: 5.62 }]).domain).toEqual([0, 8]);
    expect(viewChart("grid", [{ minute: 720, grid_to_home_kw: 2.3, solar_to_grid_kw: 5.35 }]).domain).toEqual([-6, 4]);
  });

  test("the charge level chart uses a 0 to 100 percent axis", () => {
    expect(chargeLevel(data).domain).toEqual([0, 100]);
  });
});

test("hasBatteryHistory", () => {
  expect(hasBatteryHistory(data)).toBe(true);
  expect(hasBatteryHistory([{ battery_percentage: null }])).toBe(false);
});

describe("vehicle charging", () => {
  // A day like Oct 14 in the Tesla app: 3.4 kWh of solar went to the car.
  const withCar = { ...totals, solar_to_home: 8.87, solar_to_vehicle: 3.4, powerwall_to_vehicle: 4.8, grid_to_vehicle: 0.9 };
  const labels = (summary: ReturnType<typeof viewSummary>, section = 0) => summary.sections[section].items.map((i) => i.label);

  test("Used By, Discharged To and Imported To include Vehicle on days with vehicle data", () => {
    expect(labels(viewSummary("solar", withCar, { vehicleData: true }))).toEqual(["Home", "Vehicle", "Powerwall", "Grid"]);
    expect(labels(viewSummary("powerwall", withCar, { vehicleData: true }), 0)).toEqual(["Home", "Vehicle", "Grid"]);
    expect(labels(viewSummary("grid", withCar, { vehicleData: true }), 0)).toEqual(["Home", "Vehicle", "Powerwall"]);
  });

  test("days without vehicle data omit Vehicle lines and bands", () => {
    expect(labels(viewSummary("solar", totals, { vehicleData: false }))).toEqual(["Home", "Powerwall", "Grid"]);
    expect(viewChart("solar", data, { vehicleData: false }).series.map((s) => s.label)).toEqual(["Home", "Powerwall", "Grid"]);
    expect(viewChart("solar", data, { vehicleData: true }).series.map((s) => s.label)).toEqual(["Home", "Vehicle", "Powerwall", "Grid"]);
  });

  test("solar Used By shows the vehicle's share and Home without it", () => {
    const items = viewSummary("solar", withCar, { vehicleData: true }).sections[0].items;

    expect(items[1]).toMatchObject({ label: "Vehicle", kwh: 3.4 });
    expect(items[0].kwh).toBe(8.87);
  });

  test("Vehicle view: Charged is the sum of vehicle flows, Charged From is Solar, Powerwall, Grid", () => {
    const summary = viewSummary("vehicle", withCar, { vehicleData: true });

    expect(summary.headline).toBe("Charged");
    expect(summary.value).toBeCloseTo(9.1);
    expect(summary.sections[0].title).toBe("Charged From");
    expect(labels(summary)).toEqual(["Solar", "Powerwall", "Grid"]);
  });

  test("an overnight charge entirely from the Powerwall is 100% Powerwall", () => {
    const summary = viewSummary("vehicle", { powerwall_to_vehicle: 4.8 }, { vehicleData: true });

    expect(summary.value).toBeCloseTo(4.8);
    expect(summary.sections[0].items.map((i) => i.percent)).toEqual([0, 100, 0]);
  });

  test("Discharged includes the car", () => {
    expect(viewSummary("powerwall", withCar, { vehicleData: true }).value).toBeCloseTo(totals.powerwall_to_home + 4.8);
  });

  test("Vehicle view stacks the three sources", () => {
    const vehicleData = [{ minute: 60, solar_to_vehicle_kw: 0, powerwall_to_vehicle_kw: 9.6, grid_to_vehicle_kw: 0 }];

    expect(viewChart("vehicle", vehicleData, { vehicleData: true }).series.map((s) => [s.label, s.stack])).toEqual([
      ["Solar", "above"], ["Powerwall", "above"], ["Grid", "above"],
    ]);
  });
});

describe("Powerwall power chart", () => {
  const night = [{ minute: 120, powerwall_to_home_kw: 1.2, powerwall_to_vehicle_kw: 0, powerwall_to_grid_kw: 0,
                   solar_to_powerwall_kw: 0, grid_to_powerwall_kw: 0 }];
  const noon = [{ minute: 720, powerwall_to_home_kw: 0, powerwall_to_vehicle_kw: 0, powerwall_to_grid_kw: 0,
                  solar_to_powerwall_kw: 3.4, grid_to_powerwall_kw: 0 }];

  test("discharge to the house plots above zero in the home color", () => {
    const { series, rows } = viewChart("powerwall", night);

    expect(series[0]).toMatchObject({ key: "powerwall_to_home", label: "Home", color: FLOW_COLORS.home, stack: "above" });
    expect(rows[0].powerwall_to_home).toBe(1.2);
  });

  test("charge from solar plots below zero in the solar color", () => {
    const { series, rows } = viewChart("powerwall", noon);

    expect(series.find((s) => s.key === "solar_to_powerwall")).toMatchObject({ color: FLOW_COLORS.solar, stack: "below" });
    expect(rows[0].solar_to_powerwall).toBe(-3.4);
  });

  test("charge and discharge stack separately, so idle charge flows stay at zero", () => {
    expect(viewChart("powerwall", night).series.map((s) => [s.label, s.stack])).toEqual([
      ["Home", "above"], ["Grid", "above"], ["Solar", "below"], ["Grid", "below"],
    ]);
  });

  test("the vehicle band appears only with vehicle data", () => {
    expect(viewChart("powerwall", night).series.some((s) => s.label === "Vehicle")).toBe(false);
    expect(viewChart("powerwall", night, { vehicleData: true }).series.map((s) => s.label)).toContain("Vehicle");
  });
});

describe("Powerwall axis", () => {
  const record = (minute: number, flows: Record<string, number>) => ({ minute, powerwall_to_home_kw: 0, powerwall_to_grid_kw: 0,
                                                                       solar_to_powerwall_kw: 0, grid_to_powerwall_kw: 0, ...flows });

  test("centered on zero and sized to the larger side, rounded up to a whole kW", () => {
    const chart = viewChart("powerwall", [record(60, { powerwall_to_home_kw: 4.0, powerwall_to_grid_kw: 1.4 }), record(720, { solar_to_powerwall_kw: 3.1 })]);

    expect(chart.domain).toEqual([-6, 6]);
    expect(chart.ticks).toEqual([-6, -3, 0, 3, 6]);
  });

  test("a near-idle day keeps at least 1 kW each way", () => {
    expect(viewChart("powerwall", [record(60, { powerwall_to_home_kw: 0.02 })]).domain).toEqual([-1, 1]);
  });

  test("ticks below zero read as magnitudes", () => {
    const { ticks, tickLabel } = viewChart("powerwall", [record(60, { powerwall_to_home_kw: 5.4 })]);

    expect(ticks!.map((t, i) => tickLabel(t, i, ticks!.length))).toEqual(["6", "3", "0", "3", "6 kW"]);
  });
});

test("a 01:00 to 03:30 outage is a break in the charge level", () => {
  const { rows } = chargeLevel([{ minute: 55, battery_percentage: 70 }, { minute: 60, battery_percentage: null }, { minute: 215, battery_percentage: 64 }]);

  expect(rows.map((r) => r.level)).toEqual([70, null, 64]);
});

describe("outlines", () => {
  const solarDay = [0, 0, 0.4, 2.0, 0.3, 0, 0].map((kw, i) => ({ minute: i * 5, solar_to_home_kw: kw, solar_to_powerwall_kw: i === 3 ? 1.5 : 0, solar_to_grid_kw: 0 }));

  test("each flow's line follows the top of its band in the stack", () => {
    const rows = outlines(viewChart("solar", solarDay));
    expect(rows[3]).toMatchObject({ solar_to_home_top: 2.0, solar_to_powerwall_top: 3.5 });
  });

  test("no line along zero where a flow is idle overnight, but its rise from zero is drawn", () => {
    const rows = outlines(viewChart("solar", solarDay));
    expect(rows.map((r) => r.solar_to_home_top)).toEqual([null, 0, 0.4, 2.0, 0.3, 0, null]);
    expect(rows.map((r) => r.solar_to_grid_top)).toEqual([null, null, null, null, null, null, null]);
  });

  test("metering noise of a few watts draws no outline over the band beneath", () => {
    const morning = [0.01, 0, 0.01, 0, 0].map((kw, i) => ({ minute: 540 + i * 5, solar_to_home_kw: 1.3, solar_to_powerwall_kw: 4, solar_to_grid_kw: kw }));
    expect(outlines(viewChart("solar", morning)).map((r) => r.solar_to_grid_top)).toEqual([null, null, null, null, null]);
  });

  test("a band below zero is outlined at its lower edge", () => {
    const rows = outlines(viewChart("grid", [{ minute: 720, solar_to_grid_kw: 0.4, powerwall_to_grid_kw: 1.1, grid_to_home_kw: 0 }]));
    expect(rows[0]).toMatchObject({ solar_to_grid_top: -0.4, powerwall_to_grid_top: -1.5 });
  });

  test("a gap stays a gap", () => {
    const withGap = [{ minute: 0, solar_to_home_kw: 1 }, { minute: 5, solar_to_home_kw: null }, { minute: 10, solar_to_home_kw: 1 }];
    expect(outlines(viewChart("solar", withGap)).map((r) => r.solar_to_home_top)).toEqual([1, null, 1]);
  });
});

describe("off-grid and storm watch spans", () => {
  const DAY = "2024-02-04";
  const day = (spans: Partial<Pick<Parameters<typeof daySpans>[0], "off_grid" | "storm_watch">>, data: Parameters<typeof daySpans>[0]["data"] = []) =>
    daySpans({ date: DAY, data, off_grid: [], storm_watch: [], ...spans });

  test("an outage running past midnight is cut to the day and says so", () => {
    expect(day({ off_grid: [{ start: "2024-02-04T22:51:38Z", end: "2024-02-07T03:07:50Z", kind: "outage" }] })).toEqual([
      { kind: "off_grid", from: 891 + 38 / 60, to: 1440, text: "Off grid (outage) 2:51 PM to midnight" },
    ]);
  });

  test("a span from the day before starts at midnight; a blip reads its one minute", () => {
    expect(day({
      off_grid: [{ start: "2024-02-03T22:00:00Z", end: "2024-02-04T09:30:00Z", kind: "outage" }, { start: "2024-02-04T17:14:10Z", end: "2024-02-04T17:14:28Z", kind: "blip" }],
    }).map(({ text, from, to }) => [text, Math.round(from * 60), Math.round(to * 60)])).toEqual([
      ["Off grid (outage) midnight to 1:30 AM", 0, 90 * 60],
      ["Off grid (blip) 9:14 AM to 9:14 AM", 554 * 60 + 10, 554 * 60 + 28],
    ]);
  });

  test("storm watch gives the Powerwalls' grid charging inside it, each interval by its part inside", () => {
    const data = [
      { minute: 1195, grid_to_powerwall_kw: 6 }, // 7:55 PM, half outside a span starting 7:57:30
      { minute: 1200, grid_to_powerwall_kw: 12 },
      { minute: 1435, grid_to_powerwall_kw: 12 },
    ];
    expect(day({ storm_watch: [{ start: "2024-02-05T03:57:30Z", end: null }] }, data)).toEqual([
      { kind: "storm", from: 1197.5, to: 1440, text: "Storm watch 7:57 PM to now, 2.3 kWh charged from the grid" },
    ]);
  });

  test("a day without spans has none", () => {
    expect(day({})).toEqual([]);
  });
});
