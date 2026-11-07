"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const pages = [
  { name: "Solar", href: "/" },
  { name: "Impact", href: "/impact" },
  { name: "Distribution", href: "/distribution" },
  { name: "True-Up", href: "/true-up" },
  { name: "Top Ten", href: "/top" },
];

export function TopBar() {
  const path = usePathname();
  return (
    <header className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b px-4 py-3 sm:px-8">
      <Link href="/" className="flex min-h-11 items-center gap-2.5 font-semibold tracking-wide">
        {/* The site's own icon, the sun behind the T, always in its own colors. */}
        <img src="/android-chrome-192x192.png" alt="" width={24} height={24} />
        Tesla Solar Report
      </Link>
      <nav aria-label="Pages" className="flex flex-wrap gap-1">
        {pages.map(({ name, href }) => {
          const current = path === href;
          return (
            <Link
              key={href}
              href={href}
              aria-current={current ? "page" : undefined}
              className={`flex min-h-11 items-center rounded-md px-3 text-sm ${
                current ? "bg-secondary text-white shadow-[inset_0_-2px_0_var(--primary)]" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {name}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
