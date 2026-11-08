// Ported from anton-tesla-api-ws tesla-api-frontend/client/src/utils/replay.test.js.
import { describe, test, expect } from "vitest";
import { dataEnd, daySpan, formatAt, type IntervalRecord, type Moment, momentAt, parseAt, replayValues, siteInstant, siteToday, toSteps } from "@/lib/scene/replay";

const HOUR = 3_600_000;
const pdt = (time: string) => Date.parse(`2026-10-19T${time}-07:00`);

// One API record at `time` (HH:MM), with flows (kW by "from_to"), or none for a step without energy data.
const FLOW_KEYS = ["solar_to_home", "solar_to_vehicle", "solar_to_powerwall", "solar_to_grid", "powerwall_to_home",
  "powerwall_to_vehicle", "powerwall_to_grid", "grid_to_home", "grid_to_vehicle", "grid_to_powerwall"];
type Options = { flows?: Record<string, number>; battery?: number | null; vehicle?: string | null };
const record = (time: string, { flows, battery = null, vehicle = null }: Options = {}): IntervalRecord => ({
  start: `2026-10-19T${time}:00-07:00`,
  ...Object.fromEntries(FLOW_KEYS.map((key) => [`${key}_kw`, flows ? flows[key] ?? 0 : null])),
  battery_percentage: battery,
  vehicle,
});
const at = (records: IntervalRecord[], time: string) => momentAt(toSteps(records), pdt(time));

describe("site time", () => {
  test("a site wall time's instant", () => {
    expect(siteInstant("2026-10-19", 18, 35)).toBe(Date.parse("2026-10-20T01:35:00Z"));
  });

  test("DST days are 25 and 23 hours long", () => {
    const hours = (date: string) => (daySpan(date).end - daySpan(date).start) / HOUR;
    expect(hours("2026-11-01")).toBe(25);
    expect(hours("2026-03-08")).toBe(23);
    expect(hours("2026-10-19")).toBe(24);
  });

  test("today at the site, not the viewer", () => {
    expect(siteToday(Date.parse("2026-10-20T05:00:00Z"))).toBe("2026-10-19");
  });
});

describe("blending", () => {
  const solar = (kw: number) => ({ solar_to_home: kw });

  test("halfway between two steps' middles", () => {
    const records = [record("12:30", { flows: solar(2.0) }), record("12:35", { flows: solar(5.0) })];

    expect(at(records, "12:35").flows!.solar_to_home_kw).toBeCloseTo(3.5);
    expect(at(records, "12:32:30").flows!.solar_to_home_kw).toBeCloseTo(2.0);
  });

  test("never across a step without data", () => {
    const records = [record("12:30", { flows: solar(2.0) }), record("12:35"), record("12:40", { flows: solar(5.0) })];

    expect(at(records, "12:36").flows).toBeNull();
    expect(at(records, "12:33").flows!.solar_to_home_kw).toBe(2.0);
  });

  test("nor across a missing record", () => {
    const records = [record("12:30", { flows: solar(2.0) }), record("12:40", { flows: solar(5.0) })];

    expect(at(records, "12:34").flows!.solar_to_home_kw).toBe(2.0);
    expect(at(records, "12:37").flows).toBeNull();
  });

  test("battery blends between readings at step starts", () => {
    const records = [record("12:30", { battery: 50 }), record("12:35", { battery: 52 })];

    expect(at(records, "12:32:30").battery).toBeCloseTo(51);
    expect(at(records, "12:30").battery).toBe(50);
  });

  test("no charge where there is no reading", () => {
    expect(at([record("12:30", { flows: solar(1) })], "12:31").battery).toBeNull();
    expect(at([record("12:30", { battery: 50 }), record("12:35")], "12:37").battery).toBeNull();
  });

  test("the car is the step's own, unblended", () => {
    const records = [record("21:00", { vehicle: "R2D2" }), record("21:05")];

    expect(at(records, "21:04").vehicle).toBe("R2D2");
    expect(at(records, "21:06").vehicle).toBeNull();
  });

  test("outside the day's data, nothing", () => {
    expect(at([record("12:30", { flows: solar(1) })], "13:00")).toEqual({ flows: null, battery: null, vehicle: null });
  });
});

describe("scene values from the recorded flows", () => {
  const values = (flows: Record<string, number>, extra: Partial<Moment> = {}) => replayValues({ flows: { ...Object.fromEntries(FLOW_KEYS.map((k) => [`${k}_kw`, 0])), ...flows }, battery: null, vehicle: null, ...extra });

  test("totals and links as recorded", () => {
    const { values: v, links } = values({ solar_to_powerwall_kw: 5.7, solar_to_home_kw: 0.9, grid_to_home_kw: 0.5 });

    expect(v.solarPower).toBeCloseTo(6.6);
    expect(v.homePower).toBeCloseTo(1.4);
    expect(v.batteryPower).toBeCloseTo(-5.7);
    expect(v.gridPower).toBeCloseTo(0.5);
    expect(links.map(({ from, to }) => `${from}-${to}`)).toEqual(["solar-powerwall", "solar-home", "grid-home"]);
  });

  test("flows under 0.1 kW are not linked", () => {
    expect(values({ solar_to_home_kw: 0.09 }).links).toEqual([]);
  });

  test("vehicle flows charge the car", () => {
    const { values: v, links } = values({ powerwall_to_vehicle_kw: 5.0, grid_to_vehicle_kw: 2.2 }, { vehicle: "R2D2" });

    expect(v.vehicle).toEqual({ name: "R2D2", charging_power: expect.closeTo(7.2) });
    expect(links.map(({ from, to }) => `${from}-${to}`)).toEqual(["powerwall-car", "grid-car"]);
  });

  test("charging with no car named shows as Vehicle", () => {
    const { values: v, links } = values({ powerwall_to_vehicle_kw: 7.7 });

    expect(v.vehicle).toEqual({ name: "Vehicle", charging_power: expect.closeTo(7.7) });
    expect(links.map(({ from, to }) => `${from}-${to}`)).toEqual(["powerwall-car"]);
  });

  test("no car named and charging under 0.1 kW shows no car", () => {
    expect(values({ grid_to_vehicle_kw: 0.09 }).values.vehicle).toBeNull();
  });

  test("a step without data shows nothing live", () => {
    const { values: v, links } = replayValues({ flows: null, battery: 50.4, vehicle: null });

    expect(v.liveReceived).toBe(false);
    expect(v.battery).toBe(50);
    expect(links).toEqual([]);
  });
});

describe("where the data ends", () => {
  const end = (records: IntervalRecord[]) => dataEnd(toSteps(records));
  const flows = { solar_to_home: 1 };

  test("at the end of the last step with flows, not a trailing battery reading Tesla hasn't filled in", () => {
    expect(end([record("13:25", { flows }), record("13:30", { flows }), record("13:35", { battery: 65 })])).toBe(pdt("13:35"));
  });

  test("at the end of the last step when every step has flows", () => {
    expect(end([record("23:50", { flows }), record("23:55", { flows })])).toBe(pdt("23:55") + 5 * 60_000);
  });

  test("at the end of the last step when none has flows", () => {
    expect(end([record("00:00", { battery: 40 }), record("00:05", { battery: 40 })])).toBe(pdt("00:10"));
  });

  test("nowhere without steps", () => {
    expect(end([])).toBeNull();
  });
});

describe("replay link", () => {
  const NOW = Date.parse("2026-10-20T18:00:00Z");

  test("a site wall time to the minute", () => {
    expect(parseAt("2026-10-19T18:35", NOW)).toBe(Date.parse("2026-10-20T01:35:00Z"));
    expect(formatAt(Date.parse("2026-10-20T02:02:40Z"))).toBe("2026-10-19T19:02");
  });

  test.each(["2021-10-09T12:00", "2031-01-01T12:00", "2026-02-30T12:00", "2026-10-19T24:00", "2026-10-19", "yesterday", "", undefined])(
    "%s is not a moment to replay",
    (value) => expect(parseAt(value, NOW)).toBeNull()
  );
});
