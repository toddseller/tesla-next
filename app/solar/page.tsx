import { cache } from "react";

import { SolarPage } from "@/components/solar/solar-page";
import { forecast, forecastCard } from "@/lib/forecast";
import { solarTotal } from "@/lib/lead";
import { dayIntervals } from "@/lib/intervals/intervals";
import { latest } from "@/lib/live";
import { readingsOf } from "@/lib/meter";
import { rangeTotals } from "@/lib/range";
import { siteToday } from "@/lib/scene/replay";
import { comparedDays, dropUnshown, monthOf, parseDay, parseRange, rangeIncludes, rangeTitle, stripRange } from "@/lib/solar/ranges";

type Params = Record<string, string | string[] | undefined>;

// The title and the page read the date once per request, so a request at the site's midnight can't name two days.
const requestToday = cache(() => siteToday());

export async function generateMetadata({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const day = parseDay(params.day);
  return { title: `Solar · ${rangeTitle(day ? { start: day, end: day } : parseRange(params, monthOf(requestToday())))}` };
}

// The range and the open day live in the address, so a link or a reload shows the same page, rendered with its data.
export default async function Page({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  dropUnshown("/solar", params, true);
  const today = requestToday();
  const readings = readingsOf(params.readings);
  const range = parseRange(params, monthOf(today));
  const day = parseDay(params.day);
  if (!day) {
    const days = comparedDays(range, today);
    const cut = days && days.now.end !== range.end;
    const [items, stored, then, now] = await Promise.all([
      rangeTotals(range.start, range.end, readings), rangeIncludes(range, today) && forecast(today), days && rangeTotals(days.then.start, days.then.end, readings),
      cut && rangeTotals(days.now.start, days.now.end, readings),
    ]);
    return (
      <SolarPage range={range} items={items} today={today} initialStatus={latest()} forecast={stored ? forecastCard(stored, today, Date.now()) : null} readings={readings}
        before={then ? { then: solarTotal(then), now: now ? solarTotal(now) : null } : null} />
    );
  }
  const strip = stripRange(range, day, today);
  const [data, items] = await Promise.all([dayIntervals(day, readings), rangeTotals(strip.start, strip.end, readings)]);
  return <SolarPage range={range} items={[]} today={today} initialStatus={latest()} day={{ data, strip: { range: strip, items } }} readings={readings} />;
}
