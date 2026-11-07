import { Client } from "pg";
import { sseFrame } from "@/lib/sse";

export const dynamic = "force-dynamic";

const encoder = new TextEncoder();
const streams = new Set<ReadableStreamDefaultController<Uint8Array>>();
let listening: Promise<void> | undefined;

const broadcast = (text: string) => streams.forEach((stream) => stream.enqueue(encoder.encode(text)));

// One connection serves every open page, so viewers don't each hold a database connection.
function listen() {
  listening ??= (async () => {
    // Cloudflare drops a response that sends nothing for about 100 s.
    const ping = setInterval(() => broadcast(": ping\n\n"), 25_000);
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    client.on("notification", (msg) => broadcast(sseFrame("live", msg.payload ?? "")));
    // Closing the streams makes each EventSource reconnect, which opens a new connection here.
    client.on("error", () => {
      listening = undefined;
      clearInterval(ping);
      streams.forEach((stream) => stream.close());
      streams.clear();
    });
    try {
      await client.connect();
      await client.query("LISTEN spike_live");
    } catch (error) {
      listening = undefined;
      clearInterval(ping);
      throw error;
    }
  })();
  return listening;
}

export async function GET(request: Request) {
  try {
    await listen();
  } catch (error) {
    console.error("live: cannot listen", error);
    // EventSource never retries after an error status, but does after a 200 stream closes.
    return new Response("retry: 5000\n\n", { headers: { "Content-Type": "text/event-stream" } });
  }
  const body = new ReadableStream<Uint8Array>({
    start(stream) {
      streams.add(stream);
      request.signal.addEventListener("abort", () => streams.delete(stream));
    },
  });
  return new Response(body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
