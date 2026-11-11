import { PatternsPage } from "@/components/patterns/patterns-page";
import { readingsOf } from "@/lib/meter";
import { patterns } from "@/lib/patterns";
import { siteToday } from "@/lib/scene/replay";

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const today = siteToday();
  const readings = readingsOf((await searchParams).readings);
  return <PatternsPage patterns={await patterns(today, readings)} today={today} readings={readings} />;
}
