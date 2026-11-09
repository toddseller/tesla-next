import { dateError } from "@/lib/request-dates";
import { trueUpSavings } from "@/lib/true-up/savings";

export const dynamic = "force-dynamic";

// The True-Up Tracker's savings card reloads through this route when new totals arrive.
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const [start, end] = [params.get("start_date"), params.get("end_date")];
  const error = dateError("start_date", start) ?? dateError("end_date", end);
  if (error) return Response.json({ message: error }, { status: 400 });
  return Response.json({ data: await trueUpSavings(start!, end!) });
}
