import { db } from "@/lib/db";
import { dayCharging, intervalWh } from "@/lib/intervals/intervals";
import { pyRound, SITE_ZONE } from "@/lib/intervals/python";
import { carName, loadCars } from "@/lib/intervals/vehicles";
import { shiftDay } from "@/lib/scene/replay";

// Home charging over a range (car-charging spec): the Wall Connector's charging split by where the home's power came
// from, for the household and for each car the Wall Connector measured.

type Sources = { solar: number; powerwall: number; grid: number };
type Day = { home: Sources; cars: Map<string, Sources> };

const none = (): Sources => ({ solar: 0, powerwall: 0, grid: 0 });
const add = (to: Sources, wh: Sources) => {
  to.solar += wh.solar;
  to.powerwall += wh.powerwall;
  to.grid += wh.grid;
};

declare global {
  var chargingDays: Map<string, Day> | undefined;
}
// A finished day's charging doesn't change, so each is worked out once per server process; a deploy starts afresh,
// which also takes in corrections anton makes to past days.
const finishedDays = (globalThis.chargingDays ??= new Map());

async function chargingOn(day: string): Promise<Day> {
  const { charging, measuredVins, intervals } = await dayCharging(day);
  const result: Day = { home: none(), cars: new Map() };
  for (const interval of intervals) {
    const instant = interval.start_at.getTime();
    const vehicleWh = charging.get(instant);
    if (!vehicleWh) continue;
    const wh = intervalWh(interval, vehicleWh);
    const part = { solar: wh.solar_to_vehicle, powerwall: wh.powerwall_to_vehicle, grid: wh.grid_to_vehicle };
    add(result.home, part);
    const vin = measuredVins.get(instant);
    if (!vin) continue;
    if (!result.cars.has(vin)) result.cars.set(vin, none());
    add(result.cars.get(vin)!, part);
  }
  return result;
}

async function dayOf(day: string, today: string) {
  // A session plugged in yesterday can charge today, so yesterday isn't finished until today is.
  if (day >= shiftDay(today, -1)) return chargingOn(day);
  if (!finishedDays.has(day)) finishedDays.set(day, await chargingOn(day));
  return finishedDays.get(day)!;
}

const shares = ({ solar, powerwall, grid }: Sources) => {
  const total = solar + powerwall + grid;
  const percentage = (part: number) => (total ? pyRound((100 * part) / total) : 0);
  return { solar_percentage: percentage(solar), powerwall_percentage: percentage(powerwall), grid_percentage: percentage(grid) };
};
const kwh = (wh: number) => pyRound(wh / 1000, 1);

// Null when the database holds no charging at all; a range before it counts nothing and says from when there is some.
export async function carCharging(start: string, end: string, today: string) {
  const { rows: [coverage] } = await db.query<{ first: string | null; cars: string | null }>(
    `SELECT (least((SELECT min(start_at) FROM charge_session), (SELECT min(start_at) FROM vehicle_interval)) AT TIME ZONE $1)::date::text AS first,
       ((SELECT min(start_at) FROM vehicle_interval) AT TIME ZONE $1)::date::text AS cars`,
    [SITE_ZONE],
  );
  if (!coverage.first) return null;

  const home = none();
  const byCar = new Map<string, Sources>();
  for (let day = start < coverage.first ? coverage.first : start; day <= end && day <= today; day = shiftDay(day, 1)) {
    const charged = await dayOf(day, today);
    add(home, charged.home);
    for (const [vin, wh] of charged.cars) {
      if (!byCar.has(vin)) byCar.set(vin, none());
      add(byCar.get(vin)!, wh);
    }
  }

  const cars = await loadCars();
  const homeShares = shares(home);
  return {
    since: start < coverage.first ? coverage.first : null,
    cars_since: coverage.cars && start < coverage.cars ? coverage.cars : null,
    total_kwh: kwh(home.solar + home.powerwall + home.grid),
    solar_kwh: kwh(home.solar),
    powerwall_kwh: kwh(home.powerwall),
    grid_kwh: kwh(home.grid),
    ...homeShares,
    off_grid_percentage: homeShares.solar_percentage + homeShares.powerwall_percentage,
    cars: [...byCar]
      .map(([vin, wh]) => ({ name: carName(cars, vin), total: wh.solar + wh.powerwall + wh.grid, wh }))
      .sort((a, b) => b.total - a.total)
      .map(({ name, total, wh }) => ({ name, kwh: kwh(total), ...shares(wh) })),
  };
}

export type CarCharging = NonNullable<Awaited<ReturnType<typeof carCharging>>>;
