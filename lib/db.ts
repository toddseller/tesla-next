import { Pool } from "pg";
import { parse } from "pg-connection-string";
import pgpass from "pgpass";

// Parsed here because pg lets a URL's empty password override a password function.
const { password, host, port, database, user } = parse(process.env.DATABASE_URL ?? "");
const target = { host: host ?? undefined, port: port ? Number(port) : undefined, database: database ?? undefined, user: user ?? undefined };

// pg 9 stops reading the password file itself, so the pool asks for it.
const fromPasswordFile = () =>
  new Promise<string>((resolve, reject) =>
    pgpass(target, (found) => (found ? resolve(found) : reject(new Error(`No password for database "${database}"`)))),
  );

// This reads the production database the API writes to; a stray write must fail, not land.
// UTC like the API's sessions, whatever the server's default zone.
export const db = new Pool({
  ...target,
  password: password || fromPasswordFile,
  options: "-c default_transaction_read_only=on -c timezone=UTC",
});

// An idle connection broken by a database restart must not take the app down; the pool reconnects on the next query.
db.on("error", (error) => console.error("database connection lost:", error.message));
