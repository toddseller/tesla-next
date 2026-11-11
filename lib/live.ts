import { Client } from "pg";
import { connection, db } from "./db";

// anton-tesla-api-ws's scheduler notifies each live status (poll_live) about every 10 seconds, each day whose totals it
// stores, each refresh that changes the outages, and each change in the site's state stretches it stores.
const LIVE = "live_status";
// anton's scripts notify each run that rewrites stored data; the server's kept figures follow it, but pages never see it,
// as /api/live would forward it as a live status.
const REWRITE = "data_rewritten";
const CHANNELS = [LIVE, "totals_updated", "outages_updated", "site_state_updated", REWRITE];
const RETRY_MS = 5000;
// A connection that dies without a word (the database host losing power, a network drop) never errors, and pg turns
// TCP keep-alive off, so a minute without a live status, six of anton's polls, counts as lost.
const SILENCE_MS = 60_000;

type Listener = (payload: string, channel: string) => void;

// `current` is the notification's JSON text, so streams forward it byte for byte; `site` is the open state stretch.
type State = { current: string | null; site: string | null; subscribers: Set<Listener>; started: boolean; rewriteHooks: Set<() => void>; connected: boolean; broken: boolean };

declare global {
  var liveStatus: State | undefined;
}

// Next.js gives instrumentation, pages and route handlers each their own copy of this module, so the state lives on
// globalThis: the listener instrumentation starts is the one pages and streams read.
const state = (globalThis.liveStatus ??= { current: null, site: null, subscribers: new Set(), started: false, rewriteHooks: new Set(), connected: false, broken: false });

export const latest = () => state.current;
export const siteState = () => state.site;

// anton's notification says only that the stretches changed, so the open one is read here and sent on in its place.
async function readSite() {
  const { rows } = await db.query<{ start_at: Date; island_status: string; storm_mode_active: boolean }>(
    "SELECT start_at, island_status, storm_mode_active FROM site_state WHERE end_at IS NULL ORDER BY start_at DESC LIMIT 1",
  );
  state.site = rows[0] ? JSON.stringify({ start: rows[0].start_at.toISOString(), island_status: rows[0].island_status, storm_mode_active: rows[0].storm_mode_active }) : null;
  return state.site;
}

const send = (payload: string, channel: string) => {
  for (const listener of state.subscribers) listener(payload, channel);
};

const rewritten = () => {
  for (const hook of state.rewriteHooks) hook();
};

export function onRewrite(hook: () => void) {
  state.rewriteHooks.add(hook);
}

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
  const retry = (error?: Error, silent = false) => {
    if (lost) return;
    lost = true;
    // A broken connection may have missed a notice; one anton merely went quiet on (Tesla failing, its worker down)
    // can't have, and treating it as a rewrite would refill every cache each minute of the outage.
    if (!silent) state.broken = true;
    clearTimeout(watchdog);
    console.error("live status listener lost:", error?.message ?? "connection ended");
    client.end().catch(() => {});
    setTimeout(listen, RETRY_MS);
  };
  const watch = () => {
    clearTimeout(watchdog);
    watchdog = setTimeout(() => retry(new Error("no live status for a minute"), true), SILENCE_MS);
  };
  client.on("error", retry);
  client.on("end", () => retry());
  client.on("notification", ({ channel, payload }) => {
    if (payload === undefined) return;
    if (channel === LIVE) {
      state.current = payload;
      watch();
    }
    if (channel === REWRITE) {
      rewritten();
      return;
    }
    if (channel === "site_state_updated") {
      readSite().then((site) => send(String(site), channel), (error) => console.error("site state read failed:", error.message));
      return;
    }
    send(payload, channel);
  });
  try {
    await client.connect();
    await client.query(CHANNELS.map((channel) => `LISTEN ${channel}`).join("; "));
    watch();
    // A notice sent while the connection was broken is lost, so that reconnect counts as a rewrite.
    if (state.connected && state.broken) rewritten();
    state.connected = true;
    state.broken = false;
    // Also after a reconnect, and sent on, so a change notified while the connection was down isn't missed.
    await readSite().then((site) => send(String(site), "site_state_updated"), (error) => console.error("site state read failed:", error.message));
  } catch (error) {
    retry(error as Error);
  }
}
