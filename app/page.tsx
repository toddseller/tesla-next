import { SolarPage } from "@/components/solar/solar-page";
import { forecast, forecastCard } from "@/lib/forecast";
import { dayIntervals } from "@/lib/intervals/intervals";
import { latest } from "@/lib/live";
import { rangeTotals } from "@/lib/range";
import { siteToday } from "@/lib/scene/replay";
import { monthOf, parseDay, parseRange, stripRange } from "@/lib/solar/ranges";

// The range and the open day live in the address, so a link or a reload shows the same page, rendered with its data.
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const today = siteToday();
  const range = parseRange(params, monthOf(today));
  const day = parseDay(params.day);
  if (!day) {
    const [items, stored] = await Promise.all([rangeTotals(range.start, range.end), forecast(today)]);
    return <SolarPage range={range} items={items} today={today} initialStatus={latest()} forecast={forecastCard(stored, today, Date.now())} />;
  }
  const strip = stripRange(range, day, today);
  const [data, items] = await Promise.all([dayIntervals(day), rangeTotals(strip.start, strip.end)]);
  return <SolarPage range={range} items={[]} today={today} initialStatus={latest()} day={{ data, strip: { range: strip, items } }} />;
}
