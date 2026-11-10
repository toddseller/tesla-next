import { Cloud, CloudFog, CloudLightning, CloudRain, CloudSnow, CloudSun, type LucideIcon, Sun } from "lucide-react";

type Sky = { label: string; icon: LucideIcon };

const between = (code: number, low: number, high: number) => code >= low && code <= high;

// Open-Meteo's daily WMO code is the day's most severe weather, so a foggy morning reads Fog likely.
export function skyOf(code: number): Sky {
  if (code === 0) return { label: "Sunny", icon: Sun };
  if (code === 1 || code === 2) return { label: "Partly cloudy", icon: CloudSun };
  if (code === 45 || code === 48) return { label: "Fog likely", icon: CloudFog };
  if (between(code, 51, 67) || between(code, 80, 82)) return { label: "Rain", icon: CloudRain };
  if (between(code, 71, 77) || code === 85 || code === 86) return { label: "Snow", icon: CloudSnow };
  if (between(code, 95, 99)) return { label: "Thunderstorms", icon: CloudLightning };
  return { label: "Cloudy", icon: Cloud };
}
