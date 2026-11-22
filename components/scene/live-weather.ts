"use client";

import { useEffect, useRef, useState } from "react";

import type { useSiteData } from "@/components/scene/use-site-data";
import { type Sky, withSplit } from "@/lib/scene/weather";

// Live readings arrive every 15 minutes; each is walked in over about 5, so the sky
// changes like weather rather than jumping (openspec/specs/scene-weather). The first
// known weather shows at once. A missing value walks as 0, which the scene reads the
// same way (no sunshine caps nothing). The vane's wind isn't walked: its readout gives
// the latest reading, the vane eases to it on its own, and a walk from 350 to 10
// degrees would sweep the long way.
const WALK_MS = 5 * 60 * 1000;
const UNWALKED = new Set<keyof Sky>(["windSpeed", "windGusts", "windDirection"]);
const towards = (from: Sky, to: Sky, f: number): Sky =>
  Object.fromEntries((Object.keys(to) as (keyof Sky)[]).map((k) => [k, f === 1 || UNWALKED.has(k) ? to[k] : (from[k] ?? 0) + ((to[k] ?? 0) - (from[k] ?? 0)) * f]));
export const useWalkedWeather = (weather: Sky) => {
  const key = JSON.stringify(withSplit(weather));
  const [shown, setShown] = useState<Sky>(() => JSON.parse(key));
  const shownRef = useRef(shown);
  shownRef.current = shown;
  useEffect(() => {
    const from = shownRef.current;
    const to = JSON.parse(key);
    if (from.cover == null) {
      setShown(to);
      return undefined;
    }
    const start = Date.now();
    const timer = setInterval(() => {
      const f = Math.min(1, (Date.now() - start) / WALK_MS);
      setShown(towards(from, to, f));
      if (f === 1) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [key]);
  return shown;
};

// The live status's weather, walked in, for any page that draws the live scene.
export const useLiveWeather = (site: ReturnType<typeof useSiteData>) =>
  useWalkedWeather(site.liveReceived ? {
    cover: site.weatherCover, rain: site.weatherRain, wind: site.weatherWind, windLow: site.weatherWindLow, windMid: site.weatherWindMid, windHigh: site.weatherWindHigh,
    cirrus: site.weatherCirrus, low: site.weatherLow, mid: site.weatherMid, sun: site.weatherSun,
    windSpeed: site.weatherWindSpeed, windGusts: site.weatherWindGusts, windDirection: site.weatherWindDirection,
  } : {});
