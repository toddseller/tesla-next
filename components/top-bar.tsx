"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { useLiveStream } from "@/components/use-live-stream";
import { Rolling } from "@/components/rolling";
import { gridPill, type LiveStatus, liveStatus, type SiteState } from "@/lib/live-status";

const pages = [
  { name: "Solar", href: "/" },
  { name: "Impact", href: "/impact" },
  { name: "Distribution", href: "/distribution" },
  { name: "True-Up", href: "/true-up" },
  { name: "Top Ten", href: "/top" },
  { name: "Patterns", href: "/patterns" },
];

const PILL_STYLES = {
  outage: "border-primary text-foreground",
  storm: "border-solar text-solar",
  test: "border-dashed border-muted-foreground text-foreground",
};

type Props = { initialStatus: string | null; initialSite: string | null; renderedAt: number };

// The Powerwalls' live charge and state at the bar's end, after an off-grid or storm watch pill when there is one.
// `renderedAt` is when the server rendered the page with the status it held: the first render in the browser uses it
// too, so hydration finds the same text.
function Status({ initialStatus, initialSite, renderedAt }: Props) {
  const [status, setStatus] = useState<LiveStatus | null>(() => initialStatus && JSON.parse(initialStatus));
  const [site, setSite] = useState<SiteState | null>(() => initialSite && JSON.parse(initialSite));
  const [now, setNow] = useState(() => new Date(renderedAt));
  const [received, setReceived] = useState(0);
  useLiveStream({
    onStatus: (next) => {
      setStatus(next);
      setReceived((count) => count + 1);
    },
    onSiteState: setSite,
  });
  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  const { live, word, time, pill } = liveStatus(status, now);
  const grid = gridPill(status, site);
  return (
    <p data-part="live-status" className="order-2 flex w-full flex-wrap items-center gap-2.5 font-mono text-[13px] whitespace-nowrap text-muted-foreground sm:order-3 sm:w-auto">
      <span aria-hidden className="relative size-2">
        <span data-part="dot" className={`absolute inset-0 rounded-full ${live ? "bg-powerwall" : "bg-muted-foreground"}`} />
        {/* Keyed by the count, so each status mounts a new ring that plays once. */}
        {received > 0 && <span key={received} data-part="dot-ring" className={`motion-ring absolute inset-0 rounded-full ${live ? "bg-powerwall" : "bg-muted-foreground"}`} />}
      </span>
      <span>{word} {time}</span>
      {grid && (
        <span data-part="grid-pill" className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${PILL_STYLES[grid.kind]}`}>
          {grid.kind === "outage" && <span aria-hidden className="size-1.5 rounded-full bg-primary" />}
          {grid.text}
        </span>
      )}
      <span data-part="pill" className="rounded-full border border-input px-2.5 py-1 text-foreground">
        {status?.battery_percentage == null ? pill : (
          <Rolling value={status.battery_percentage} format={(charge) => liveStatus({ ...status, battery_percentage: Math.round(charge) }, now).pill} />
        )}
      </span>
    </p>
  );
}

export function TopBar({ initialStatus, initialSite, renderedAt }: Props) {
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
      <Status initialStatus={initialStatus} initialSite={initialSite} renderedAt={renderedAt} />
    </header>
  );
}
