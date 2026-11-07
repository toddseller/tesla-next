export function Footer() {
  // The site's year, not the container's UTC one, which turns at 4 p.m. on New Year's Eve here.
  const year = new Date().toLocaleString("en-US", { year: "numeric", timeZone: "America/Los_Angeles" });
  return (
    <footer className="mt-auto border-t px-4 py-6 text-xs text-muted-foreground sm:px-8">
      © {year} teslasolar.report
    </footer>
  );
}
