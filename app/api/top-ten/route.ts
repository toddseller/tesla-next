import { readingsOf } from "@/lib/meter";
import { topTen } from "@/lib/top-ten";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  return Response.json({ data: await topTen(params.get("vpp") === "with", readingsOf(params.get("readings"))) });
}
