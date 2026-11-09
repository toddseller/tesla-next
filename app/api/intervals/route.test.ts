// Ported from anton-tesla-api-ws tests/test_intervals_api.py, test_intervals_estimates.py and
// test_intervals_vehicle.py, with the same values, against the tests' throwaway PostgreSQL.
import { Client } from "pg";
import { afterAll, beforeAll, beforeEach, expect, inject, test, vi } from "vitest";
import { pyRound } from "@/lib/intervals/python";

const pg = inject("pg");
let owner: Client;
let GET: typeof import("./route").GET;

const ENERGY_COLUMNS = [
  "solar_generated_wh", "grid_imported_wh", "grid_exported_from_solar_wh", "grid_exported_from_battery_wh",
  "battery_exported_wh", "battery_imported_from_grid_wh", "battery_imported_from_solar_wh", "house_from_grid_wh",
  "house_from_solar_wh", "house_from_battery_wh",
];
const FLOWS = ["solar_to_home", "solar_to_powerwall", "solar_to_grid", "powerwall_to_home", "powerwall_to_grid", "grid_to_home", "grid_to_powerwall"];
const ALL_FLOWS = [...FLOWS, "solar_to_vehicle", "powerwall_to_vehicle", "grid_to_vehicle"];

const VIN = "5YJYGDEE0TEST0001";
const TIE = "5YJ3GDEE0TEST0002"; // a Model 3, by its 4th character

// A PDT (UTC-7) time in October 2026, as UTC milliseconds.
const at = (day: number, hour: number, minute: number) => Date.UTC(2026, 9, day, hour + 7, minute);
const isoDay = (day: number) => `2026-10-${String(day).padStart(2, "0")}`;
const kw = (wh: number) => pyRound((wh * 12) / 1000, 2);

async function energy(day: number, hour: number, minute: number, wh: Record<string, number> = {}) {
  const values = ENERGY_COLUMNS.map((column) => wh[column] ?? 0);
  await owner.query(
    `INSERT INTO energy_interval (start_at, day, ${ENERGY_COLUMNS.join(", ")}) VALUES ($1, $2, ${ENERGY_COLUMNS.map((_, i) => `$${i + 3}`).join(", ")})`,
    [new Date(at(day, hour, minute)), isoDay(day), ...values],
  );
}

const battery = (instant: number, percentage: number) =>
  owner.query("INSERT INTO battery_sample VALUES ($1, $2)", [new Date(instant), percentage]);

const vehicle = (instant: number, wh: number, vin: string | null = VIN) =>
  owner.query("INSERT INTO vehicle_interval VALUES ($1, $2, $3)", [new Date(instant), wh, vin]);

const session = (instant: number, seconds: number, wh: number) =>
  owner.query("INSERT INTO charge_session VALUES ($1, $2, $3)", [new Date(instant), seconds, wh]);

async function weather(instant: number, code: number, cover: number, columns: Record<string, number | null> = {}) {
  const names = Object.keys(columns);
  await owner.query(
    `INSERT INTO weather_sample (sampled_at, weather_code, cloud_cover${names.map((n) => `, ${n}`).join("")}) VALUES ($1, $2, $3${names.map((_, i) => `, $${i + 4}`).join("")})`,
    [new Date(instant), code, cover, ...Object.values(columns)],
  );
}

const namedCars = () =>
  owner.query("INSERT INTO vehicle VALUES ($1, 'R2D2', true), ($2, 'Tesla T.I.E. Fighter', true)", [VIN, TIE]);

async function get(query: string) {
  const response = await GET(new Request(`http://localhost/api/intervals${query}`));
  return { status: response.status, body: await response.json() };
}

const getDay = async (day = 16) => (await get(`?date=${isoDay(day)}`)).body;

type Row = Record<string, number | string | boolean | null>;
const byTime = (body: { data: Row[] }) => Object.fromEntries(body.data.map((r) => [(r.start as string).slice(11, 16), r]));

beforeAll(async () => {
  vi.stubEnv("DATABASE_URL", `postgresql://${pg.user}:${pg.password}@/${pg.database}?host=${pg.host}`);
  vi.resetModules();
  ({ GET } = await import("./route"));
  owner = new Client({ ...pg });
  await owner.connect();
});

// This file's days and tables only: the sunshine tests share energy_interval on other days.
beforeEach(async () => {
  await owner.query("DELETE FROM energy_interval WHERE day BETWEEN '2026-09-28' AND '2026-10-18' OR day = '2026-01-10'");
  await owner.query("DELETE FROM battery_sample; DELETE FROM vehicle_interval; DELETE FROM charge_session; DELETE FROM weather_sample");
  await owner.query("DELETE FROM vehicle WHERE vin LIKE '%TEST000%'");
  await owner.query("DELETE FROM grid_outage WHERE start_at BETWEEN '2026-09-28' AND '2026-10-19'; DELETE FROM site_state WHERE start_at BETWEEN '2026-09-28' AND '2026-10-19'");
});

afterAll(async () => {
  await owner.end();
  vi.unstubAllEnvs();
});

// test_intervals_api.py

test("records in ascending order with minutes and battery", async () => {
  await energy(16, 12, 5, { house_from_solar_wh: 100 });
  await energy(16, 12, 0, { house_from_solar_wh: 90 });
  await battery(at(16, 12, 0), 74);
  const body = await getDay();
  expect(body.date).toBe("2026-10-16");
  expect(body.data.map((r: Row) => [r.minute, r.solar_to_home_kw, r.battery_percentage])).toEqual([[720, 1.08, 74], [725, 1.2, null]]);
  expect(body.data[0].start).toBe("2026-10-16T12:00:00-07:00");
});

test("each flow maps to its column", async () => {
  await energy(16, 12, 0, {
    house_from_solar_wh: 10, battery_imported_from_solar_wh: 20, grid_exported_from_solar_wh: 250,
    house_from_battery_wh: 40, grid_exported_from_battery_wh: 50, house_from_grid_wh: 60, battery_imported_from_grid_wh: 70,
  });
  const record = (await getDay()).data[0];
  expect(Object.fromEntries(FLOWS.map((f) => [`${f}_kw`, record[`${f}_kw`]]))).toEqual({
    solar_to_home_kw: 0.12, solar_to_powerwall_kw: 0.24, solar_to_grid_kw: 3.0, powerwall_to_home_kw: 0.48,
    powerwall_to_grid_kw: 0.6, grid_to_home_kw: 0.72, grid_to_powerwall_kw: 0.84,
  });
});

test("daily totals use exact watt-hours", async () => {
  for (const minute of [0, 5, 10]) await energy(16, 9, minute, { house_from_solar_wh: 4090 });
  const { totals } = await getDay();
  expect(totals.solar_to_home).toBe(12.27);
  expect(Object.keys(totals).sort()).toEqual([...ALL_FLOWS].sort());
});

test("a battery sample without energy has null flows", async () => {
  await energy(16, 10, 0, { house_from_solar_wh: 300 });
  await battery(at(16, 10, 0), 80);
  await battery(at(16, 10, 5), 81);
  const last = (await getDay()).data.at(-1);
  expect(last.minute).toBe(605);
  expect(last.battery_percentage).toBe(81);
  expect(ALL_FLOWS.map((f) => last[`${f}_kw`])).toEqual(ALL_FLOWS.map(() => null));
});

test("samples from other days are excluded", async () => {
  await battery(at(16, 0, 0), 60);
  await battery(at(15, 23, 55), 59);
  await battery(at(17, 0, 0), 61);
  expect((await getDay()).data.map((r: Row) => r.battery_percentage)).toEqual([60]);
});

test("an empty day is 200 with an empty list and zero totals", async () => {
  const { status, body } = await get("?date=2026-01-10");
  expect(status).toBe(200);
  expect(body.data).toEqual([]);
  expect(body.totals).toEqual(Object.fromEntries(ALL_FLOWS.map((f) => [f, 0])));
  expect(body.vehicle_data).toBe(false);
});

test("an invalid or missing date is 400", async () => {
  expect(await get("?date=2026-13-40")).toEqual({ status: 400, body: { message: "date is required as YYYY-MM-DD" } });
  expect(await get("")).toEqual({ status: 400, body: { message: "date is required as YYYY-MM-DD" } });
});

test.each(["9999-12-31", "0001-01-01", "2021-09-30", "after the window"])("a date outside the window is 400: %s", async (day) => {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles" }).format(new Date());
  const last = new Date(Date.parse(today) + 732 * 86_400_000).toISOString().slice(0, 10);
  if (day === "after the window") day = new Date(Date.parse(last) + 86_400_000).toISOString().slice(0, 10);
  expect(await get(`?date=${day}`)).toEqual({ status: 400, body: { message: `date must be from 2021-10-01 to ${last}` } });
});

test("the first day of the window is served", async () => {
  expect((await get("?date=2021-10-01")).status).toBe(200);
});

test("replay readings carry the winds at the clouds' heights", async () => {
  await weather(at(16, 7, 0), 3, 100, {
    cloud_cover_low: 100, cloud_cover_mid: 0, cloud_cover_high: 0, wind_speed: 5, wind_direction: 80,
    wind_low_speed: 7, wind_low_direction: 71, wind_mid_speed: 12, wind_mid_direction: 11, wind_high_speed: 54, wind_high_direction: 350,
  });
  const reading = (await getDay()).weather[0];
  expect([reading.windLow, reading.windMid, reading.windHigh]).toEqual([-6.6, -2.3, 9.4]);
});

test("weather from an hour before the day to an hour after", async () => {
  await weather(at(15, 22, 30), 0, 0); // 90 minutes before: left out
  await weather(at(17, 0, 45), 2, 30);
  await weather(at(16, 12, 0), 82, 40, { wind_speed: 20, wind_direction: 90 }); // violent showers in an east wind
  await weather(at(15, 23, 15), 3, 85);
  await weather(at(17, 1, 30), 0, 0); // 90 minutes after: left out
  const none = { windLow: null, windMid: null, windHigh: null, cirrus: null, low: null, mid: null, sun: null };
  expect((await getDay()).weather).toEqual([
    { start: "2026-10-15T23:15:00-07:00", cover: 0.85, rain: 0, wind: null, ...none },
    { start: "2026-10-16T12:00:00-07:00", cover: 1, rain: 1, wind: -20, ...none },
    { start: "2026-10-17T00:45:00-07:00", cover: 0.3, rain: 0, wind: null, ...none },
  ]);
});

test("replayed cover weighs the cloud layers", async () => {
  await weather(at(16, 11, 45), 2, 55, { cloud_cover_low: 0, cloud_cover_mid: 0, cloud_cover_high: 55 }); // thin cirrus
  await weather(at(16, 12, 0), 3, 70); // stored before the split
  const readings = (await getDay()).weather;
  expect(readings[0].cover).toBeCloseTo(0.1375, 12);
  expect(readings[1].cover).toBe(0.7);
  expect(readings.map((r: Row) => r.cirrus)).toEqual([0.55, null]);
});

test("replay readings carry each layer's share", async () => {
  await weather(at(16, 11, 45), 2, 95, { cloud_cover_low: 90, cloud_cover_mid: 0, cloud_cover_high: 30 }); // marine layer under cirrus
  await weather(at(16, 12, 0), 3, 70);
  expect((await getDay()).weather.map((r: Row) => [r.low, r.mid, r.cirrus])).toEqual([[0.9, 0, 0.3], [null, null, null]]);
});

test("replay readings carry the roof's sunshine", async () => {
  // The best noon of the 14 days before: 6.24 kW. On the day, 6.0 kW at noon and only part of 12:15 stored.
  for (const minute of [0, 5, 10]) await energy(15, 12, minute, { solar_generated_wh: 520 });
  for (const minute of [0, 5, 10, 15, 20]) await energy(16, 12, minute, { solar_generated_wh: 500 });
  for (const minute of [0, 15]) await weather(at(16, 12, minute), 2, 62, { cloud_cover_low: 62, cloud_cover_mid: 0, cloud_cover_high: 0 });
  const readings = (await getDay()).weather;
  expect(readings[0].sun).toBeCloseTo(6.0 / 6.24, 12);
  expect(readings[1].sun).toBeNull();
});

test("replay readings take the low cloud from the airport", async () => {
  // The service's marine layer at 10:45, which the airport reported clear; then fog it saw.
  await weather(at(16, 10, 45), 3, 100, { cloud_cover_low: 100, cloud_cover_mid: 0, cloud_cover_high: 0, airport_low: 0, airport_mid: 0 });
  await weather(at(16, 11, 0), 45, 40, { cloud_cover_low: 40, cloud_cover_mid: 0, cloud_cover_high: 0, airport_low: 100, airport_mid: 0 });
  expect((await getDay()).weather.map((r: Row) => [r.low, r.cover])).toEqual([[0, 0], [1, 1]]);
});

test("a day without weather has an empty list", async () => {
  await energy(16, 12, 0, { house_from_solar_wh: 100 });
  const body = await getDay();
  expect(body.weather).toEqual([]);
  expect(Object.keys(body).sort()).toEqual(["data", "date", "off_grid", "storm_watch", "totals", "vehicle_data", "vehicle_includes_estimates", "vehicle_includes_session_estimates", "weather"]);
});

// test_intervals_estimates.py

test("a gap across midnight is estimated on both days", async () => {
  await battery(at(16, 23, 45), 50);
  await battery(at(17, 0, 15), 46);
  const before = byTime(await getDay(16));
  const after = byTime(await getDay(17));
  expect([before["23:50"].battery_percentage, before["23:50"].battery_estimated]).toEqual([49, true]);
  // 50% at 23:45 to 46% at 00:15: 49.33, 48.67, 48.0, 47.33, 46.67
  expect(before["23:55"].battery_percentage).toBe(49);
  expect([after["00:00"].battery_percentage, after["00:00"].battery_estimated]).toEqual([48, true]);
  expect(after["00:05"].battery_percentage).toBe(47);
  expect(after["00:15"].battery_estimated).toBe(false);
});

test("an open gap at the end of today is not filled", async () => {
  await battery(at(17, 14, 0), 80);
  expect(Object.keys(byTime(await getDay(17)))).toEqual(["14:00"]);
});

test("boundaries outside the day are not returned", async () => {
  await battery(at(16, 23, 50), 50);
  await battery(at(17, 0, 10), 46);
  expect(new Set((await getDay(17)).data.map((r: Row) => (r.start as string).slice(0, 10)))).toEqual(new Set(["2026-10-17"]));
});

test("the spec's battery gap", async () => {
  await battery(at(17, 1, 55), 60);
  await battery(at(17, 2, 20), 56);
  const records = byTime(await getDay(17));
  expect(["02:00", "02:05", "02:10", "02:15"].map((t) => [records[t].battery_percentage, records[t].battery_estimated])).toEqual([
    [59, true], [58, true], [58, true], [57, true],
  ]);
  expect(records["01:55"].battery_estimated).toBe(false);
});

test("an outage over two hours stays null", async () => {
  await battery(at(17, 1, 0), 60);
  await battery(at(17, 3, 30), 50);
  expect(Object.keys(byTime(await getDay(17)))).toEqual(["01:00", "03:30"]);
});

test("estimated charging is attributed and counted", async () => {
  // 600 Wh at 03:00, nothing until 03:20 (0 Wh): 03:05 is estimated at 450 Wh.
  await energy(17, 3, 5, { house_from_battery_wh: 1000 });
  await vehicle(at(17, 3, 0), 600);
  await vehicle(at(17, 3, 20), 0);
  const body = await getDay(17);
  const record = byTime(body)["03:05"];
  expect(record.powerwall_to_vehicle_kw).toBe(kw(450));
  expect(record.powerwall_to_home_kw).toBe(kw(550));
  expect(record.vehicle_estimated).toBe(true);
  expect(body.totals.powerwall_to_vehicle).toBeCloseTo(0.45, 12);
  expect(body.vehicle_includes_estimates).toBe(true);
  expect(body.vehicle_data).toBe(true);
});

test("measured intervals are not marked estimated", async () => {
  await energy(17, 3, 0, { house_from_battery_wh: 1000 });
  await vehicle(at(17, 3, 0), 600);
  const body = await getDay(17);
  expect(byTime(body)["03:00"].vehicle_estimated).toBe(false);
  expect(body.vehicle_includes_estimates).toBe(false);
});

test("0 Wh estimates don't count as estimated charging", async () => {
  await energy(17, 3, 5, { house_from_battery_wh: 1000 });
  await vehicle(at(17, 3, 0), 0);
  await vehicle(at(17, 3, 10), 0);
  const body = await getDay(17);
  expect(byTime(body)["03:05"].vehicle_estimated).toBe(true);
  expect(body.vehicle_includes_estimates).toBe(false);
});

test("a long outage attributes no charging", async () => {
  await energy(17, 2, 0, { house_from_battery_wh: 1000 });
  await vehicle(at(17, 1, 0), 600);
  await vehicle(at(17, 3, 30), 600);
  const record = byTime(await getDay(17))["02:00"];
  expect(record.powerwall_to_vehicle_kw).toBe(0);
  expect(record.powerwall_to_home_kw).toBe(kw(1000));
  expect(record.vehicle_estimated).toBe(false);
});

// test_intervals_vehicle.py (on 2026-10-14)

test("charging moves energy from home to the vehicle", async () => {
  await energy(14, 15, 0, { house_from_solar_wh: 300 });
  await vehicle(at(14, 15, 0), 100);
  const record = byTime(await getDay(14))["15:00"];
  expect(record.solar_to_home_kw).toBe(kw(200));
  expect(record.solar_to_vehicle_kw).toBe(kw(100));
  expect([record.powerwall_to_vehicle_kw, record.grid_to_vehicle_kw]).toEqual([0, 0]);
});

test("an overnight charge from the Powerwall", async () => {
  await energy(14, 1, 0, { house_from_battery_wh: 1000 });
  await vehicle(at(14, 1, 0), 800);
  const record = byTime(await getDay(14))["01:00"];
  expect(record.powerwall_to_vehicle_kw).toBe(kw(800));
  expect(record.powerwall_to_home_kw).toBe(kw(200));
});

test("mixed sources split proportionally", async () => {
  await energy(14, 17, 0, { house_from_solar_wh: 300, house_from_grid_wh: 100 });
  await vehicle(at(14, 17, 0), 200);
  const record = byTime(await getDay(14))["17:00"];
  expect([record.solar_to_vehicle_kw, record.grid_to_vehicle_kw, record.solar_to_home_kw, record.grid_to_home_kw]).toEqual([kw(150), kw(50), kw(150), kw(50)]);
});

test("charging above home consumption is capped", async () => {
  await energy(14, 15, 5, { house_from_solar_wh: 850 });
  await vehicle(at(14, 15, 5), 900);
  const record = byTime(await getDay(14))["15:05"];
  expect(record.solar_to_vehicle_kw).toBe(kw(850));
  expect(record.solar_to_home_kw).toBe(0);
});

test("unmeasured intervals keep Tesla's home flows", async () => {
  await energy(14, 15, 0, { house_from_solar_wh: 300 });
  await energy(14, 15, 5, { house_from_solar_wh: 300 });
  await vehicle(at(14, 15, 0), 100);
  const records = byTime(await getDay(14));
  expect(records["15:05"].solar_to_home_kw).toBe(kw(300));
  expect(records["15:05"].solar_to_vehicle_kw).toBe(0);
});

test("totals and the vehicle data flag", async () => {
  await energy(14, 1, 0, { house_from_battery_wh: 2400 });
  await energy(14, 1, 5, { house_from_battery_wh: 2400 });
  await vehicle(at(14, 1, 0), 2400);
  await vehicle(at(14, 1, 5), 2400);
  const body = await getDay(14);
  expect(body.vehicle_data).toBe(true);
  expect(body.totals.powerwall_to_vehicle).toBeCloseTo(4.8, 12);
  expect(body.totals.powerwall_to_home).toBeCloseTo(0, 12);
});

test("a day without vehicle rows", async () => {
  await energy(14, 15, 0, { house_from_solar_wh: 300 });
  const body = await getDay(14);
  expect(body.vehicle_data).toBe(false);
  expect(body.totals.solar_to_vehicle).toBe(0);
  expect(body.totals.solar_to_home).toBeCloseTo(0.3, 12);
});

test("charging measured before Tesla publishes", async () => {
  await energy(14, 15, 0, { house_from_solar_wh: 300 });
  await vehicle(at(14, 15, 0), 100);
  await vehicle(at(14, 15, 5), 120);
  const record = byTime(await getDay(14))["15:05"];
  expect([record.solar_to_vehicle_kw, record.solar_to_home_kw]).toEqual([null, null]);
});

test("records name the plugged-in car", async () => {
  await namedCars();
  // Plugged in from 21:00, charging from 21:05; nothing plugged in before.
  for (const [h, m] of [[20, 55], [21, 0], [21, 5]]) await energy(14, h, m, { house_from_grid_wh: 900 });
  await vehicle(at(14, 20, 55), 0, null);
  await vehicle(at(14, 21, 0), 0);
  await vehicle(at(14, 21, 5), 600);
  const records = byTime(await getDay(14));
  expect([records["20:55"].vehicle, records["21:00"].vehicle, records["21:05"].vehicle]).toEqual([null, "R2D2", "R2D2"]);
});

test("an unknown car is Vehicle", async () => {
  await namedCars();
  await energy(14, 21, 0, { house_from_grid_wh: 900 });
  await vehicle(at(14, 21, 0), 600, "5YJYGDEE0UNKNOWN0");
  expect(byTime(await getDay(14))["21:00"].vehicle).toBe("Vehicle");
});

test("a renamed car takes its new name", async () => {
  await namedCars();
  await energy(14, 21, 0, { house_from_grid_wh: 900 });
  await vehicle(at(14, 21, 0), 600);
  await owner.query("UPDATE vehicle SET display_name = 'Artoo' WHERE vin = $1", [VIN]);
  expect(byTime(await getDay(14))["21:00"].vehicle).toBe("Artoo");
});

test("an estimated gap names the car on both sides", async () => {
  await namedCars();
  await vehicle(at(14, 21, 0), 600);
  await vehicle(at(14, 21, 15), 600);
  const records = byTime(await getDay(14));
  expect([records["21:05"].vehicle_estimated, records["21:05"].vehicle, records["21:10"].vehicle]).toEqual([true, "R2D2", "R2D2"]);
});

test("a gap between two cars names none", async () => {
  await namedCars();
  await vehicle(at(14, 21, 0), 600);
  await vehicle(at(14, 21, 15), 600, TIE);
  const records = byTime(await getDay(14));
  expect([records["21:05"].vehicle_estimated, records["21:05"].vehicle]).toEqual([true, null]);
  expect(records["21:15"].vehicle).toBe("Tesla T.I.E. Fighter");
});

test("the response never includes a VIN or color", async () => {
  await namedCars();
  await energy(14, 15, 0, { house_from_solar_wh: 300 });
  await vehicle(at(14, 15, 0), 100);
  const body = JSON.stringify(await getDay(14));
  expect(body).not.toContain(VIN);
  expect(body).not.toContain("vin");
  expect(body).not.toContain("color");
});

// A full day of home load at `base` kW on 2026-10-`day`, with kW overrides by "HH:MM".
async function load(day = 14, base = 1.0, overrides: Record<string, number> = {}) {
  const values: unknown[] = [];
  const rows: string[] = [];
  for (let n = 0; n < 288; n++) {
    const hour = Math.floor((n * 5) / 60);
    const minute = (n * 5) % 60;
    const key = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    const wh = Math.round(((overrides[key] ?? base) * 1000) / 12);
    values.push(new Date(at(day, hour, minute)), isoDay(day), wh);
    rows.push(`($${values.length - 2}, $${values.length - 1}, $${values.length}${", 0".repeat(ENERGY_COLUMNS.length - 1)})`);
  }
  const others = ENERGY_COLUMNS.filter((c) => c !== "house_from_solar_wh");
  await owner.query(`INSERT INTO energy_interval (start_at, day, house_from_solar_wh, ${others.join(", ")}) VALUES ${rows.join(", ")}`, values);
}

const range = (hours: number[], kwValue: number) =>
  Object.fromEntries(hours.flatMap((h) => Array.from({ length: 12 }, (_, i) => [`${String(h).padStart(2, "0")}:${String(i * 5).padStart(2, "0")}`, kwValue])));

const vehicleKw = (record: Row) =>
  pyRound((record.solar_to_vehicle_kw as number) + (record.powerwall_to_vehicle_kw as number) + (record.grid_to_vehicle_kw as number), 2);

test("a day covered only by sessions", async () => {
  await load(14, 1.0, { "10:00": 9.0, "10:05": 9.0 });
  await session(at(14, 9, 58), 420, 1000);
  const body = await getDay(14);
  const records = byTime(body);
  expect(["09:55", "10:00", "10:05", "10:10"].map((t) => vehicleKw(records[t]))).toEqual([0, kw(667), kw(333), 0]);
  for (const t of ["09:55", "10:00", "10:05"]) expect([records[t].vehicle_estimated, records[t].vehicle]).toEqual([true, null]);
  // Coverage runs 24 hours past the session's start, so the rest of the day is estimated.
  expect(records["23:55"].vehicle_estimated).toBe(true);
  expect([body.vehicle_data, body.vehicle_includes_session_estimates, body.vehicle_includes_estimates]).toEqual([true, true, false]);
});

test("a scheduled charge from the evening before", async () => {
  await load(13);
  await load(14, 1.0, range([0, 1, 2, 3, 4, 5, 6], 8.7));
  await session(at(13, 19, 22), 21855, 46300);
  const before = await getDay(13);
  const day = await getDay(14);
  expect(before.vehicle_includes_session_estimates).toBe(false);
  expect(before.data.every((r: Row) => vehicleKw(r) === 0)).toBe(true);
  expect(day.vehicle_includes_session_estimates).toBe(true);
  expect(Math.abs(day.totals.solar_to_vehicle - 46.3)).toBeLessThanOrEqual(0.01);
  expect(vehicleKw(byTime(day)["00:00"])).toBe(kw(7700 / 12));
});

test("a day inside the coverage without sessions is zero", async () => {
  await load(14);
  await session(at(13, 20, 0), 600, 1000);
  await session(at(15, 8, 0), 600, 1000);
  const body = await getDay(14);
  expect(body.vehicle_data).toBe(true);
  expect(body.vehicle_includes_session_estimates).toBe(false);
  expect(body.data).toHaveLength(288);
  expect(body.data.every((r: Row) => r.vehicle_estimated && vehicleKw(r) === 0)).toBe(true);
});

test("measured charging wins over sessions", async () => {
  await load(14, 1.0, { "14:50": 8.0, "14:55": 8.0, "15:00": 8.0 });
  await vehicle(at(14, 14, 50), 396);
  await session(at(14, 14, 50), 900, 900);
  const records = byTime(await getDay(14));
  expect([vehicleKw(records["14:50"]), records["14:50"].vehicle_estimated]).toEqual([kw(396), false]);
  expect([vehicleKw(records["14:55"]), records["14:55"].vehicle_estimated]).toEqual([kw(504), true]);
  expect(vehicleKw(records["15:00"])).toBe(0);
});

test("the short gap fill wins over sessions", async () => {
  await load(14, 1.0, { "03:05": 9.0 });
  await vehicle(at(14, 3, 0), 600);
  await vehicle(at(14, 3, 20), 0);
  await session(at(14, 3, 0), 1500, 5000);
  const body = await getDay(14);
  expect(vehicleKw(byTime(body)["03:05"])).toBe(kw(450));
  expect(body.vehicle_includes_estimates).toBe(true);
});

test("a day outside the coverage is unchanged", async () => {
  await load(14);
  await session(at(20, 9, 0), 600, 500);
  const body = await getDay(14);
  expect([body.vehicle_data, body.vehicle_includes_session_estimates]).toEqual([false, false]);
  expect(body.data.some((r: Row) => r.vehicle_estimated)).toBe(false);
});

test("the coverage starts at the first session", async () => {
  await load(14);
  await session(at(14, 12, 33) + 1000, 300, 100);
  const records = byTime(await getDay(14));
  expect([records["12:25"].vehicle_estimated, records["12:30"].vehicle_estimated]).toEqual([false, true]);
});

test("a fast session names the Model Y", async () => {
  await namedCars();
  await load(14, 1.0, { "06:10": 10.4, "06:15": 10.4 });
  await session(at(14, 6, 5), 300, 800); // 9.6 kW
  const body = await getDay(14);
  const records = byTime(body);
  expect([records["06:10"].vehicle, records["06:15"].vehicle, records["06:05"].vehicle]).toEqual(["R2D2", "R2D2", null]);
  expect(JSON.stringify(body)).not.toContain(VIN);
  expect(JSON.stringify(body)).not.toContain(TIE);
});

test("a Model 3 session names the Model 3", async () => {
  await namedCars();
  await load(14, 1.0, { "00:05": 8.7 });
  await session(at(14, 0, 0), 300, 635); // 7.6 kW
  expect(byTime(await getDay(14))["00:05"].vehicle).toBe("Tesla T.I.E. Fighter");
});

test("a slow session names no car", async () => {
  await namedCars();
  await load(14, 1.0, { "14:20": 6.5 });
  await session(at(14, 14, 20), 600, 917); // 5.5 kW
  const record = byTime(await getDay(14))["14:20"];
  expect(vehicleKw(record)).toBeGreaterThan(0);
  expect(record.vehicle).toBeNull();
});

test("a measured car names the rest of its session", async () => {
  await namedCars();
  await load(14, 1.0, range([23], 8.7));
  await vehicle(at(14, 23, 0), 640); // R2D2, then the server goes down
  await vehicle(at(14, 23, 5), 640);
  await session(at(14, 23, 0), 3600, 7600); // 7.6 kW: the power rule alone would say the Model 3
  const records = byTime(await getDay(14));
  expect([records["23:30"].vehicle_estimated, records["23:30"].vehicle]).toEqual([true, "R2D2"]);
});

// backup-history: the day's off-grid and storm watch spans.

test("an outage across midnight is listed whole on both its days, with its kind", async () => {
  await owner.query("INSERT INTO grid_outage VALUES ($1, $2)", [new Date(at(15, 22, 0)), new Date(at(16, 2, 30))]);
  const span = { start: new Date(at(15, 22, 0)).toISOString(), end: new Date(at(16, 2, 30)).toISOString(), kind: "outage" };
  expect((await getDay(15)).off_grid).toEqual([span]);
  expect((await getDay(16)).off_grid).toEqual([span]);
  expect((await getDay(17)).off_grid).toEqual([]);
});

test("a storm watch stretch still open is listed with no end; stretches without storm watch aren't", async () => {
  await owner.query("INSERT INTO site_state VALUES ($1, $2, 'on_grid', false), ($2, NULL, 'on_grid', true)", [new Date(at(16, 9, 0)), new Date(at(16, 14, 2))]);
  expect((await getDay(16)).storm_watch).toEqual([{ start: new Date(at(16, 14, 2)).toISOString(), end: null }]);
});

test("a day without either has empty lists", async () => {
  const body = await getDay(16);
  expect([body.off_grid, body.storm_watch]).toEqual([[], []]);
});
