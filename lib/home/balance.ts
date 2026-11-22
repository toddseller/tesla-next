// Below this a flow shows as "0 kW" in the scene (kw() in lib/scene/live-scene), so the sentence leaves it out too.
const SHOWN = 0.05;

type Live = { solarPower: number; batteryPower: number; gridPower: number };

// What supplies the house, signed as the scene reads the flows: the Powerwall negative while charging, the grid
// negative while exporting.
export function balance({ solarPower, batteryPower, gridPower }: Live) {
  const sources = [{ name: "Solar", kw: Math.max(solarPower || 0, 0) }, { name: "Powerwall", kw: batteryPower || 0 }, { name: "Grid", kw: gridPower || 0 }];
  return { sources: sources.filter((term) => Math.abs(term.kw) >= SHOWN) };
}
