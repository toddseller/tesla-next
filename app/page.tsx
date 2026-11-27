import { permanentRedirect } from "next/navigation";

import { Habits } from "@/components/home/habits";
import { Now } from "@/components/home/now";
import { PickADay } from "@/components/home/pick-a-day";
import { Records } from "@/components/home/records";
import { Since } from "@/components/home/since";
import { Today } from "@/components/home/today";
import { Year } from "@/components/home/year";
import { forecast, forecastCard } from "@/lib/forecast";
import { solarHours } from "@/lib/home/solar-hours";
import { impactByMonth, impactFigures } from "@/lib/impact";
import { dayIntervals } from "@/lib/intervals/intervals";
import { latest } from "@/lib/live";
import { latestFigures, patterns } from "@/lib/patterns";
import { recordTabs } from "@/lib/home/records";
import { longDate } from "@/lib/calendar-dates";
import { FIRST_DAY, siteToday } from "@/lib/scene/replay";
import { recordSeries, topTen } from "@/lib/top-ten";
import { cycleRows, trueUpCost } from "@/lib/true-up/cost";
import { payback } from "@/lib/true-up/payback";
import { trueUpYears } from "@/lib/true-up/reads";
import { cyclesShare } from "@/lib/true-up/share";
import { owedRange, startedCycles, totals } from "@/lib/true-up/text";

type Params = Record<string, string | string[] | undefined>;

// Addresses from before the Solar page moved to /solar keep showing the same view.
const SOLAR_PARAMS = ["start", "end", "day", "readings"];
const FIRST_YEAR = Number(FIRST_DAY.slice(0, 4));
// The home page reads as each linked page opens, on corrected readings.
const READINGS = "corrected";

export default async function Page({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  if (SOLAR_PARAMS.some((name) => params[name] !== undefined)) {
    const query = new URLSearchParams(Object.entries(params).flatMap(([name, value]) => (Array.isArray(value) ? value.map((v) => [name, v]) : value === undefined ? [] : [[name, value]])));
    permanentRedirect(`/solar?${query}`);
  }
  const today = siteToday();
  const thisYear = Number(today.slice(0, 4));
  const asked = Number(params.year);
  const year = Number.isInteger(asked) && asked >= FIRST_YEAR && asked <= thisYear ? asked : thisYear;
  const yearEnd = year === thisYear ? today : `${year}-12-31`;
  const [stored, day, hours, shares, rankings, series, house, months, sinceFigures, trueUp, paidBack] = await Promise.all([
    forecast(today), dayIntervals(today, READINGS), solarHours(year, today), impactFigures(`${year}-01-01`, yearEnd, READINGS),
    topTen(false, READINGS), recordSeries(false, READINGS), patterns(today, READINGS), impactByMonth(FIRST_DAY, today, READINGS),
    impactFigures(FIRST_DAY, today, READINGS),
    trueUpYears(today).then(async (years) => {
      const current = years.at(-1)!;
      const rows = cycleRows(current.start_date, current.end_date);
      const [cycles, cost, share] = await Promise.all([rows, trueUpCost(current.start_date, current.end_date, today), rows.then(cyclesShare).then((explained) => explained?.share ?? null)]);
      return { end: current.end_date, net: totals(startedCycles(cycles)).net, share, owed: owedRange(cost) };
    }),
    payback(today),
  ]);

  return (
    <div className="flex flex-col">
      <h1 className="max-w-[48ch] pb-4 text-base font-medium text-balance md:pt-2 md:pb-10 md:text-xl">
        {`One home's 12.24 kW of Tesla solar and three Powerwalls, live and recorded since ${longDate(FIRST_DAY)}.`}
      </h1>
      <Now initialStatus={latest()} renderedAt={Date.now()} />
      {/* Today sits closer to Now on a phone, so its first figure still makes the first screen (home-story spec). */}
      {[
        <Today key="today" today={today} forecast={forecastCard(stored, today, Date.now())} day={day} renderedAt={Date.now()} />,
        <Year key="year" year={year} today={today} days={hours} shares={shares} />,
        <Records key="records" today={today} tabs={recordTabs(rankings, series)} record={String(params.record)} />,
        <Habits key="habits" today={today} months={house.months} figures={latestFigures(house.months, today)} />,
        <Since key="since" today={today} months={months} solar={sinceFigures.total_solar} matched={sinceFigures.total_solar_percentage}
          net={trueUp.net} share={trueUp.share} owed={trueUp.owed} trueUpEnd={trueUp.end} payback={paidBack} />,
        <PickADay key="pick" today={today} />,
      ].map((chapter, i) => <div key={chapter.key} className={`${i === 0 ? "mt-3" : "mt-8"} border-t pt-8 md:mt-20 md:pt-20`}>{chapter}</div>)}
    </div>
  );
}
