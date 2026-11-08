import { ImpactPage } from "@/components/impact/impact-page";
import { impactFigures } from "@/lib/impact";
import { siteToday } from "@/lib/scene/replay";
import { parseRange } from "@/lib/solar/ranges";

// The range lives in the address, so a link or a reload shows the same page, rendered with its figures.
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const today = siteToday();
  const range = parseRange(await searchParams, { start: today, end: today });
  return <ImpactPage range={range} figures={await impactFigures(range.start, range.end)} today={today} />;
}
