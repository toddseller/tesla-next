import { dateError } from "@/lib/request-dates";
import { siteToday } from "@/lib/scene/replay";
import { trueUpCost } from "@/lib/true-up/cost";

export const dynamic = "force-dynamic";

// Answers as Flask's /api/v2/true_up_cost does, so scripts/compare-true-up.mjs can check the port until cutover.
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const [start, end] = [params.get("start_date"), params.get("end_date")];
  const error = dateError("start_date", start) ?? dateError("end_date", end);
  if (error) return Response.json({ message: error }, { status: 400 });
  return Response.json({ data: await trueUpCost(start!, end!, siteToday()) });
}
