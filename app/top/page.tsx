import { TopTenPage } from "@/components/top-ten/top-ten-page";
import { siteToday } from "@/lib/scene/replay";
import { topTen } from "@/lib/top-ten";

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const withVpp = (await searchParams).vpp === "with";
  return <TopTenPage topTen={await topTen(withVpp)} withVpp={withVpp} today={siteToday()} />;
}
