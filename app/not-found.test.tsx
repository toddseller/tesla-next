// The page for an address that isn't one, as the server renders it.
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

vi.mock("next/navigation", () => ({ usePathname: () => "/nope", useRouter: () => ({ push: vi.fn() }) }));

const { default: NotFound, metadata } = await import("./not-found");

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(Date.parse("2026-11-23T20:00:00Z"));
});
afterEach(() => vi.useRealTimers());

test("it says the visitor has gone off-grid, names the address, and leads back in", () => {
  const html = renderToString(<NotFound />);
  // As large as Pick a day's heading below it, so the page's h1 isn't the smaller of the two.
  expect(html).toMatch(/<h1 class="[^"]*text-\[28px\][^"]*">You(&#x27;|')ve gone off-grid<\/h1>/);
  expect(html).toMatch(/\/nope(<!-- -->)? isn(&#x27;|')t a page on the site, so nothing is flowing here\.<\/p>/);
  expect(html).toContain("Pick a day");
  expect(html).toMatch(/Any of the (<!-- -->)?1,859(<!-- -->)? days since October 22, 2021\./);
  expect(html).toMatch(/<a[^>]*href="\/"[^>]*>[^<]*home/);
});

test("its title says not found", () => {
  expect(metadata.title).toBe("Not found");
});
