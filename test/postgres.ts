import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import type { TestProject } from "vitest/node";

type Pg = { host: string; port: number; database: string; user: string; password: string; passfile: string };

declare module "vitest" {
  export interface ProvidedContext {
    pg: Pg;
  }
}

// An empty directory means the binaries on PATH, as in the Docker build.
function binDir() {
  const brew = "/opt/homebrew/opt/postgresql@18/bin";
  return process.env.PG_BIN ?? (existsSync(brew) ? brew : "");
}

// Tests get a database of their own, so they never touch production and run the same in the Docker build.
export default function setup(project: TestProject) {
  const bin = binDir();
  const dir = mkdtempSync(join(tmpdir(), "tesla-next-pg-"));
  const data = join(dir, "data");
  const stop = () => {
    spawnSync(join(bin, "pg_ctl"), ["-D", data, "-m", "immediate", "stop"], { stdio: "ignore" });
    rmSync(dir, { recursive: true, force: true });
  };
  try {
    const superPassword = join(dir, "superuser");
    writeFileSync(superPassword, "postgres");
    execFileSync(join(bin, "initdb"), ["-D", data, "-U", "postgres", "--auth=scram-sha-256", `--pwfile=${superPassword}`, "--locale=C", "-E", "UTF8"], { stdio: "ignore" });
    // Los Angeles, like the production server's default, so a session that forgets UTC shows it.
    execFileSync(join(bin, "pg_ctl"), ["-D", data, "-o", `-c listen_addresses='' -k ${dir} -c timezone=America/Los_Angeles`, "-l", join(dir, "log"), "-w", "start"], { stdio: "ignore" });
    execFileSync(join(bin, "psql"), ["-h", dir, "-U", "postgres", "-d", "postgres", "-qc", "CREATE ROLE tsr_app LOGIN PASSWORD 'tsr'", "-c", "CREATE DATABASE tsr OWNER tsr_app"], { env: { ...process.env, PGPASSWORD: "postgres" }, stdio: "ignore" });
    // Production's columns and types, so the intervals tests read what the real tables hold.
    execFileSync(join(bin, "psql"), ["-h", dir, "-U", "tsr_app", "-d", "tsr", "-q", "-v", "ON_ERROR_STOP=1", "-f", fileURLToPath(new URL("schema.sql", import.meta.url))], { env: { ...process.env, PGPASSWORD: "tsr" }, stdio: "ignore" });
    const passfile = join(dir, "pgpass");
    writeFileSync(passfile, "*:*:tsr:tsr_app:tsr\n", { mode: 0o600 });
    project.provide("pg", { host: dir, port: 5432, database: "tsr", user: "tsr_app", password: "tsr", passfile });
  } catch (error) {
    stop();
    throw error;
  }
  return stop;
}
