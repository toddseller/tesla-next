import { topTen } from "@/lib/top-ten";

export const dynamic = "force-dynamic";

// Without a parameter it answers as Flask's /api/v2/top_ten does, so scripts/compare-top-ten.mjs can check the port until 7b.
export async function GET(request: Request) {
  return Response.json({ data: await topTen(new URL(request.url).searchParams.get("vpp") !== "without") });
}
