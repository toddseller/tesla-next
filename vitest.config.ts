import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL(".", import.meta.url)) } },
  // Reuses workers across files, so jsdom loads once per worker instead of once per file, which cost most of the run's CPU.
  test: { globalSetup: ["./test/postgres.ts"], pool: "vmThreads" },
});
