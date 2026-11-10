import { HealthPage } from "@/components/health/health-page";
import { health } from "@/lib/health";
import { siteToday } from "@/lib/scene/replay";

export default async function Page() {
  return <HealthPage health={await health()} today={siteToday()} />;
}
