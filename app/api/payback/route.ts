import { siteToday } from "@/lib/scene/replay";
import { payback } from "@/lib/true-up/payback";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ data: await payback(siteToday()) });
}
