// Ported from anton-tesla-api-ws services/weather.py: the sky the scene draws from a stored reading. The live status's
// weather is computed there by anton's scheduler; see the scene-weather spec.
import { pyRound } from "./python";

type Percent = number | null;

// WMO codes from fog (45) up are fog, drizzle, rain, snow and thunderstorms: all overcast.
const FIRST_OVERCAST_CODE = 45;
// From drizzle (51) up: what still makes the sky overcast when the airport has reported its fog.
const FIRST_PRECIPITATION_CODE = 51;

// The share of the sky under one layer of cloud, 0 to 1; null without the split, or when the code makes it overcast.
export function shareFrom(code: number, percent: Percent, overcastFrom = FIRST_OVERCAST_CODE): number | null {
  if (percent === null || code >= overcastFrom) return null;
  return percent / 100;
}

// How hard it rains for each WMO precipitation code, 0 to 1. Snow and freezing rain never fall at the site, so they
// show as rain of the same strength.
const RAIN: Record<number, number> = {
  51: 0.2, 53: 0.3, 55: 0.4, 56: 0.3, 57: 0.4,
  61: 0.4, 63: 0.7, 65: 1, 66: 0.5, 67: 0.9,
  71: 0.4, 73: 0.7, 75: 1, 77: 0.3,
  80: 0.5, 81: 0.8, 82: 1, 85: 0.5, 86: 0.8,
  95: 1, 96: 1, 99: 1,
};

export const rainFrom = (code: number) => RAIN[code] ?? 0;

// The wind blowing across the scene in km/h to one decimal, positive toward its right (east). `direction` is where
// the wind comes from. The + 0 turns Python's -0.0 + 0.0 into 0, as there.
export function windAcross(speed: number | null, direction: number | null): number | null {
  if (speed === null || direction === null) return null;
  return pyRound(-speed * Math.sin(direction * (Math.PI / 180)), 1) + 0;
}

export function windsAloft(
  lowSpeed: number | null, lowDirection: number | null,
  midSpeed: number | null, midDirection: number | null,
  highSpeed: number | null, highDirection: number | null,
) {
  return {
    windLow: windAcross(lowSpeed, lowDirection),
    windMid: windAcross(midSpeed, midDirection),
    windHigh: windAcross(highSpeed, highDirection),
  };
}

// How much of the sun's light each layer blocks: low cloud is opaque, mid dims the sun, high cirrus barely does.
const LOW_WEIGHT = 1;
const MID_WEIGHT = 0.6;
const HIGH_WEIGHT = 0.25;

export function coverFrom(code: number, cloudCover: number, low: Percent = null, mid: Percent = null, high: Percent = null, overcastFrom = FIRST_OVERCAST_CODE): number {
  if (code >= overcastFrom) return 1;
  if (low === null || mid === null || high === null) return cloudCover / 100;
  return Math.min(1, (LOW_WEIGHT * low + MID_WEIGHT * mid + HIGH_WEIGHT * high) / 100);
}

// With the airport's cloud and the service's split, the low cloud is the airport's, the mid the greater of both, and
// the airport's report decides fog; otherwise the service's alone.
export function skyFrom(code: number, cloudCover: number, low: Percent = null, mid: Percent = null, high: Percent = null, airportLow: Percent = null, airportMid: Percent = null) {
  let overcastFrom = FIRST_OVERCAST_CODE;
  if (airportLow !== null && low !== null && mid !== null && high !== null) {
    low = airportLow;
    mid = Math.max(mid, airportMid!);
    overcastFrom = FIRST_PRECIPITATION_CODE;
  }
  return {
    cover: coverFrom(code, cloudCover, low, mid, high, overcastFrom),
    cirrus: shareFrom(code, high, overcastFrom),
    low: shareFrom(code, low, overcastFrom),
    mid: shareFrom(code, mid, overcastFrom),
  };
}
