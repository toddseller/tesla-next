import { AlwaysOnSection } from "@/components/patterns/always-on";
import { HouseUseSection } from "@/components/patterns/house-use";
import { PowerwallSection } from "@/components/patterns/powerwall-use";
import type { Patterns } from "@/lib/patterns";

export function PatternsPage({ patterns, today }: { patterns: Patterns; today: string }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-0.5">
        <h1 className="text-[22px] font-semibold">Patterns</h1>
        <p className="text-sm text-muted-foreground">How the house and the Powerwalls run, month to month and year to year</p>
      </div>
      <AlwaysOnSection months={patterns.months} today={today} />
      <HouseUseSection hours={patterns.hours} today={today} />
      <PowerwallSection years={patterns.years} today={today} />
    </div>
  );
}
