"use client";

import { useEffect, useRef } from "react";

const REOPEN_MS = 5000;

type Handlers = {
  onStatus?: (status: Record<string, unknown>) => void;
  onTotals?: (date: string) => void;
  // The stream is back after it was lost, so anything sent meanwhile was missed.
  onReopen?: () => void;
};

// One /api/live stream for the page's life; the handlers may change on every render without reopening it.
export function useLiveStream(handlers: Handlers) {
  const current = useRef(handlers);
  current.current = handlers;
  useEffect(() => {
    let stream: EventSource;
    let reopen: ReturnType<typeof setTimeout> | undefined;
    let lost = false;
    const open = () => {
      stream = new EventSource("/api/live");
      stream.onopen = () => {
        if (lost) current.current.onReopen?.();
        lost = false;
      };
      stream.onmessage = (event) => current.current.onStatus?.(JSON.parse(event.data));
      stream.addEventListener("totals", (event) => current.current.onTotals?.(JSON.parse((event as MessageEvent).data).date));
      // The browser retries a dropped stream by itself, but gives up for good after any answer other than 200, such
      // as Cloudflare's 429 or a 502 while the tunnel reconnects, so the page opens a new one.
      stream.onerror = () => {
        lost = true;
        if (stream.readyState === EventSource.CLOSED) reopen = setTimeout(open, REOPEN_MS);
      };
    };
    open();
    return () => {
      clearTimeout(reopen);
      stream.close();
    };
  }, []);
}
