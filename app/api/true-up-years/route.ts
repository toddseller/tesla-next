import { siteToday } from "@/lib/scene/replay";
import { trueUpYears } from "@/lib/true-up/reads";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ data: await trueUpYears(siteToday()) });
}
