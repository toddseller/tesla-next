"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { StaleWarning } from "@/components/scene/distribution";
import LiveScene from "@/components/scene/live-scene";
import { useLiveWeather } from "@/components/scene/live-weather";
import { useSiteData } from "@/components/scene/use-site-data";
import { useLiveStream } from "@/components/use-live-stream";
import { balance } from "@/lib/home/balance";
import { nowSentence } from "@/lib/home/now-sentence";
import { type LiveStatus, liveStatus } from "@/lib/live-status";
import { sceneState } from "@/lib/scene/live-scene";

const parse = <T,>(json: string | null): T | null => {
  try {
    return json ? JSON.parse(json) : null;
  } catch {
    return null;
  }
};

type Props = { initialStatus: string | null; renderedAt: number };

// `renderedAt` is when the server rendered the page, so hydration finds the times its HTML shows.
export function Now({ initialStatus, renderedAt }: Props) {
  const site = useSiteData(initialStatus);
  const weather = useLiveWeather(site);
  const [status, setStatus] = useState(() => parse<LiveStatus>(initialStatus));
  const [now, setNow] = useState(() => new Date(renderedAt));
  // The scene's sky moves by the minute, as on Distribution; the sentence's staleness by the second.
  const [sceneNow, setSceneNow] = useState(() => new Date(renderedAt));
  useLiveStream({ onStatus: setStatus });
  useEffect(() => {
    setNow(new Date());
    setSceneNow(new Date());
    const timers = [setInterval(() => setNow(new Date()), 1000), setInterval(() => setSceneNow(new Date()), 60000)];
    return () => timers.forEach(clearInterval);
  }, []);

  const { live, time } = liveStatus(status, now);
  const terms = balance(site);
  const state = sceneState(site, sceneNow, weather);

  return (
    <section aria-labelledby="now" className="grid items-center gap-x-10 gap-y-5 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
      <div className="flex flex-col gap-3 md:gap-4">
        <h2 id="now" className="text-[64px] leading-[0.9] font-semibold tracking-[-0.04em] md:text-[112px]">Now</h2>
        <p data-part="now-sentence" className={`max-w-[34ch] text-xl leading-snug font-medium text-pretty md:text-[22px] ${live ? "" : "text-muted-foreground"}`}>
          {live ? nowSentence(terms, { battery: site.battery, vehicle: site.vehicle }, now) : `No live update since ${time}.`}
        </p>
      </div>
      <div className="relative overflow-hidden rounded-[10px]">
        <StaleWarning liveReceived={site.liveReceived} modifiedAt={site.modifiedAt} renderedAt={renderedAt} />
        <LiveScene state={state} />
        <Link href="/distribution" className="absolute top-3 left-3 inline-flex min-h-11 items-center gap-1.5 rounded-full bg-background/80 px-3 text-[13px] font-medium hover:bg-background">See the house live, with replay<ArrowRight size={14} aria-hidden /></Link>
      </div>
    </section>
  );
}
