import { Client } from "pg";
import { afterEach, beforeAll, expect, inject, test, vi } from "vitest";

const pg = inject("pg");
const url = (password = "") => `postgresql://${pg.user}${password && `:${password}`}@/${pg.database}?host=${pg.host}`;

async function freshDb(env: Record<string, string | undefined>) {
  vi.resetModules();
  for (const [name, value] of Object.entries(env)) vi.stubEnv(name, value);
  return (await import("./db")).db;
}

beforeAll(async () => {
  const owner = new Client({ ...pg });
  await owner.connect();
  await owner.query("CREATE TABLE IF NOT EXISTS readings (id int)");
  await owner.query("TRUNCATE readings");
  await owner.query("INSERT INTO readings VALUES (1)");
  await owner.end();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

test.each([
  "CREATE TABLE more_readings (id int)",
  "INSERT INTO readings VALUES (2)",
  "UPDATE readings SET id = 3",
  "DELETE FROM readings",
])("refuses a write: %s", async (sql) => {
  const db = await freshDb({ DATABASE_URL: url(pg.password), PGPASSFILE: undefined });
  await expect(db.query(sql)).rejects.toThrow(/read-only transaction/);
  expect((await db.query("SELECT id FROM readings")).rows).toEqual([{ id: 1 }]);
  await db.end();
});

test("sessions run in UTC on a server whose default is Los Angeles", async () => {
  const db = await freshDb({ DATABASE_URL: url(pg.password), PGPASSFILE: undefined });
  expect((await db.query("SHOW timezone")).rows[0].TimeZone).toBe("UTC");
  await db.end();
});

test("reads the password from PGPASSFILE when DATABASE_URL has none, without pg's deprecated reader", async () => {
  const warn = vi.spyOn(process, "emitWarning");
  const db = await freshDb({ DATABASE_URL: url(), PGPASSFILE: pg.passfile });
  expect((await db.query("SELECT 1 AS one")).rows).toEqual([{ one: 1 }]);
  await db.end();
  expect(warn.mock.calls.map(([message]) => String(message)).filter((message) => message.includes("pgpass"))).toEqual([]);
  warn.mockRestore();
});

test("uses the password in DATABASE_URL when there is no password file", async () => {
  const db = await freshDb({ DATABASE_URL: url(pg.password), PGPASSFILE: undefined });
  expect((await db.query("SELECT 1 AS one")).rows).toEqual([{ one: 1 }]);
  await db.end();
});

test("names the database, and not where it is, when no password is found", async () => {
  const db = await freshDb({ DATABASE_URL: url(), PGPASSFILE: "/dev/null" });
  const failure = await db.query("SELECT 1").catch((error: Error) => error);
  expect(String(failure)).toMatch(/No password for database "tsr"/);
  expect(String(failure)).not.toContain(pg.host);
  await db.end();
});

test("a lost idle connection is logged, not fatal", async () => {
  const log = vi.spyOn(console, "error").mockImplementation(() => {});
  const db = await freshDb({ DATABASE_URL: url(pg.password), PGPASSFILE: undefined });
  expect(() => db.emit("error", new Error("terminating connection due to administrator command"))).not.toThrow();
  expect(log).toHaveBeenCalledWith("database connection lost:", "terminating connection due to administrator command");
  log.mockRestore();
  await db.end();
});
