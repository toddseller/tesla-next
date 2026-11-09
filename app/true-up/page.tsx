import { TrueUpPage } from "@/components/true-up/true-up-page";
import { siteToday } from "@/lib/scene/replay";
import { parseRange } from "@/lib/solar/ranges";
import { cycleRows, trueUpCost } from "@/lib/true-up/cost";
import { payback } from "@/lib/true-up/payback";
import { trueUpSavings } from "@/lib/true-up/savings";
import { trueUpYears } from "@/lib/true-up/reads";

// The range lives in the address, so a link or a reload shows the same page, rendered with its data. The current true-up
// year turns over on the October read, as PG&E's billing does.
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const today = siteToday();
  const years = await trueUpYears(today);
  const current = years.at(-1)!;
  const range = parseRange(await searchParams, { start: current.start_date, end: current.end_date });
  const year = years.some((y) => y.start_date === range.start && y.end_date === range.end);
  const [cycles, cost, savings, paidBack] = await Promise.all([
    cycleRows(range.start, range.end),
    year ? trueUpCost(range.start, range.end, today) : null,
    year ? trueUpSavings(range.start, range.end) : null,
    payback(today),
  ]);
  return <TrueUpPage range={range} years={years} cycles={cycles} cost={cost} savings={savings} payback={paidBack} today={today} />;
}
