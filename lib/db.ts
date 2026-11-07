import { Pool } from "pg";

// This reads the production database the API writes to; a stray write must fail, not land.
export const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  options: "-c default_transaction_read_only=on",
});
