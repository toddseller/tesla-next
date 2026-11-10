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

test("tests get the production tables the intervals read uses", async () => {
  const { host, port, database, user, password } = inject("pg");
  const client = new Client({ host, port, database, user, password });
  await client.connect();
  const { rows } = await client.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename");
  await client.end();
  expect(rows.map((row) => row.tablename)).toEqual(
    expect.arrayContaining(["battery_sample", "charge_session", "energy_interval", "solar_forecast", "vehicle", "vehicle_interval", "weather_sample"]),
  );
});
