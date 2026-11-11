import { AlwaysOnSection } from "@/components/patterns/always-on";
import { HouseUseSection } from "@/components/patterns/house-use";
import { PowerwallSection } from "@/components/patterns/powerwall-use";
import { ReadingsNote, ReadingsSwitch } from "@/components/readings-switch";
import { type Readings, withReadings } from "@/lib/meter";
import type { Patterns } from "@/lib/patterns";

export function PatternsPage({ patterns, today, readings }: { patterns: Patterns; today: string; readings: Readings }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-[22px] font-semibold">Patterns</h1>
          <p className="text-sm text-muted-foreground">How the house and the Powerwalls run, month to month and year to year</p>
        </div>
        <ReadingsSwitch readings={readings} addresses={{ corrected: "/patterns", tesla: withReadings("/patterns", "tesla") }} />
      </div>
      <AlwaysOnSection months={patterns.months} today={today} />
      <HouseUseSection hours={patterns.hours} today={today} />
      <PowerwallSection years={patterns.years} today={today} />
      <ReadingsNote readings={readings} />
    </div>
  );
}
