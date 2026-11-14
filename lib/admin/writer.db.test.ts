import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Client } from "pg";
import { afterAll, beforeAll, expect, test } from "vitest";
import { ownDatabase } from "@/test/true-up";

let owner: Client;
let listener: Client;
const heard: string[] = [];
const settle = () => new Promise((resolve) => setTimeout(resolve, 100));

beforeAll(async () => {
  owner = await ownDatabase("admin_writer");
  await owner.query("CREATE TABLE admin_probe (id int)");
  listener = new Client({ connectionString: process.env.DATABASE_URL });
  await listener.connect();
  listener.on("notification", ({ channel }) => heard.push(channel));
  await listener.query("LISTEN data_rewritten");
});

afterAll(async () => {
  await (await import("./writer")).writer.end();
  await (await import("@/lib/db")).db.end();
  await listener.end();
  await owner.end();
});

test("a save commits, in UTC, and the rewrite is heard only after the commit", async () => {
  const { save } = await import("./writer");
  heard.length = 0;
  const zone = await save(async (client) => {
    await client.query("INSERT INTO admin_probe VALUES (1)");
    await settle();
    expect(heard).toEqual([]);
    return (await client.query("SHOW timezone")).rows[0].TimeZone;
  });
  expect(zone).toBe("UTC");
  await settle();
  expect(heard).toEqual(["data_rewritten"]);
  expect((await owner.query("SELECT id FROM admin_probe")).rows).toEqual([{ id: 1 }]);
});

test("a save that throws stores nothing and drops nothing", async () => {
  const { save } = await import("./writer");
  heard.length = 0;
  await expect(save(async (client) => {
    await client.query("INSERT INTO admin_probe VALUES (2)");
    throw new Error("refused");
  })).rejects.toThrow("refused");
  await settle();
  expect(heard).toEqual([]);
  expect((await owner.query("SELECT id FROM admin_probe WHERE id = 2")).rows).toEqual([]);
});

test("a save whose connection dies reports why it failed, not the rollback's failure", async () => {
  const { save } = await import("./writer");
  await expect(save(async (client) => {
    await client.query("SELECT pg_terminate_backend(pg_backend_pid())");
  })).rejects.toThrow(/terminating connection/);
});

test("the site's own pool still refuses writes", async () => {
  const { db } = await import("@/lib/db");
  await expect(db.query("INSERT INTO admin_probe VALUES (3)")).rejects.toThrow(/read-only transaction/);
});

test("only the admin page's code imports the writer", () => {
  const root = join(__dirname, "../..");
  const files = (dir: string): string[] =>
    readdirSync(join(root, dir), { withFileTypes: true }).flatMap((entry) =>
      entry.isDirectory() ? files(join(dir, entry.name)) : /\.tsx?$/.test(entry.name) ? [join(dir, entry.name)] : []);
  const importers = ["app", "components", "lib"].flatMap(files)
    .filter((file) => /admin\/writer["']/.test(readFileSync(join(root, file), "utf8")))
    .filter((file) => !/^(lib|app)\/admin\//.test(file));
  expect(importers).toEqual([]);
});
