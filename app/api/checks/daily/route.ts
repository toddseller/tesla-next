import { peakCheck } from "@/lib/checks";
import { siteToday } from "@/lib/scene/replay";

export const dynamic = "force-dynamic";

export async function GET() {
  return new Response(`${await peakCheck(siteToday())}\n`, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
