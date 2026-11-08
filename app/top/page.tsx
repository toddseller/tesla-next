import { TopTenPage } from "@/components/top-ten/top-ten-page";
import { siteToday } from "@/lib/scene/replay";
import { topTen } from "@/lib/top-ten";

export default async function Page() {
  return <TopTenPage topTen={await topTen()} today={siteToday()} />;
}
