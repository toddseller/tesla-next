import { BillSection } from "@/components/admin/bill-section";
import { PayoutSection } from "@/components/admin/payout-section";
import { VppSection } from "@/components/admin/vpp-section";
import { owner } from "@/lib/admin/access";
import { billYears, storedBill } from "@/lib/admin/statement";
import { currentSeason, latestPayout, vppDays } from "@/lib/admin/vpp";
import { siteToday } from "@/lib/scene/replay";
import { FIRST_SEASON } from "@/lib/true-up/cost";
import { trueUpEndYear, trueUpLabel } from "@/lib/true-up/reads";

// The owner's page, linked from nowhere. Nothing is read before the owner check, which answers not found otherwise.
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await owner();
  const today = siteToday();
  const current = await trueUpEndYear(today);
  const years = [...new Set([current, ...(await billYears())])].sort((a, b) => b - a);
  const asked = Number((await searchParams).year);
  const year = years.includes(asked) ? asked : current;
  const season = currentSeason(today);
  const [{ cycles, amountDue }, days, latest] = await Promise.all([storedBill(year), vppDays(season), latestPayout()]);
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-0.5">
        <h1 className="text-[22px] font-semibold">Admin</h1>
        <p className="text-sm text-muted-foreground">Figures the site can&apos;t fetch on its own</p>
      </div>
      <BillSection years={years.map((y) => ({ year: y, label: trueUpLabel(y) }))} year={year} cycles={cycles} amountDue={amountDue} />
      <VppSection season={season} today={today} days={days} />
      <PayoutSection seasons={Array.from({ length: season - FIRST_SEASON + 1 }, (_, i) => FIRST_SEASON + i)} today={today} latest={latest} />
    </div>
  );
}
