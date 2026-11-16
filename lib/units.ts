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
