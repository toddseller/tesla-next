// Pure, so every rule is tested here; the scene components only draw this state. See the live-flow-scene spec.

import { azimuthX, nightSky } from "@/lib/scene/night-sky";
import { moonOrientation, moonPhase, moonPosition, SITE, skyAt, sunPosition, sunTimes } from "@/lib/scene/sun";
import type { Sky } from "@/lib/scene/weather";

export type Vehicle = { name: string; color?: string; charging_power?: number | null; battery_level?: number | null; battery_level_at?: string | null; charging_state?: string | null };

// Live status in kW and percent; any of it may be missing before the first update.
export type LiveInput = { solarPower?: number | null; homePower?: number | null; batteryPower?: number | null; battery?: number | null; gridPower?: number | null; vehicle?: Vehicle | null; liveReceived?: boolean };

type Source = "solar" | "powerwall" | "grid";
type Destination = "powerwall" | "home" | "car" | "grid";
export type Link = { from: Source; to: Destination; kw: number };
// Replay passes the recorded links and its moment's weather; live passes the live weather.
export type SceneOptions = Sky & { links?: Link[]; replay?: boolean };

// Below this a flow displays as 0.0 kW and counts as idle.
export const ACTIVE_KW = 0.1;
const STALE_AFTER_HOURS = 6;
export const DASH = "—";
// The Powerwall charge bar's level before the first reading: the usual backup
// reserve, rather than an empty bar.
export const DEFAULT_CHARGE = 20;
// The solar panels' gold glow: its opacity grows with solar power up to
// `opacity` at `fullKw`, and stays there above it.
export const SOLAR_GLOW = { fullKw: 10, opacity: 0.2 };

// The compass direction each lit face of the house faces (the garage door faces
// 174 degrees).
const FACES = { south: 174, east: 84, west: 264 };
export type Sunlight = Record<keyof typeof FACES | "strength" | "peak", number>;
// The sunlight's strength grows with the sun's height up to this, then stays full.
const FULL_SUN_ALTITUDE = 25;
// The noon sun's height on the June solstice, where the season's peak is full.
const JUNE_NOON_ALTITUDE = 90 - (SITE.lat - 23.44);
const sinDeg = (deg: number) => Math.sin((deg * Math.PI) / 180);

// `peak` limits the light, not the shade, by the season: 1 in June, about 0.5 in December (the scene-weather spec).
const sunlight = (now: Date, cover: number | null | undefined): Sunlight | null => {
  const { altitude, azimuth, noonAltitude } = sunPosition(now);
  if (altitude <= 0) return null;
  return {
    ...Object.fromEntries(Object.entries(FACES).map(([face, facing]) => [face, Math.max(0, Math.cos(((azimuth - facing) * Math.PI) / 180))])),
    strength: Math.min(1, altitude / FULL_SUN_ALTITUDE) * (1 - (cover ?? 0)),
    peak: sinDeg(noonAltitude) / sinDeg(JUNE_NOON_ALTITUDE),
  } as Sunlight;
};

// 0 on the horizon, where the sun's glow is dim and warm.
const daylightAt = (altitude: number) => Math.min(1, Math.max(0, altitude) / FULL_SUN_ALTITUDE);
// The sun glow and the moon fade out over their last 2 degrees above the horizon
// (and in over their first), so they never pop in or out as they set or rise.
const horizonFade = (altitude: number) => Math.min(1, Math.max(0, altitude / 2));
// The render looks at the house from the southeast, so the sun crosses the scene from right to left.
const sunGlow = (now: Date) => {
  const { sunrise, sunset } = sunTimes(now);
  const { altitude } = sunPosition(now);
  return {
    x: 0.95 - (0.9 * (now.getTime() - sunrise.getTime())) / (sunset.getTime() - sunrise.getTime()), altitude,
    daylight: daylightAt(altitude), fade: horizonFade(altitude),
  };
};

// The end of civil twilight, where sunset's warm glow is gone.
export const TWILIGHT_DEGREES = 6;
const twilightAt = (now: Date) => {
  const { altitude, azimuth } = sunPosition(now);
  return { strength: Math.max(0, 1 - Math.abs(altitude) / TWILIGHT_DEGREES), x: azimuthX(azimuth) };
};

// For the clouds' dimming through twilight.
const duskAt = (now: Date) => Math.min(1, Math.max(0, (sunPosition(now).altitude + TWILIGHT_DEGREES) / (2 * TWILIGHT_DEGREES)));

// Each day's cloud shapes are seeded by its date. replay.ts, which has TIME_ZONE, imports this file, so the zone is
// written out here.
const siteDate = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles" });
const cloudSeedAt = (now: Date) => Date.parse(siteDate.format(now)) / 86400000;

// Up by day too: the sun outshines it as its height grows (`daylight`), and its glow and dark side show as the
// scene turns to night (`night`). Phase 0 is new, 0.5 full.
const moonInSky = (now: Date) => {
  const { altitude, azimuth } = moonPosition(now);
  if (altitude <= 0) return null;
  return {
    x: azimuthX(azimuth), altitude, phase: moonPhase(now), ...moonOrientation(now),
    daylight: daylightAt(sunPosition(now).altitude), night: 1 - duskAt(now),
    // Low, its light crosses more air: dimmer and warmer, 1 on the horizon to 0 by 10 degrees up.
    fade: horizonFade(altitude), low: 1 - Math.min(1, altitude / 10),
  };
};

// The live page's warning once live updates have stopped: null while the live
// status's timestamp is under UPDATE_STALE_SECONDS old (the moving flows say
// the data is live), then how long since the last update, in whole minutes.
export const UPDATE_STALE_SECONDS = 120;
export const staleWarning = (modifiedAt: number | Date, now: number | Date) => {
  const seconds = Math.floor((Number(now) - Number(modifiedAt)) / 1000);
  return seconds < UPDATE_STALE_SECONDS ? null : `No update for ${Math.floor(seconds / 60)} min`;
};

// Like the Tesla app: magnitudes only (direction is shown by the wire's motion),
// one decimal, and a plain "0 kW" when idle.
export const kw = (value: unknown) => {
  const magnitude = Math.abs(Number(value) || 0);
  return magnitude < 0.05 ? "0 kW" : `${magnitude.toFixed(1)} kW`;
};
const active = (value: unknown) => Math.abs(Number(value) || 0) >= ACTIVE_KW;

// As in the app, the name is the label's title. The level's age gets its own
// line, so a long "8 h ago" doesn't widen the label into its neighbors.
const carLabel = (vehicle: Vehicle, now: Date) => {
  const parts = [kw(vehicle.charging_power ?? 0)];
  let age: string | null = null;
  if (vehicle.battery_level != null) {
    parts.push(`${vehicle.battery_level}%`);
    if (vehicle.battery_level_at) {
      const hours = Math.floor((now.getTime() - new Date(vehicle.battery_level_at).getTime()) / 3_600_000);
      if (hours >= STALE_AFTER_HOURS) age = `${hours} h ago`;
    }
  }
  return { name: vehicle.name, value: parts.join(" · "), age };
};

// Which source feeds which destination. The data has only each element's
// total, so each source in turn fills destinations in its order of priority.
// Solar charges the Powerwall first, as Tesla attributes it (the grid charges
// it only for what solar can't cover). Meter totals don't always balance, so
// an active source left without a destination is linked to home.
const SOURCES: Source[] = ["solar", "powerwall", "grid"];
const DESTINATIONS: Record<Source, Destination[]> = {
  solar: ["powerwall", "home", "car", "grid"],
  powerwall: ["home", "car", "grid"],
  grid: ["home", "car", "powerwall"],
};

const sceneLinks = ({ solarPower, homePower, batteryPower, gridPower, vehicle }: LiveInput) => {
  const n = (value: unknown) => Number(value) || 0;
  const supply: Record<Source, number> = { solar: Math.max(n(solarPower), 0), powerwall: Math.max(n(batteryPower), 0), grid: Math.max(n(gridPower), 0) };
  const demand: Record<Destination, number> = {
    home: Math.max(n(homePower), 0),
    car: Math.max(n(vehicle?.charging_power), 0),
    powerwall: Math.max(-n(batteryPower), 0),
    grid: Math.max(-n(gridPower), 0),
  };
  const links: Link[] = [];
  SOURCES.filter((from) => supply[from] >= ACTIVE_KW).forEach((from) => {
    let left = supply[from];
    const linked = links.length;
    DESTINATIONS[from].forEach((to) => {
      const share = Math.min(left, demand[to]);
      if (share >= ACTIVE_KW) {
        links.push({ from, to, kw: share });
        left -= share;
        demand[to] -= share;
      }
    });
    if (links.length === linked) links.push({ from, to: "home", kw: left });
  });
  return links;
};

// The most cloud the roof's sunshine allows: scattered cloud in full sun, easing
// off to no cap once the roof is as dull as cloud makes it; the reference the
// sunshine is measured against runs high in autumn, so full sun starts below 1.
const ROOF_CAP = { fullSun: 0.8, dull: 0.4, scattered: 0.3 };
// Negated so that a missing sunshine, which a replay blends to NaN, caps nothing too.
const roofCap = (sun: number | null | undefined) =>
  !((sun ?? NaN) > ROOF_CAP.dull)
    ? 1
    : ROOF_CAP.scattered + (1 - ROOF_CAP.scattered) * Math.max(0, (ROOF_CAP.fullSun - sun!) / (ROOF_CAP.fullSun - ROOF_CAP.dull));
const capped = (value: number | null | undefined, cap: number) => (value == null ? value : Math.min(value, cap));

export const sceneState = (
  { solarPower, homePower, batteryPower, battery, gridPower, vehicle, liveReceived }: LiveInput,
  now: Date = new Date(),
  // Replay passes the recorded links, and has no 20% default for a missing charge. A weather field is null without
  // a recent reading and undefined before the weather is known; wind is km/h across the scene, positive to its right,
  // and the vane's windSpeed, windGusts and windDirection the 10 m wind as stored, in km/h and degrees from.
  { links, replay = false, cover, rain, wind, windLow, windMid, windHigh, windSpeed, windGusts, windDirection, cirrus, low, mid, sun }: SceneOptions = {}
) => {
  // The weather service's model can keep a marine layer for hours after the roof is in full sun.
  const cap = roofCap(sun);
  [cover, low, mid] = [capped(cover, cap), capped(low, cap), capped(mid, cap)];
  const flows = {
    solar: active(solarPower) ? "in" : null,
    // Powerwall: negative power is charging (energy into the Powerwall).
    powerwall: !active(batteryPower) ? null : batteryPower! < 0 ? "in" : "out",
    // Grid: positive is importing (energy into the house).
    grid: !active(gridPower) ? null : gridPower! > 0 ? "in" : "out",
    car: vehicle && active(vehicle.charging_power) ? "in" : null,
  };

  const labels = liveReceived
    ? {
        solar: kw(solarPower),
        home: kw(homePower),
        powerwall: battery != null ? `${kw(batteryPower)} · ${battery}%` : kw(batteryPower),
        grid: kw(gridPower),
        car: vehicle ? carLabel(vehicle, now) : null,
      }
    : { solar: DASH, home: DASH, powerwall: DASH, grid: DASH, car: null };

  return {
    labels,
    flows,
    links: links ?? sceneLinks({ solarPower, homePower, batteryPower, gridPower, vehicle }),
    // null for no bar.
    charge: (replay || liveReceived) && battery != null ? Math.min(Math.max(battery, 0), 100) : replay ? null : DEFAULT_CHARGE,
    glow: (replay || liveReceived) && flows.solar ? Math.min(Math.max(Number(solarPower), 0) / SOLAR_GLOW.fullKw, 1) * SOLAR_GLOW.opacity : 0,
    replay,
    // As the sky at the site does, the cover capped by the roof's sunshine, not by
    // solar output itself: right before the first live update, on overcast days and if updates stop.
    sunlight: skyAt(now) === "day" ? sunlight(now, cover) : null,
    sunGlow: skyAt(now) === "day" ? sunGlow(now) : null,
    moon: moonInSky(now),
    stars: nightSky(now),
    twilight: twilightAt(now),
    dusk: duskAt(now),
    rain,
    wind,
    windLow,
    windMid,
    windHigh,
    windSpeed,
    windGusts,
    windDirection,
    cloudSeed: cloudSeedAt(now),
    cover,
    cirrus,
    low,
    mid,
  };
};

export type SceneState = ReturnType<typeof sceneState>;
