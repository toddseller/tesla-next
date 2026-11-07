export function NotMovedYet({ name, path }: { name: string; path: string }) {
  return (
    <section className="flex flex-col gap-3">
      <h1 className="text-xl font-semibold">{name}</h1>
      <p className="text-muted-foreground">This page hasn&apos;t moved here yet.</p>
      <a href={`https://teslasolar.report${path}`} className="w-fit underline underline-offset-4 hover:text-white">
        Open {name} on teslasolar.report
      </a>
    </section>
  );
}
