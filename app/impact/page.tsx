import { cache } from "react";

import { ImpactPage } from "@/components/impact/impact-page";
import { backupHistory } from "@/lib/backup";
import { backupYear } from "@/lib/backup-years";
import { carCharging } from "@/lib/car-charging";
import { impactFigures } from "@/lib/impact";
import { type Readings, readingsOf } from "@/lib/meter";
import { shiftDay, siteToday } from "@/lib/scene/replay";
import { comparedDays, dropUnshown, parseRange, rangeTitle } from "@/lib/solar/ranges";

type Params = Record<string, string | string[] | undefined>;

// The title and the page read the date once per request, so a request at the site's midnight can't name two days.
const requestToday = cache(() => siteToday());

// The title and the page each need today's figures to pick the range; keyed by strings, they share one query per request.
const todaysFigures = cache((today: string, readings: Readings) => impactFigures(today, today, readings));

async function shownRange(params: Params, today: string) {
  const readings = readingsOf(params.readings);
  const fallback = { start: today, end: today };
  const asked = parseRange(params, fallback);
  // With no range asked for, a day whose solar still reads 0.0 kWh would show nothing but grid; yesterday shows a whole day.
  const todays = asked === fallback ? await todaysFigures(today, readings) : null;
  const yesterday = shiftDay(today, -1);
  const range = todays && todays.total_solar < 0.05 ? { start: yesterday, end: yesterday } : asked;
  return { readings, todays: range === asked ? todays : null, range };
}

export async function generateMetadata({ searchParams }: { searchParams: Promise<Params> }) {
  return { title: `Impact · ${rangeTitle((await shownRange(await searchParams, requestToday())).range)}` };
}

// The range lives in the address, so a link or a reload shows the same page, rendered with its figures.
export default async function Page({ searchParams }: { searchParams: Promise<Params> }) {
  const today = requestToday();
  const params = await searchParams;
  dropUnshown("/impact", params, false);
  const { readings, todays, range } = await shownRange(params, today);
  const year = backupYear(params.backup, today);
  const earlier = comparedDays(range, today)?.then;
  const [figures, backup, charging, before] = await Promise.all([
    todays ?? impactFigures(range.start, range.end, readings), backupHistory(year), carCharging(range.start, range.end, today, readings),
    earlier && impactFigures(earlier.start, earlier.end, readings),
  ]);
  return (
    <ImpactPage range={range} figures={figures} today={today} backup={backup} backupYear={year} charging={charging} readings={readings}
      before={before?.total_house ? before.self_powered_percentage : null} />
  );
}
