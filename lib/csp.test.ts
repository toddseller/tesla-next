import { afterEach, expect, test, vi } from "vitest";
import { csp } from "./csp";

afterEach(() => {
  vi.unstubAllEnvs();
});

test("allows scripts by nonce and Cloudflare's beacon, and everything else only from the site", () => {
  vi.stubEnv("NODE_ENV", "production");
  expect(csp("abc")).toBe(
    "default-src 'self'; " +
      "script-src 'self' 'nonce-abc' 'strict-dynamic' https://static.cloudflareinsights.com; " +
      "style-src 'self' 'unsafe-inline'; " +
      "font-src 'self'; " +
      "img-src 'self' data: blob:; " +
      "connect-src 'self'; " +
      "object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'",
  );
});

test("allows eval only in development, where React needs it", () => {
  vi.stubEnv("NODE_ENV", "development");
  expect(csp("abc")).toContain("script-src 'self' 'nonce-abc' 'strict-dynamic' 'unsafe-eval' https://static.cloudflareinsights.com;");
});
