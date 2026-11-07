import { Client } from "pg";
import { expect, inject, test } from "vitest";

test("tests get a PostgreSQL 18 of their own", async () => {
  const { host, port, database, user, password } = inject("pg");
  const client = new Client({ host, port, database, user, password });
  await client.connect();
  const { rows } = await client.query("SELECT current_setting('server_version_num')::int AS version");
  await client.end();
  expect(Math.floor(rows[0].version / 10000)).toBe(18);
});
