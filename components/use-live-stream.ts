"use client";

import { type RefObject, useEffect, useRef } from "react";

import type { SiteState } from "@/lib/live-status";

const REOPEN_MS = 5000;

type Handlers = {
  onStatus?: (status: Record<string, unknown>) => void;
  onTotals?: (date: string) => void;
  onOutages?: () => void;
  // The site's open state stretch, null when there is none.
  onSiteState?: (stretch: SiteState | null) => void;
  // The stream is back after it was lost, so anything sent meanwhile was missed.
  onReopen?: () => void;
};

// One /api/live stream per tab, shared by everything listening: the top bar and the page both listen, and two streams
// would double each tab's connections through Cloudflare. It opens with the first listener and closes with the last.
const listeners = new Set<RefObject<Handlers>>();
let stream: EventSource | null = null;
let reopen: ReturnType<typeof setTimeout> | undefined;
let lost = false;

const each = (call: (handlers: Handlers) => void) => listeners.forEach((listener) => call(listener.current));

function open() {
  stream = new EventSource("/api/live");
  stream.onopen = () => {
    if (lost) each((on) => on.onReopen?.());
    lost = false;
  };
  stream.onmessage = (event) => {
    const status = JSON.parse(event.data);
    each((on) => on.onStatus?.(status));
  };
  stream.addEventListener("outages", () => each((on) => on.onOutages?.()));
  stream.addEventListener("site_state", (event) => {
    const stretch = JSON.parse((event as MessageEvent).data);
    each((on) => on.onSiteState?.(stretch));
  });
  stream.addEventListener("totals", (event) => {
    const { date } = JSON.parse((event as MessageEvent).data);
    each((on) => on.onTotals?.(date));
  });
  // The browser retries a dropped stream by itself, but gives up for good after any answer other than 200, such as
  // Cloudflare's 429 or a 502 while the tunnel reconnects, so a new one is opened.
  stream.onerror = () => {
    lost = true;
    if (stream?.readyState === EventSource.CLOSED) reopen = setTimeout(open, REOPEN_MS);
  };
}

function close() {
  clearTimeout(reopen);
  stream?.close();
  stream = null;
  lost = false;
}

// The handlers may change on every render without reopening the stream.
export function useLiveStream(handlers: Handlers) {
  const current = useRef(handlers);
  current.current = handlers;
  useEffect(() => {
    listeners.add(current);
    if (!stream) open();
    return () => {
      listeners.delete(current);
      if (!listeners.size) close();
    };
  }, []);
}
