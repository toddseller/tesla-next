import { AlwaysOnSection } from "@/components/health/always-on";
import { PowerwallSection } from "@/components/health/powerwall-use";
import type { Health } from "@/lib/health";

export function HealthPage({ health, today }: { health: Health; today: string }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-0.5">
        <h1 className="text-[22px] font-semibold">Health</h1>
        <p className="text-sm text-muted-foreground">How the house and the Powerwalls run, month to month and year to year</p>
      </div>
      <AlwaysOnSection months={health.months} today={today} />
      <PowerwallSection years={health.years} today={today} />
    </div>
  );
}
