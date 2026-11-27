import { Cloud, CloudFog, CloudLightning, CloudMoon, CloudRain, CloudSnow, CloudSun, type LucideIcon, Moon, Sun } from "lucide-react";

import type { SkyWhen } from "@/lib/forecast";
import { skyAt } from "@/lib/scene/sun";

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

const FOG = new Set([45, 48]);
const codeOfCover = (cover: number) => (cover < 0.25 ? 0 : cover < 0.75 ? 2 : 3);

// The Outside band's word for the shown moment. The scene draws fog only when the sky is fully overcast or the low
// cloud reaches 0.75 (the airport decides fog), so a fog code otherwise reads by the cover the scene does draw.
export function outsideSky({ code, cover, low }: { code?: number | null; cover?: number | null; low?: number | null }, at: Date): Sky | null {
  if (code == null) return null;
  const drawnFog = cover === 1 || (low ?? 0) >= 0.75;
  const shown = FOG.has(code) && !drawnFog ? codeOfCover(cover ?? 0) : code;
  const sky = skyOf(shown, skyAt(at) === "day" ? "now" : "night");
  return { ...sky, label: sky.label.replace(/ now$/, "") };
}
