import Distribution from "@/components/scene/distribution";
import { latest } from "@/lib/live";

// The latest live status the server holds is rendered into the page, so its labels show values before any script runs.
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const search = Object.fromEntries(
    Object.entries(await searchParams).flatMap(([name, value]) => (typeof value === "string" ? [[name, value]] : [])),
  );
  return <Distribution initialStatus={latest()} search={search} renderedAt={Date.now()} />;
}
