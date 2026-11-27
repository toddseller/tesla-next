"use client";

import { Fragment, type ReactNode } from "react";

import { outsideSky } from "@/components/solar/sky";
import { useUnits } from "@/components/units";
import { TIME_ZONE } from "@/lib/scene/replay";
import { sunTimes } from "@/lib/scene/sun";
import { type Sky, windText } from "@/lib/scene/weather";
import { degrees } from "@/lib/units";

const clock = new Intl.DateTimeFormat("en-US", { timeZone: TIME_ZONE, hour: "numeric", minute: "2-digit" });

const Figure = ({ children }: { children: ReactNode }) => <span className="font-mono font-semibold text-foreground">{children}</span>;

const Dotted = ({ items }: { items: ReactNode[] }) => (
  <p className="m-0 flex flex-wrap items-center gap-x-2.5 gap-y-1">
    {items.map((item, i) => (
      <Fragment key={i}>
        {i > 0 && <span aria-hidden className="text-muted-foreground/60">·</span>}
        {item}
      </Fragment>
    ))}
  </p>
);

// The weather of the moment the scene shows, live or replayed (scene-weather spec, "The Outside band").
export function Outside({ weather, at, replay }: { weather: Sky; at: number; replay: boolean }) {
  const { temperature, wind } = useUnits();
  const sky = outsideSky(weather, new Date(at));
  const windWords = windText(weather.windSpeed, weather.windGusts, weather.windDirection, wind);
  const { sunrise, sunset } = sunTimes(new Date(at));
  const heading = replay ? `Outside at ${clock.format(at)}` : "Outside now";

  const reading = [
    (weather.temperature != null || sky) && (
      <span className="flex items-center gap-2.5">
        {weather.temperature != null && <Figure>{degrees(weather.temperature, temperature)}°{temperature}</Figure>}
        {sky && <span className="text-foreground">{sky.label}</span>}
      </span>
    ),
    windWords !== "No wind reading" && <span>{windWords}</span>,
  ].filter(Boolean);

  return (
    <section aria-label={heading} className="mt-1 flex min-h-[52px] flex-wrap items-center justify-between gap-x-6 gap-y-1.5 rounded-[10px] border border-border bg-card px-3.5 py-2.5 text-sm text-muted-foreground md:px-5 md:text-[15px]">
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
        {sky ? <sky.icon size={18} aria-hidden /> : null}
        <span>{heading}</span>
        {reading.length > 0 && <Dotted items={reading} />}
      </div>
      <Dotted items={[<span key="rise">Sunrise <Figure>{clock.format(sunrise)}</Figure></span>, <span key="set">Sunset <Figure>{clock.format(sunset)}</Figure></span>]} />
    </section>
  );
}
