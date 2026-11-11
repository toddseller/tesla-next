import { dayIntervals } from "@/lib/intervals/intervals";
import { readingsOf } from "@/lib/meter";
import { dateError } from "@/lib/request-dates";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const day = params.get("date");
  const error = dateError("date", day);
  if (error) return Response.json({ message: error }, { status: 400 });
  return Response.json(await dayIntervals(day!, readingsOf(params.get("readings"))));
}
