import { latest, siteState, subscribe } from "@/lib/live";

export const dynamic = "force-dynamic";

// Cloudflare closes a stream idle for about 100 seconds.
const PING_MS = 25_000;
const EVENTS: Record<string, string> = { totals_updated: "totals", outages_updated: "outages", site_state_updated: "site_state" };

// shortcut: open streams aren't capped; each costs a socket and a timer, fine for the site's handful of viewers. Cap them if it ever gets heavy traffic.
export function GET(request: Request) {
  const encoder = new TextEncoder();
  let stop = () => {};
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (text: string) => controller.enqueue(encoder.encode(text));
      // EventSource keeps retrying only after a 200, and Next.js holds the headers until the first bytes.
      send("retry: 5000\n: open\n\n");
      // anton's scheduler sends each status as one line of JSON, so one data field carries a whole status.
      const now = latest();
      if (now !== null) send(`data: ${now}\n\n`);
      const site = siteState();
      if (site !== null) send(`event: site_state\ndata: ${site}\n\n`);
      // Everything but live status gets an event name, so a page listens for each apart.
      const unsubscribe = subscribe((payload, channel) => send(EVENTS[channel] ? `event: ${EVENTS[channel]}\ndata: ${payload}\n\n` : `data: ${payload}\n\n`));
      const ping = setInterval(() => send(": ping\n\n"), PING_MS);
      stop = () => {
        clearInterval(ping);
        unsubscribe();
      };
      // Not closed here: the request is over, and the page may already have cancelled the stream, which makes close throw.
      request.signal.addEventListener("abort", stop);
    },
    cancel() {
      stop();
    },
  });
  return new Response(body, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform", "X-Accel-Buffering": "no" },
  });
}
