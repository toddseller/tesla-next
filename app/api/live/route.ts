import { latest, subscribe } from "@/lib/live";

export const dynamic = "force-dynamic";

// Cloudflare closes a stream idle for about 100 seconds.
const PING_MS = 25_000;

// shortcut: open streams aren't capped; each costs a socket and a timer, fine for the site's handful of viewers. Cap them if it ever gets heavy traffic.
export function GET(request: Request) {
  const encoder = new TextEncoder();
  let stop = () => {};
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (text: string) => controller.enqueue(encoder.encode(text));
      // EventSource keeps retrying only after a 200, and Next.js holds the headers until the first bytes.
      send("retry: 5000\n: open\n\n");
      // Flask's json.dumps writes one line, so one data field carries a whole status.
      const now = latest();
      if (now !== null) send(`data: ${now}\n\n`);
      // Totals get an event name, so a page listens for them apart from live status.
      const unsubscribe = subscribe((payload, channel) => send(channel === "totals_updated" ? `event: totals\ndata: ${payload}\n\n` : `data: ${payload}\n\n`));
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
