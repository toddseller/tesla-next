import { ImpactPage } from "@/components/impact/impact-page";
import { backupHistory } from "@/lib/backup";
import { backupYear } from "@/lib/backup-years";
import { carCharging } from "@/lib/car-charging";
import { impactFigures } from "@/lib/impact";
import { readingsOf } from "@/lib/meter";
import { siteToday } from "@/lib/scene/replay";
import { parseRange } from "@/lib/solar/ranges";

// The range lives in the address, so a link or a reload shows the same page, rendered with its figures.
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const today = siteToday();
  const params = await searchParams;
  const range = parseRange(params, { start: today, end: today });
  const readings = readingsOf(params.readings);
  const year = backupYear(params.backup, today);
  const [figures, backup, charging] = await Promise.all([impactFigures(range.start, range.end, readings), backupHistory(year), carCharging(range.start, range.end, today, readings)]);
  return <ImpactPage range={range} figures={figures} today={today} backup={backup} backupYear={year} charging={charging} readings={readings} />;
}
