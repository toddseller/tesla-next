import type { balance } from "@/lib/home/balance";
import type { Vehicle } from "@/lib/scene/live-scene";
import { sunTimes } from "@/lib/scene/sun";

const NAMES: Record<string, string> = { Solar: "solar", Powerwall: "the Powerwalls", Grid: "the grid" };
// A no-break space, so a figure never wraps away from its unit.
const kw = (value: number) => `${Math.abs(value).toFixed(1)}\u00a0kW`;
const list = (names: string[]) => (names.length < 3 ? names.join(" and ") : `${names.slice(0, -1).join(", ")}, and ${names.at(-1)}`);
const capital = (text: string) => text[0].toUpperCase() + text.slice(1);

export function nowSentence({ sources }: ReturnType<typeof balance>, { battery, vehicle, storm }: { battery?: number; vehicle: Vehicle | null; storm: boolean }, now: Date) {
  const supplying = sources.filter((term) => term.kw > 0).sort((a, b) => b.kw - a.kw).map((term) => NAMES[term.name]);
  const { sunrise, sunset } = sunTimes(now);
  const dark = now >= sunset ? "after sunset" : now < sunrise ? "before sunrise" : null;
  // "The Powerwalls" is plural on its own.
  const plural = supplying.length > 1 || supplying[0] === NAMES.Powerwall;
  const sending = sources.find((term) => term.name === "Grid" && term.kw < 0);
  const supply = supplying.length ? `${capital(list(supplying))} ${plural ? "supply" : "supplies"} the house` : "Nothing supplies the house";
  const sends = sending && supplying.length ? ` and ${plural ? "send" : "sends"} ${kw(sending.kw)} to PG&E` : "";
  const first = `${supply}${sends}${dark && !supplying.includes("solar") ? `; solar is at 0 ${dark}` : ""}.`;

  const powerwall = sources.find((term) => term.name === "Powerwall");
  const full = battery == null ? "" : `, ${battery}% full`;
  const reason = storm ? " for a storm watch" : "";
  const powerwalls = !powerwall
    ? `${storm ? "holding" : "idle"}${battery == null ? "" : ` at ${battery}%`}${reason}`
    : powerwall.kw < 0
      ? `charging at ${kw(powerwall.kw)}${reason}${full}`
      : `supplying ${kw(powerwall.kw)}${full}`;
  const charging = vehicle?.charging_power ?? 0;
  const car = !vehicle ? null : charging >= 0.05 ? `charging at ${kw(charging)}` : vehicle.battery_level == null ? null : `at ${vehicle.battery_level}%`;
  return `${first} The Powerwalls are ${powerwalls}${car ? `, and the car is ${car}` : ""}.`;
}
