import { expect, test } from "vitest";
import nextConfig from "./next.config";

test("sends each page's old address to its new one, permanently", async () => {
  expect(await nextConfig.redirects?.()).toEqual([
    { source: "/numbers", destination: "/true-up", permanent: true },
    { source: "/health", destination: "/patterns", permanent: true },
  ]);
});
