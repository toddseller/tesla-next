"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { PAGES } from "@/lib/pages";

export function Footer() {
  const path = usePathname();
  // The site's year, not the container's UTC one, which turns at 4 p.m. on New Year's Eve here.
  const year = new Date().toLocaleString("en-US", { year: "numeric", timeZone: "America/Los_Angeles" });
  return (
    <footer className="mt-auto flex flex-wrap items-center justify-between gap-x-8 gap-y-3 border-t px-4 py-6 text-xs text-muted-foreground sm:px-8">
      <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-1">
        {PAGES.map(({ name, href }) => (
          <Link key={href} href={href} aria-current={path === href ? "page" : undefined}
            className={`flex min-h-11 items-center ${path === href ? "text-foreground" : "hover:text-foreground"}`}>{name}</Link>
        ))}
      </nav>
      <p>© {year} teslasolar.report</p>
    </footer>
  );
}
