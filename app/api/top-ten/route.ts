import { topTen } from "@/lib/top-ten";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return Response.json({ data: await topTen(new URL(request.url).searchParams.get("vpp") === "with") });
}
