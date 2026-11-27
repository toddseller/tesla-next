export type Units = { temperature: "F" | "C"; wind: "mph" | "km/h" };

const US_AND_TERRITORIES = ["US", "PR", "GU", "VI", "AS", "MP"];
const FAHRENHEIT = new Set([...US_AND_TERRITORIES, "LR", "BS", "BZ", "KY", "PW", "FM", "MH"]);
const MPH = new Set([...US_AND_TERRITORIES, "GB", "LR"]);

const regionOf = (tag: string) => {
  try {
    return new Intl.Locale(tag).region;
  } catch {
    return undefined;
  }
};

// Entries are taken in the order sent: browsers already list them most preferred first.
export function unitsFor(acceptLanguage: string | null): Units {
  const region = acceptLanguage?.split(",").map((entry) => regionOf(entry.split(";")[0].trim())).find(Boolean) ?? "US";
  return { temperature: FAHRENHEIT.has(region) ? "F" : "C", wind: MPH.has(region) ? "mph" : "km/h" };
}

// Whole degrees in the viewer's unit, from the °C anton stores.
export const degrees = (celsius: number, unit: Units["temperature"]) => Math.round(unit === "F" ? (celsius * 9) / 5 + 32 : celsius);

// One unit for a whole list or axis: `top` is its largest figure, so its rows never mix kWh and MWh.
export function energy(kwh: number, digits: number, top = kwh): [string, "kWh" | "MWh"] {
  // Decided on the figure as shown, so 999.96 at a tenth reads 1.0 MWh, not 1,000.0 kWh.
  const mwh = Math.abs(Number(top.toFixed(digits))) >= 1000;
  const value = (mwh ? kwh / 1000 : kwh).toLocaleString("en-US", { minimumFractionDigits: mwh ? 1 : digits, maximumFractionDigits: mwh ? 1 : digits });
  return [value, mwh ? "MWh" : "kWh"];
}

// An energy axis's tick labels, the unit on the top tick only: each tick keeps its own round step ("0, 20, 40 MWh")
// instead of energy's tenth. `top` is the axis's top tick.
export const energyAxis = (top: number) => (tick: number, index: number, count: number) => {
  const label = (top >= 1000 ? tick / 1000 : tick).toLocaleString("en-US");
  return index === count - 1 ? `${label} ${top >= 1000 ? "MWh" : "kWh"}` : label;
};
