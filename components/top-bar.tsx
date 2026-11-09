"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { useLiveStream } from "@/components/use-live-stream";
import { type LiveStatus, liveStatus } from "@/lib/live-status";

const pages = [
  { name: "Solar", href: "/" },
  { name: "Impact", href: "/impact" },
  { name: "Distribution", href: "/distribution" },
  { name: "True-Up", href: "/true-up" },
  { name: "Top Ten", href: "/top" },
];

// The Powerwalls' live charge and state at the bar's end. `renderedAt` is when the server rendered the page with the
// status it held: the first render in the browser uses it too, so hydration finds the same text.
function Status({ initialStatus, renderedAt }: { initialStatus: string | null; renderedAt: number }) {
  const [status, setStatus] = useState<LiveStatus | null>(() => initialStatus && JSON.parse(initialStatus));
  const [now, setNow] = useState(() => new Date(renderedAt));
  useLiveStream({ onStatus: setStatus });
  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  const { live, word, time, pill } = liveStatus(status, now);
  return (
    <p data-part="live-status" className="order-2 flex w-full items-center gap-2.5 font-mono text-[13px] text-muted-foreground sm:order-3 sm:w-auto">
      <span data-part="dot" aria-hidden className={`size-2 rounded-full ${live ? "bg-powerwall" : "bg-muted-foreground"}`} />
      <span>{word} {time}</span>
      <span className="rounded-full border border-input px-2.5 py-1 text-foreground">{pill}</span>
    </p>
  );
}

export function TopBar({ initialStatus, renderedAt }: { initialStatus: string | null; renderedAt: number }) {
  const path = usePathname();
  return (
    <header className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b px-4 py-3 sm:px-8">
      <Link href="/" className="flex min-h-11 items-center gap-2.5 font-semibold tracking-wide">
        {/* The site's own icon, the sun behind the T, always in its own colors. */}
        <img src="/android-chrome-192x192.png" alt="" width={24} height={24} />
        Tesla Solar Report
      </Link>
      <nav aria-label="Pages" className="order-3 flex flex-1 flex-wrap gap-1 sm:order-2">
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
      <Status initialStatus={initialStatus} renderedAt={renderedAt} />
    </header>
  );
}
