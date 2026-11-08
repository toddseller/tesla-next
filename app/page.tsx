import { SolarPage } from "@/components/solar/solar-page";
import { dayIntervals } from "@/lib/intervals/intervals";
import { latest } from "@/lib/live";
import { rangeTotals } from "@/lib/range";
import { siteToday } from "@/lib/scene/replay";
import { parseDay, parseRange, stripRange } from "@/lib/solar/ranges";

// The range and the open day live in the address, so a link or a reload shows the same page, rendered with its data.
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const range = parseRange(params);
  const day = parseDay(params.day);
  const today = siteToday();
  if (!day) {
    return <SolarPage range={range} items={await rangeTotals(range.start, range.end)} today={today} initialStatus={latest()} />;
  }
  const strip = stripRange(range, day, today);
  const [data, items] = await Promise.all([dayIntervals(day), rangeTotals(strip.start, strip.end)]);
  return <SolarPage range={range} items={[]} today={today} initialStatus={latest()} day={{ data, strip: { range: strip, items } }} />;
}
