import { solarHours } from "@/lib/home/solar-hours";
import { FIRST_DAY, siteToday } from "@/lib/scene/replay";

export const dynamic = "force-dynamic";

const FIRST_YEAR = Number(FIRST_DAY.slice(0, 4));

export async function GET(request: Request) {
  const today = siteToday();
  const year = Number(new URL(request.url).searchParams.get("year") || NaN);
  if (!Number.isInteger(year) || year < FIRST_YEAR || year > Number(today.slice(0, 4))) {
    return Response.json({ message: `year must be ${FIRST_YEAR} to ${today.slice(0, 4)}` }, { status: 400 });
  }
  return Response.json({ data: await solarHours(year, today) });
}
