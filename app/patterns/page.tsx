import { PatternsPage } from "@/components/patterns/patterns-page";
import { patterns } from "@/lib/patterns";
import { siteToday } from "@/lib/scene/replay";

export default async function Page() {
  const today = siteToday();
  return <PatternsPage patterns={await patterns(today)} today={today} />;
}
