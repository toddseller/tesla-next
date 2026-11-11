import { TopTenPage } from "@/components/top-ten/top-ten-page";
import { readingsOf } from "@/lib/meter";
import { siteToday } from "@/lib/scene/replay";
import { topTen } from "@/lib/top-ten";

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const withVpp = params.vpp === "with";
  const readings = readingsOf(params.readings);
  return <TopTenPage topTen={await topTen(withVpp, readings)} withVpp={withVpp} today={siteToday()} readings={readings} />;
}
