import { siteToday } from "@/lib/scene/replay";
import { trueUpYears } from "@/lib/true-up/reads";

export const dynamic = "force-dynamic";

// Answers as Flask's /api/v2/true_up_years does, so scripts/compare-true-up.mjs can check the port until cutover.
export async function GET() {
  return Response.json({ data: await trueUpYears(siteToday()) });
}
