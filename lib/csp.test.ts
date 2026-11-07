import { expect, test } from "vitest";
import { csp } from "./csp";

test("allows scripts by nonce and Cloudflare's beacon, and keeps nginx's other directives", () => {
  expect(csp("abc")).toBe(
    "default-src 'self'; " +
      "script-src 'self' 'nonce-abc' 'strict-dynamic' https://static.cloudflareinsights.com; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "font-src 'self' https://fonts.gstatic.com; " +
      "img-src 'self' data: blob:; " +
      "connect-src 'self'; " +
      "object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'",
  );
});
