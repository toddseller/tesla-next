import { ImpactPage } from "@/components/impact/impact-page";
import { backupHistory } from "@/lib/backup";
import { backupYear } from "@/lib/backup-years";
import { carCharging } from "@/lib/car-charging";
import { impactFigures } from "@/lib/impact";
import { readingsOf } from "@/lib/meter";
import { shiftDay, siteToday } from "@/lib/scene/replay";
import { comparedDays, parseRange } from "@/lib/solar/ranges";

// The range lives in the address, so a link or a reload shows the same page, rendered with its figures.
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const today = siteToday();
  const params = await searchParams;
  const readings = readingsOf(params.readings);
  const fallback = { start: today, end: today };
  const asked = parseRange(params, fallback);
  // With no range asked for, a day whose solar still reads 0.0 kWh would show nothing but grid; yesterday shows a whole day.
  const todays = asked === fallback ? await impactFigures(today, today, readings) : null;
  const yesterday = shiftDay(today, -1);
  const range = todays && todays.total_solar < 0.05 ? { start: yesterday, end: yesterday } : asked;
  const year = backupYear(params.backup, today);
  const earlier = comparedDays(range, today)?.then;
  const [figures, backup, charging, before] = await Promise.all([
    todays && range === asked ? todays : impactFigures(range.start, range.end, readings), backupHistory(year), carCharging(range.start, range.end, today, readings),
    earlier && impactFigures(earlier.start, earlier.end, readings),
  ]);
  return (
    <ImpactPage range={range} figures={figures} today={today} backup={backup} backupYear={year} charging={charging} readings={readings}
      before={before?.total_house ? before.self_powered_percentage : null} />
  );
}
