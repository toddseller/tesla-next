// Ported from anton-tesla-api-ws services/vehicles.py (names and session cars). anton keeps the account's vehicle list
// in the `vehicle` table, refreshed every 6 hours, so this read never calls Tesla.
import { db } from "@/lib/db";

export type Car = { vin: string; display_name: string; streamed: boolean };

const DEFAULT_NAME = "Vehicle";

export async function loadCars(): Promise<Car[]> {
  return (await db.query<Car>("SELECT vin, display_name, streamed FROM vehicle")).rows;
}

export const carName = (cars: Car[], vin: string) => cars.find((car) => car.vin === vin)?.display_name || DEFAULT_NAME;

// A charge session's average power names its car: only the Model Y charges this fast here, and the Model 3 tops out
// at 32 A.
const MODEL_Y_KW = 8.0;
const MODEL_3_KW = 6.5;

// A model names a car only when exactly one streamed car is that model.
function vinForModel(cars: Car[], model: string) {
  const matches = cars.filter((car) => car.streamed && car.vin.slice(3, 4) === model);
  return matches.length === 1 ? matches[0].vin : null;
}

export function sessionVin(cars: Car[], energyWh: number, durationS: number): string | null {
  if (durationS <= 0) return null;
  const kw = (energyWh * 3.6) / durationS;
  if (kw >= MODEL_Y_KW) return vinForModel(cars, "Y");
  if (kw >= MODEL_3_KW) return vinForModel(cars, "3");
  return null;
}
