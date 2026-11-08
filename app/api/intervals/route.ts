import { dayIntervals } from "@/lib/intervals/intervals";
import { dateError } from "@/lib/request-dates";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const day = new URL(request.url).searchParams.get("date");
  const error = dateError("date", day);
  if (error) return Response.json({ message: error }, { status: 400 });
  return Response.json(await dayIntervals(day!));
}
