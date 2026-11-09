import { backupHistory } from "@/lib/backup";
import { backupYear } from "@/lib/backup-years";
import { siteToday } from "@/lib/scene/replay";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const year = backupYear(new URL(request.url).searchParams.get("year"), siteToday());
  return Response.json({ data: await backupHistory(year) });
}
