// @vitest-environment jsdom
// The Top Ten page staying current, from the top-ten spec.
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { EXPORT_DAYS, TOP_TEN } from "@/components/top-ten/fixtures";
import { TopTenPage } from "@/components/top-ten/top-ten-page";
import type { TopTen } from "@/lib/top-ten";
import { FakeStream } from "@/test/fake-event-source";

// Today's totals make November 8, 2026 the best export day.
const NEW_RECORD: TopTen = [TOP_TEN[0], { net_grid: [{ date: "Nov 8, 2026", net_grid: -61.2, day: "2026-11-08" }, ...EXPORT_DAYS.slice(0, 9)] }, TOP_TEN[2]];

let fetches: string[];
let failing: boolean;

beforeEach(() => {
  FakeStream.opened = [];
  vi.stubGlobal("EventSource", FakeStream);
  vi.spyOn(console, "error").mockImplementation(() => {});
  fetches = [];
  failing = false;
  vi.stubGlobal("fetch", (url: string) => {
    fetches.push(url);
    return Promise.resolve({ ok: !failing, status: failing ? 502 : 200, json: () => ({ data: NEW_RECORD }) });
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const settle = () => act(() => new Promise((resolve) => setTimeout(resolve, 0)));
const exportRecord = () => screen.getByRole("region", { name: "Best export day" }).textContent;

test("the served rankings show with no request of their own", async () => {
  render(<TopTenPage topTen={TOP_TEN} today="2026-11-08" />);
  await settle();
  expect(fetches).toEqual([]);
  expect(exportRecord()).toContain("Thursday, May 30, 2024");
});

test("a totals event reloads the rankings in place", async () => {
  render(<TopTenPage topTen={TOP_TEN} today="2026-11-08" />);
  FakeStream.opened[0].send({ date: "2026-11-08" }, "totals");
  await settle();
  expect(fetches).toEqual(["/api/top-ten"]);
  expect(exportRecord()).toContain("Sunday, November 8, 2026");
});

test("a stream that opens again after it was lost reloads them", async () => {
  render(<TopTenPage topTen={TOP_TEN} today="2026-11-08" />);
  const stream = FakeStream.opened[0];
  stream.connect();
  expect(fetches).toEqual([]);
  stream.fail(false);
  stream.connect();
  await settle();
  expect(fetches).toEqual(["/api/top-ten"]);
  expect(exportRecord()).toContain("Sunday, November 8, 2026");
});

test("a failed reload keeps the rankings shown", async () => {
  failing = true;
  render(<TopTenPage topTen={TOP_TEN} today="2026-11-08" />);
  FakeStream.opened[0].send({ date: "2026-11-08" }, "totals");
  await settle();
  expect(fetches).toEqual(["/api/top-ten"]);
  expect(exportRecord()).toContain("Thursday, May 30, 2024");
});
