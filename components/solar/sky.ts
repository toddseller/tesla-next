import { Cloud, CloudFog, CloudLightning, CloudMoon, CloudRain, CloudSnow, CloudSun, type LucideIcon, Moon, Sun } from "lucide-react";

import type { SkyWhen } from "@/lib/forecast";

type Sky = { label: string; icon: LucideIcon };

const between = (code: number, low: number, high: number) => code >= low && code <= high;

function forecastSky(code: number): Sky {
  if (code === 0) return { label: "Sunny", icon: Sun };
  if (code === 1 || code === 2) return { label: "Partly cloudy", icon: CloudSun };
  // A forecast day's code is its most severe weather, so fog for part of the day reads Fog likely.
  if (code === 45 || code === 48) return { label: "Fog likely", icon: CloudFog };
  if (between(code, 51, 67) || between(code, 80, 82)) return { label: "Rain", icon: CloudRain };
  if (between(code, 71, 77) || code === 85 || code === 86) return { label: "Snow", icon: CloudSnow };
  if (between(code, 95, 99)) return { label: "Thunderstorms", icon: CloudLightning };
  return { label: "Cloudy", icon: Cloud };
}

export function skyOf(code: number, when: SkyWhen = "forecast"): Sky {
  if (when === "night" && code === 0) return { label: "Clear now", icon: Moon };
  if (when === "night" && (code === 1 || code === 2)) return { label: "Partly cloudy now", icon: CloudMoon };
  const sky = forecastSky(code);
  if (when === "forecast") return sky;
  return { ...sky, label: `${sky.label === "Fog likely" ? "Fog" : sky.label} now` };
}
