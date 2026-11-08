import { topTen } from "@/lib/top-ten";

export const dynamic = "force-dynamic";

// Answers as Flask's /api/v2/top_ten does, so scripts/compare-top-ten.mjs can check the port until cutover.
export async function GET() {
  return Response.json({ data: await topTen() });
}
