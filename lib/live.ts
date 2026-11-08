import { Client } from "pg";
import { connection } from "./db";

// Flask notifies each live status (anton-tesla-api-ws, poll_live) about every 10 seconds, and each day whose totals it
// stores, as it emits its own socket events.
const LIVE = "live_status";
const TOTALS = "totals_updated";
const RETRY_MS = 5000;
// A connection that dies without a word (the database host losing power, a network drop) never errors, and pg turns
// TCP keep-alive off, so a minute without a live status, six of Flask's polls, counts as lost.
const SILENCE_MS = 60_000;

type Listener = (payload: string, channel: string) => void;

// `current` is Flask's JSON text, so streams forward it byte for byte.
type State = { current: string | null; subscribers: Set<Listener>; started: boolean };

declare global {
  var liveStatus: State | undefined;
}

// Next.js gives instrumentation, pages and route handlers each their own copy of this module, so the state lives on
// globalThis: the listener instrumentation starts is the one pages and streams read.
const state = (globalThis.liveStatus ??= { current: null, subscribers: new Set(), started: false });

export const latest = () => state.current;

export function subscribe(listener: Listener) {
  state.subscribers.add(listener);
  return () => {
    state.subscribers.delete(listener);
  };
}

// One connection for the whole server, so opening a page never touches the database.
export function startListening() {
  if (state.started) return;
  state.started = true;
  void listen();
}

async function listen() {
  const client = new Client(connection);
  let lost = false;
  let watchdog: ReturnType<typeof setTimeout> | undefined;
  const retry = (error?: Error) => {
    if (lost) return;
    lost = true;
    clearTimeout(watchdog);
    console.error("live status listener lost:", error?.message ?? "connection ended");
    client.end().catch(() => {});
    setTimeout(listen, RETRY_MS);
  };
  const watch = () => {
    clearTimeout(watchdog);
    watchdog = setTimeout(() => retry(new Error("no live status for a minute")), SILENCE_MS);
  };
  client.on("error", retry);
  client.on("end", () => retry());
  client.on("notification", ({ channel, payload }) => {
    if (payload === undefined) return;
    if (channel === LIVE) {
      state.current = payload;
      watch();
    }
    for (const listener of state.subscribers) listener(payload, channel);
  });
  try {
    await client.connect();
    await client.query(`LISTEN ${LIVE}; LISTEN ${TOTALS}`);
    watch();
  } catch (error) {
    retry(error as Error);
  }
}
