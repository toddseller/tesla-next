import { Client, type ClientConfig } from "pg";
import { afterAll, beforeAll, expect, test, vi } from "vitest";

import { ownDatabase } from "@/test/true-up";

const configs: ClientConfig[] = [];

// Records the settings each listener connection is made with, so the test can try a write with them.
vi.mock("pg", async (importOriginal) => {
  const original = await importOriginal<typeof import("pg")>();
  class Recording extends original.Client {
    constructor(config: ClientConfig) {
      super(config);
      configs.push(config);
    }
  }
  return { ...original, Client: Recording, default: { ...original.default, Client: Recording } };
});

let live: typeof import("./live");
const liveModule = () => live;
let owner: Client;

const notify = (payload: string, channel = "live_status") => owner.query("SELECT pg_notify($1, $2)", [channel, payload]);

// Notifies until the listener hears one, since it connects in the background.
async function deliver(payload: string, received: string[], timeout = 10_000, channel = "live_status") {
  const deadline = Date.now() + timeout;
  while (!received.includes(payload)) {
    if (Date.now() > deadline) throw new Error(`${payload} never arrived`);
    await notify(payload, channel);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

// The site's state stretch open when the listener starts, as anton stores it.
const OPEN = '{"start":"2026-11-09T17:15:21.000Z","island_status":"on_grid","storm_mode_active":false}';

// A database of its own, since one test renames site_state while other files read it.
beforeAll(async () => {
  owner = await ownDatabase("tsr_live");
  await owner.query("INSERT INTO site_state VALUES ('2026-11-09 08:36:41-08', '2026-11-09 08:37:45-08', 'off_grid_intentional', false), ('2026-11-09 17:15:21Z', NULL, 'on_grid', false)");
  live = await import("./live");
  live.startListening();
});

afterAll(async () => {
  await owner.end();
  vi.unstubAllEnvs();
});

async function until(check: () => boolean, what: string, timeout = 10_000, poke = async () => {}) {
  const deadline = Date.now() + timeout;
  while (!check()) {
    if (Date.now() > deadline) throw new Error(`${what} never happened`);
    await poke();
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

test("the open site-state stretch is read when the listener starts", async () => {
  await until(() => live.siteState() === OPEN, "reading the open stretch");
});

test("a site_state_updated notification rereads the stretch and reaches subscribers with it", async () => {
  await until(() => live.siteState() === OPEN, "reading the open stretch");
  await owner.query("UPDATE site_state SET end_at = '2026-11-09 22:02:10Z' WHERE end_at IS NULL; INSERT INTO site_state VALUES ('2026-11-09 22:02:10Z', NULL, 'on_grid', true)");
  const storm = '{"start":"2026-11-09T22:02:10.000Z","island_status":"on_grid","storm_mode_active":true}';
  const received: [string, string][] = [];
  const unsubscribe = live.subscribe((payload, channel) => received.push([channel, payload]));
  await until(() => received.some(([, payload]) => payload === storm), "the stretch reaching subscribers", 10_000, () => notify("{}", "site_state_updated").then(() => {}));
  expect(received.filter(([channel]) => channel === "site_state_updated").map(([, payload]) => payload)).toContain(storm);
  expect(live.siteState()).toBe(storm);
  unsubscribe();
  await owner.query("DELETE FROM site_state WHERE start_at = '2026-11-09 22:02:10Z'; UPDATE site_state SET end_at = NULL WHERE start_at = '2026-11-09 17:15:21Z'");
});

test("an outages_updated notification reaches subscribers by its own name", async () => {
  const outages: string[] = [];
  const unsubscribe = live.subscribe((payload, channel) => channel === "outages_updated" && outages.push(payload));
  await deliver("{}", outages, 10_000, "outages_updated");
  expect(live.latest()).not.toBe("{}");
  unsubscribe();
});

test("a failed read keeps the stretch it had, sends nothing, and live statuses keep coming", async () => {
  await owner.query("UPDATE site_state SET end_at = NULL WHERE start_at = '2026-11-09 17:15:21Z'");
  await until(() => live.siteState() === OPEN, "reading the open stretch", 10_000, () => notify("{}", "site_state_updated").then(() => {}));
  const site: string[] = [];
  const statuses: string[] = [];
  const unsubscribe = live.subscribe((payload, channel) => (channel === "site_state_updated" ? site : statuses).push(payload));
  const error = vi.spyOn(console, "error").mockImplementation(() => {});
  await owner.query("ALTER TABLE site_state RENAME TO site_state_away");
  try {
    await until(() => error.mock.calls.some(([message]) => String(message).includes("site state")), "the failed read being logged", 10_000, () => notify("{}", "site_state_updated").then(() => {}));
    await deliver('{"solar_power":3.3}', statuses);
  } finally {
    await owner.query("ALTER TABLE site_state_away RENAME TO site_state");
    error.mockRestore();
  }
  expect(site).toEqual([]);
  expect(live.siteState()).toBe(OPEN);
  unsubscribe();
});

test("a notification reaches subscribers and becomes the latest status", async () => {
  const received: string[] = [];
  const unsubscribe = live.subscribe((payload) => received.push(payload));
  await deliver('{"solar_power":2.8}', received);
  expect(live.latest()).toBe('{"solar_power":2.8}');
  unsubscribe();
});

test("copies of the module share the one listener", async () => {
  // Next.js gives instrumentation, pages and route handlers each their own copy of this module.
  vi.resetModules();
  const copy = await import("./live");
  const received: string[] = [];
  const unsubscribe = copy.subscribe((payload) => received.push(payload));
  await deliver('{"solar_power":2.9}', received);
  expect(copy.latest()).toBe('{"solar_power":2.9}');
  unsubscribe();
});

test("listens with the read-only session settings", async () => {
  const client = new Client(configs.find((config) => config.options)!);
  await client.connect();
  await expect(client.query("CREATE TABLE written_by_the_listener (id int)")).rejects.toThrow(/read-only transaction/);
  await client.end();
});

test("an unsubscribed listener hears nothing more", async () => {
  const kept: string[] = [];
  const dropped: string[] = [];
  const keep = live.subscribe((payload) => kept.push(payload));
  live.subscribe((payload) => dropped.push(payload))();
  await deliver('{"solar_power":3.1}', kept);
  expect(dropped).toEqual([]);
  keep();
});

test("reconnects after its connection is killed and keeps delivering", async () => {
  const received: string[] = [];
  const unsubscribe = live.subscribe((payload) => received.push(payload));
  await deliver('{"solar_power":4.0}', received);
  const { rowCount } = await owner.query("SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE query LIKE 'LISTEN %'");
  expect(rowCount).toBe(1);
  await deliver('{"solar_power":4.2}', received, 15_000);
  expect(live.latest()).toBe('{"solar_power":4.2}');
  unsubscribe();
}, 20_000);

test("updated totals reach subscribers by their own name, and aren't the latest status", async () => {
  const live: string[] = [];
  const totals: string[] = [];
  const unsubscribe = liveModule().subscribe((payload, channel) => (channel === "totals_updated" ? totals : live).push(payload));
  await deliver('{"solar_power":4.4}', live);
  await deliver('{"date":"2026-11-07"}', totals, 10_000, "totals_updated");
  expect(live).not.toContain('{"date":"2026-11-07"}');
  expect(liveModule().latest()).toBe('{"solar_power":4.4}');
  unsubscribe();
});

test("reconnects after a minute without a live status, as a dead connection never reports itself", async () => {
  const listener = async () => (await owner.query("SELECT pid FROM pg_stat_activity WHERE query LIKE 'LISTEN %'")).rows[0]?.pid;
  const received: string[] = [];
  const unsubscribe = liveModule().subscribe((payload) => received.push(payload));
  const before = await listener();
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"], shouldAdvanceTime: true });
  try {
    // Each status restarts the watch; this one starts it on the fake clock.
    await deliver('{"solar_power":5.1}', received);
    await vi.advanceTimersByTimeAsync(60_000 + 5_000);
  } finally {
    vi.useRealTimers();
  }
  const deadline = Date.now() + 10_000;
  while ((await listener()) === before || (await listener()) === undefined) {
    if (Date.now() > deadline) throw new Error("the listener never reconnected");
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  await deliver('{"solar_power":5.2}', received);
  unsubscribe();
}, 30_000);

test("after a reconnect the open stretch is read again and sent on, as a change may have been missed", async () => {
  await owner.query("UPDATE site_state SET end_at = NULL WHERE start_at = '2026-11-09 17:15:21Z'");
  const received: string[] = [];
  const statuses: string[] = [];
  const unsubscribe = live.subscribe((payload, channel) => (channel === "site_state_updated" ? received : statuses).push(payload));
  // Connected first, so the reconnect below is one.
  await deliver('{"solar_power":6.0}', statuses);
  const { rowCount } = await owner.query("SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE query LIKE 'LISTEN %' AND datname = current_database()");
  expect(rowCount).toBe(1);
  await until(() => received.includes(OPEN), "the stretch after the reconnect", 15_000);
  unsubscribe();
}, 20_000);
