// @vitest-environment jsdom
// The Top Ten page staying current, from the top-ten spec.
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { EXPORT_DAYS, TOP_TEN, WITHOUT_VPP } from "@/components/top-ten/fixtures";
import { TopTenPage } from "@/components/top-ten/top-ten-page";
import type { TopTen } from "@/lib/top-ten";
import { FakeStream } from "@/test/fake-event-source";

const router = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));

// Today's totals make November 8, 2026 the best export day.
const NEW_RECORD: TopTen = [TOP_TEN[0], { net_grid: [{ date: "Nov 8, 2026", net_grid: -61.2, day: "2026-11-08" }, ...EXPORT_DAYS.slice(0, 9)] }, TOP_TEN[2], TOP_TEN[3]];

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
  render(<TopTenPage topTen={TOP_TEN} withVpp today="2026-11-08" />);
  await settle();
  expect(fetches).toEqual([]);
  expect(exportRecord()).toContain("Thursday, May 30, 2024");
});

test("a totals event reloads the rankings in place", async () => {
  render(<TopTenPage topTen={TOP_TEN} withVpp today="2026-11-08" />);
  FakeStream.opened[0].send({ date: "2026-11-08" }, "totals");
  await settle();
  expect(fetches).toEqual(["/api/top-ten?vpp=with"]);
  expect(exportRecord()).toContain("Sunday, November 8, 2026");
});

test("a stream that opens again after it was lost reloads them", async () => {
  render(<TopTenPage topTen={TOP_TEN} withVpp today="2026-11-08" />);
  const stream = FakeStream.opened[0];
  stream.connect();
  expect(fetches).toEqual([]);
  stream.fail(false);
  stream.connect();
  await settle();
  expect(fetches).toEqual(["/api/top-ten?vpp=with"]);
  expect(exportRecord()).toContain("Sunday, November 8, 2026");
});

test("a failed reload keeps the rankings shown", async () => {
  failing = true;
  render(<TopTenPage topTen={TOP_TEN} withVpp today="2026-11-08" />);
  FakeStream.opened[0].send({ date: "2026-11-08" }, "totals");
  await settle();
  expect(fetches).toEqual(["/api/top-ten?vpp=with"]);
  expect(exportRecord()).toContain("Thursday, May 30, 2024");
});

const pressed = () =>
  within(screen.getByRole("group", { name: "VPP event days in the export rankings" })).getAllByRole("button")
    .filter((b) => b.getAttribute("aria-pressed") === "true").map((b) => b.textContent);

test("without VPP events, the switch, the footnote and a reload say so", async () => {
  render(<TopTenPage topTen={WITHOUT_VPP} withVpp={false} today="2026-11-08" />);
  expect(pressed()).toEqual(["Without VPP events"]);
  screen.getByText(/The export rankings leave out VPP event days, when Tesla discharged the Powerwalls to the grid for PG&E\./);
  fireEvent.click(screen.getByRole("button", { name: "With VPP events" }));
  expect(router.replace).toHaveBeenLastCalledWith("/top?vpp=with");
  FakeStream.opened[0].send({ date: "2026-11-08" }, "totals");
  await settle();
  expect(fetches).toEqual(["/api/top-ten"]);
});

test("with VPP events, the switch and the footnote say so, and Without goes back to /top", () => {
  render(<TopTenPage topTen={TOP_TEN} withVpp today="2026-11-08" />);
  expect(pressed()).toEqual(["With VPP events"]);
  screen.getByText(/The export rankings include VPP event days, when Tesla discharged the Powerwalls to the grid for PG&E\./);
  fireEvent.click(screen.getByRole("button", { name: "Without VPP events" }));
  expect(router.replace).toHaveBeenLastCalledWith("/top");
});

test("the longest outages come last, and an outages event reloads the rankings", async () => {
  render(<TopTenPage topTen={TOP_TEN} withVpp={false} today="2026-11-09" />);
  const regions = screen.getAllByRole("region").map((region) => region.getAttribute("aria-labelledby") && region.querySelector("h2")!.textContent);
  expect(regions).toEqual(["Best solar day", "Best export day", "Best export month", "Longest outage"]);
  FakeStream.opened[0].send({}, "outages");
  await settle();
  expect(fetches).toEqual(["/api/top-ten"]);
});

// meter-correction: Top Ten's rankings span every year, so the readings sit beside the VPP choice, each keeping the other.
test("the readings sit beside the VPP choice, each keeping the other, and a reload asks for both", async () => {
  render(<TopTenPage topTen={TOP_TEN} withVpp today="2026-11-08" readings="tesla" />);
  expect(screen.getByRole("button", { name: "As Tesla reported" }).getAttribute("aria-pressed")).toBe("true");
  expect(screen.getByText(/Grid figures are as Tesla reported them/)).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Corrected" }));
  expect(router.replace).toHaveBeenLastCalledWith("/top?vpp=with", { scroll: false });
  fireEvent.click(screen.getByRole("button", { name: "Without VPP events" }));
  expect(router.replace).toHaveBeenLastCalledWith("/top?readings=tesla");
  FakeStream.opened[0].send({ date: "2026-11-08" }, "totals");
  await act(() => new Promise((resolve) => setTimeout(resolve, 0)));
  expect(fetches.at(-1)).toBe("/api/top-ten?vpp=with&readings=tesla");
});
