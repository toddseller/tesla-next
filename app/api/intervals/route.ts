import { dayIntervals } from "@/lib/intervals/intervals";
import { shiftDay, siteToday } from "@/lib/scene/replay";

export const dynamic = "force-dynamic";

// The site's dates, as anton-tesla-api-ws's parse_day sets them: the first day of service to two years ahead.
const FIRST_DAY = "2021-10-01";
const HORIZON_DAYS = 732;

function isCalendarDate(value: string) {
  const parsed = new Date(`${value}T00:00:00Z`);
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value);
}

const refuse = (message: string) => Response.json({ message }, { status: 400 });

export async function GET(request: Request) {
  const day = new URL(request.url).searchParams.get("date") ?? "";
  // Python's date.fromisoformat also reads 20261016 and week dates; the page only ever sends YYYY-MM-DD.
  if (!isCalendarDate(day)) return refuse("date is required as YYYY-MM-DD");
  const last = shiftDay(siteToday(), HORIZON_DAYS);
  if (day < FIRST_DAY || day > last) return refuse(`date must be from ${FIRST_DAY} to ${last}`);
  return Response.json(await dayIntervals(day));
}
