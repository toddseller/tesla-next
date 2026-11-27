import type { balance } from "@/lib/home/balance";
import type { Vehicle } from "@/lib/scene/live-scene";
import { HIGH_WIND } from "@/lib/backup-figures";
import { TIME_ZONE } from "@/lib/scene/replay";
import { sunTimes } from "@/lib/scene/sun";
import { type Sky, windIn } from "@/lib/scene/weather";
import { degrees, type Units } from "@/lib/units";

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

const WORDS: Record<string, string> = { Fog: "foggy", Rain: "rainy", Snow: "snowy", Thunderstorms: "stormy" };
const clock = new Intl.DateTimeFormat("en-US", { timeZone: TIME_ZONE, hour: "numeric", minute: "2-digit" });
const DAY_MS = 24 * 60 * 60 * 1000;

// The weather sentence under Now, in parts, so the page can leave the gusts out on a phone (home-story spec).
export function outsideParts({ temperature, windGusts }: Sky, label: string | null, now: Date, units: Units) {
  if (temperature == null || label == null) return null;
  const { sunrise, sunset } = sunTimes(now);
  const sun = now < sunrise ? `sunrise at ${clock.format(sunrise)}` : now < sunset ? `sunset at ${clock.format(sunset)}` : `sunrise at ${clock.format(sunTimes(new Date(now.getTime() + DAY_MS)).sunrise)}`;
  return {
    start: `Outside it's ${degrees(temperature, units.temperature)}°${units.temperature} and ${WORDS[label] ?? label.toLowerCase()}`,
    gusts: windGusts != null && windGusts >= HIGH_WIND ? `, gusts to ${windIn(windGusts, units.wind)}` : null,
    end: `; ${sun}.`,
  };
}
