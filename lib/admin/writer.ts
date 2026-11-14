import { Pool, type PoolClient } from "pg";
import { connection } from "@/lib/db";

// The one way the app writes: the admin page's saves, after its owner check (lib/admin/access.ts). Every other session
// stays read-only (lib/db.ts), and a test fails if anything outside the admin code imports this.
export const writer = new Pool({ ...connection, options: "-c timezone=UTC" });

writer.on("error", (error) => console.error("admin database connection lost:", error.message));

// The notification is delivered only when the transaction commits, so the server drops its kept figures (lib/live.ts)
// after a save lands and never after one that fails, as after one of anton's scripts.
export async function save<T>(work: (client: PoolClient) => Promise<T>) {
  const client = await writer.connect();
  // A connection lost mid-save is reported by the query that failed; unheard, the client's own error event would take
  // the server down.
  const lost = () => {};
  client.on("error", lost);
  let failed = false;
  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query(`SELECT pg_notify('data_rewritten', '{"script":"admin","start":null,"end":null}')`);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    failed = true;
    // A connection that died mid-save can't roll back, and needn't: the database drops its open transaction.
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client.off("error", lost);
    // A failed save's connection may be broken, so it's closed rather than kept for the next save.
    client.release(failed);
  }
}
