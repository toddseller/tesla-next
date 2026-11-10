import { forecast, forecastCard } from "@/lib/forecast";
import { siteToday } from "@/lib/scene/replay";

export const dynamic = "force-dynamic";

export async function GET() {
  const today = siteToday();
  return Response.json({ data: forecastCard(await forecast(today), today, Date.now()) });
}
