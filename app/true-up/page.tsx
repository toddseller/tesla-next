import { cache } from "react";

import { TrueUpPage } from "@/components/true-up/true-up-page";
import { siteToday } from "@/lib/scene/replay";
import { dropUnshown, parseRange, rangeTitle } from "@/lib/solar/ranges";
import { cycleRows, trueUpCost } from "@/lib/true-up/cost";
import { payback } from "@/lib/true-up/payback";
import { trueUpSavings } from "@/lib/true-up/savings";
import { trueUpYears } from "@/lib/true-up/reads";

type Params = Record<string, string | string[] | undefined>;

// The title and the page read the date once per request, so a request at the site's midnight can't name two days.
const requestToday = cache(() => siteToday());

// The title and the page each need the years; keyed by today's date, they share one query per request.
const yearsOf = cache(trueUpYears);

async function shownRange(params: Params, today: string) {
  const years = await yearsOf(today);
  const current = years.at(-1)!;
  return { years, range: parseRange(params, { start: current.start_date, end: current.end_date }) };
}

export async function generateMetadata({ searchParams }: { searchParams: Promise<Params> }) {
  return { title: `True-Up · ${rangeTitle((await shownRange(await searchParams, requestToday())).range)}` };
}

// The range lives in the address, so a link or a reload shows the same page, rendered with its data. The current true-up
// year turns over on the October read, as PG&E's billing does.
export default async function Page({ searchParams }: { searchParams: Promise<Params> }) {
  const today = requestToday();
  const params = await searchParams;
  dropUnshown("/true-up", params, false);
  const { years, range } = await shownRange(params, today);
  const shown = years.findIndex((y) => y.start_date === range.start && y.end_date === range.end);
  const year = shown >= 0;
  // A finished year's headline compares it with the year before.
  const previous = year && !years[shown].current ? years[shown - 1] : undefined;
  const [cycles, cost, savings, paidBack, previousCost] = await Promise.all([
    cycleRows(range.start, range.end),
    year ? trueUpCost(range.start, range.end, today) : null,
    year ? trueUpSavings(range.start, range.end) : null,
    payback(today),
    previous ? trueUpCost(previous.start_date, previous.end_date, today) : null,
  ]);
  return (
    <TrueUpPage range={range} years={years} cycles={cycles} cost={cost} savings={savings} payback={paidBack} today={today}
      before={previous && previousCost && { label: previous.label, amount_due: previousCost.amount_due }} />
  );
}
