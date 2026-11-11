import { readingsOf } from "@/lib/meter";
import { rangeTotals } from "@/lib/range";
import { dateError } from "@/lib/request-dates";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const [start, end] = [params.get("start_date"), params.get("end_date")];
  const error = dateError("start_date", start) ?? dateError("end_date", end);
  if (error) return Response.json({ message: error }, { status: 400 });
  return Response.json({ data: await rangeTotals(start!, end!, readingsOf(params.get("readings"))) });
}
