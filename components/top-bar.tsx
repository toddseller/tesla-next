"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, ViewTransition } from "react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { useLiveStream } from "@/components/use-live-stream";
import { slidePage } from "@/components/page-slide";
import { Rolling } from "@/components/rolling";
import { gridPill, type LiveStatus, liveStatus, type SiteState } from "@/lib/live-status";
import { kw } from "@/lib/scene/live-scene";

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

// The live pill (solar, home and the Powerwalls) at the bar's end, after an off-grid or storm watch pill when there is one.
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
  const { live, word, time, pill, solar, home } = liveStatus(status, now);
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
        {/* Left out below 1360 px: on a phone the pill doesn't fit under the brand, and on a laptop it wraps the links. */}
        {([["SOLAR", solar, "bg-solar"], ["HOME", home, "bg-home"]] as const).map(([name, value, color]) => value != null && (
          <span key={name} data-part="flow" className="max-[1360px]:hidden">
            <span data-part="swatch" aria-hidden="true" className={`mr-1.5 inline-block size-2 rounded-[2px] align-middle ${color}`} />
            {name} <Rolling value={value} format={kw} />{" · "}
          </span>
        ))}
        {status?.battery_percentage == null ? pill : (
          <Rolling value={status.battery_percentage} format={(charge) => liveStatus({ ...status, battery_percentage: Math.round(charge) }, now).pill} />
        )}
      </span>
    </p>
  );
}

// The page takes a moment to come from the server, so the chosen tab brightens at once; it becomes current, with the
// highlight and aria-current, only when the page arrives.
function TabName({ name }: { name: string }) {
  const { pending } = useLinkStatus();
  return <span data-part="name" className={`relative ${pending ? "text-white" : ""}`}>{name}</span>;
}

// Below 640 px the links move behind a button; choosing one closes the menu as the page starts to slide.
function PageMenu({ path, slideTo }: { path: string; slideTo: (i: number) => (() => void) | undefined }) {
  const [open, setOpen] = useState(false);
  return (
    <nav aria-label="Pages" className="order-1 ml-auto sm:hidden">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger aria-label="Pages" className="relative flex size-11 items-center justify-center rounded-lg border border-input bg-card data-[state=open]:border-ring">
          <span aria-hidden className="motion-burger absolute h-0.5 w-[18px] rounded-full bg-current" />
          <span aria-hidden className="motion-burger absolute h-0.5 w-[18px] rounded-full bg-current" />
          <span aria-hidden className="motion-burger absolute h-0.5 w-[18px] rounded-full bg-current" />
        </PopoverTrigger>
        <PopoverContent aria-label="Pages" align="end" className="flex w-48 flex-col gap-0.5 border-input p-1 shadow-xl shadow-black/45">
          {pages.map(({ name, href }, i) => {
            const current = path === href;
            const slide = slideTo(i);
            return (
              <Link key={href} href={href} aria-current={current ? "page" : undefined}
                onNavigate={() => { slide?.(); setOpen(false); }}
                className={`flex min-h-11 items-center rounded-md px-3 text-[15px] ${current ? "bg-secondary text-white shadow-[inset_0_-2px_0_var(--primary)]" : "hover:bg-secondary"}`}>
                {name}
              </Link>
            );
          })}
        </PopoverContent>
      </Popover>
    </nav>
  );
}

export function TopBar({ initialStatus, initialSite, renderedAt }: Props) {
  const path = usePathname();
  const here = pages.findIndex((page) => page.href === path);
  const slideTo = (i: number) => (i === here ? undefined : () => slidePage(i > here ? "next" : "previous"));
  return (
    <header className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b px-4 py-3 sm:px-8">
      <Link href="/" className="flex min-h-11 items-center gap-2.5 font-semibold tracking-wide">
        {/* The site's own icon, the sun behind the T, always in its own colors. */}
        <img src="/android-chrome-192x192.png" alt="" width={24} height={24} />
        Tesla Solar Report
      </Link>
      <PageMenu path={path} slideTo={slideTo} />
      <nav aria-label="Pages" className="order-3 flex flex-1 flex-wrap gap-1 max-sm:hidden sm:order-2">
        {pages.map(({ name, href }, i) => {
          const current = path === href;
          return (
            <Link
              key={href}
              href={href}
              aria-current={current ? "page" : undefined}
              onNavigate={slideTo(i)}
              className={`relative flex min-h-11 items-center rounded-md px-3 text-sm ${current ? "text-white" : "text-muted-foreground hover:text-foreground"}`}
            >
              {/* One name across pages, so the browser glides it from the old tab to the new one as the page arrives. */}
              {current && (
                <ViewTransition name="nav-highlight">
                  <span aria-hidden className="absolute inset-0 rounded-md bg-secondary shadow-[inset_0_-2px_0_var(--primary)]" />
                </ViewTransition>
              )}
              <TabName name={name} />
            </Link>
          );
        })}
      </nav>
      <Status initialStatus={initialStatus} initialSite={initialSite} renderedAt={renderedAt} />
    </header>
  );
}
