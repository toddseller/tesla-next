import { Client, type ClientConfig } from "pg";
import { afterAll, beforeAll, expect, inject, test, vi } from "vitest";

const pg = inject("pg");
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

beforeAll(async () => {
  vi.stubEnv("DATABASE_URL", `postgresql://${pg.user}:${pg.password}@/${pg.database}?host=${pg.host}`);
  live = await import("./live");
  live.startListening();
  owner = new Client({ ...pg });
  await owner.connect();
});

afterAll(async () => {
  await owner.end();
  vi.unstubAllEnvs();
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
  const client = new Client(configs[0]);
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
