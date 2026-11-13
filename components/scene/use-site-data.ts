"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useLiveStream } from "@/components/use-live-stream";
import type { Vehicle } from "@/lib/scene/live-scene";
import type { IntervalRecord } from "@/lib/scene/replay";
import type { Sky, WeatherReading } from "@/lib/scene/weather";

// What anton's scheduler notifies each poll (anton-tesla-api-ws live-site-status), as /api/live forwards it.
type LiveStatus = {
  load_power?: number | null;
  home_power?: number | null;
  solar_power?: number | null;
  grid_power?: number | null;
  battery_power?: number | null;
  battery_percentage?: number | null;
  modified?: string | null;
  vehicle?: Vehicle | null;
  weather?: Sky | null;
};

export type ReplayDay = { date: string; data: IntervalRecord[]; weather?: WeatherReading[] };

export const EMPTY = {
  solarPower: 0,
  homePower: 0,
  batteryPower: 0,
  battery: undefined as number | undefined,
  gridPower: 0,
  vehicle: null as Vehicle | null,
  liveReceived: false,
  modifiedAt: null as Date | null,
  weatherCover: null as number | null,
  weatherRain: null as number | null,
  weatherWind: null as number | null,
  weatherWindLow: null as number | null,
  weatherWindMid: null as number | null,
  weatherWindHigh: null as number | null,
  weatherCirrus: null as number | null,
  weatherLow: null as number | null,
  weatherMid: null as number | null,
  weatherSun: null as number | null,
  weatherWindSpeed: null as number | null,
  weatherWindGusts: null as number | null,
  weatherWindDirection: null as number | null,
};
type Live = typeof EMPTY;

const kw = (value: unknown) => parseFloat(String(value));

// Battery readings and times can be missing right after anton's scheduler restarts; the last ones still hold.
export const applyStatus = (previous: Live, status: LiveStatus): Live => ({
  solarPower: kw(status.solar_power),
  gridPower: kw(status.grid_power),
  batteryPower: kw(status.battery_power),
  homePower: kw(status.home_power ?? status.load_power),
  battery: status.battery_percentage ?? previous.battery,
  modifiedAt: status.modified != null ? new Date(status.modified) : previous.modifiedAt,
  vehicle: status.vehicle ?? null,
  weatherCover: status.weather?.cover ?? null,
  weatherRain: status.weather?.rain ?? null,
  weatherWind: status.weather?.wind ?? null,
  weatherWindLow: status.weather?.windLow ?? null,
  weatherWindMid: status.weather?.windMid ?? null,
  weatherWindHigh: status.weather?.windHigh ?? null,
  weatherCirrus: status.weather?.cirrus ?? null,
  weatherLow: status.weather?.low ?? null,
  weatherMid: status.weather?.mid ?? null,
  weatherSun: status.weather?.sun ?? null,
  weatherWindSpeed: status.weather?.windSpeed ?? null,
  weatherWindGusts: status.weather?.windGusts ?? null,
  weatherWindDirection: status.weather?.windDirection ?? null,
  liveReceived: true,
});

export const useSiteData = (initialStatus: string | null) => {
  const [live, setLive] = useState(() => {
    // Parsed during the server's render, where a throw would fail the whole page; the stream's next status fills it in.
    try {
      return initialStatus ? applyStatus(EMPTY, JSON.parse(initialStatus)) : EMPTY;
    } catch {
      return EMPTY;
    }
  });
  const [replayDay, setReplayDay] = useState<string | null>(null);
  const [replayData, setReplayData] = useState<ReplayDay | null>(null);

  // Only the latest request's answer is kept, so a slow one can't overwrite a newer day.
  const latest = useRef(0);
  const fetchReplay = useCallback(async (day: string) => {
    const request = ++latest.current;
    try {
      const response = await fetch(`/api/intervals?date=${day}`);
      if (!response.ok) throw new Error(`/api/intervals answered ${response.status}`);
      const data = await response.json();
      if (latest.current === request) setReplayData(data);
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    if (replayDay) {
      void fetchReplay(replayDay);
    } else {
      latest.current += 1;
      setReplayData(null);
    }
  }, [replayDay, fetchReplay]);

  useLiveStream({
    onStatus: (status) => setLive((previous) => applyStatus(previous, status)),
    onTotals: (date) => {
      if (date === replayDay) void fetchReplay(date);
    },
  });

  return { ...live, replayData, setReplayDay };
};
