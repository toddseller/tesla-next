// @vitest-environment jsdom
// The Impact page in the browser: its address changes and staying current, from the impact-report spec.
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { ImpactPage } from "@/components/impact/impact-page";
import type { BackupHistory } from "@/lib/backup";
import type { ImpactFigures } from "@/lib/impact";
import { FakeStream } from "@/test/fake-event-source";

const router = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));

const today = { start: "2026-11-08", end: "2026-11-08" };
const march = { start: "2026-03-01", end: "2026-03-31" };
const figures = (selfPowered: number): ImpactFigures => ({
  from_solar_percentage: 35, from_powerwall_percentage: selfPowered - 35, from_grid_percentage: 100 - selfPowered,
  self_powered_percentage: selfPowered, total_solar_percentage: 55, total_solar: 25, from_solar: 15.8, from_powerwall: 27.5,
  from_grid: 2.3, total_house: 45.6,
});

const THIS_YEAR = { start: "2026-10-01", end: "2027-09-30" };
const NO_BACKUP: BackupHistory = { summary: { outages: 0, seconds: 0, longest: null, house_kwh: 0, powerwalls_kwh: 0, solar_kwh: 0 }, events: [] };

let fetches: string[];
let answers: (() => Promise<{ ok: boolean; json: () => unknown }>)[];

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(Date.parse("2026-11-08T20:00:00Z"));
  FakeStream.opened = [];
  vi.stubGlobal("EventSource", FakeStream);
  fetches = [];
  answers = [];
  vi.stubGlobal("fetch", (url: string) => {
    fetches.push(url);
    return answers.shift()?.() ?? Promise.resolve({ ok: true, json: () => ({ data: url.startsWith("/api/backup") ? NO_BACKUP : figures(97) }) });
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
  router.push.mockReset();
  router.replace.mockReset();
});

const ring = () => screen.getByRole("img", { name: /^Home use/ }).textContent;
// The fetch, its JSON and the state update each take a turn.
const settle = () => act(() => new Promise((resolve) => setTimeout(resolve, 0)));
const ranges = () => within(screen.getByRole("group", { name: "Preset ranges" }));
const years = () => within(screen.getByRole("group", { name: "Backup years" }));
const pressed = (name: string) => ranges().getByRole("button", { name }).getAttribute("aria-pressed");

test("today is marked, and each preset pushes its address", () => {
  render(<ImpactPage range={today} figures={figures(95)} today="2026-11-08" backup={NO_BACKUP} backupYear={THIS_YEAR} />);
  expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Impact");
  expect(screen.getByRole("heading", { level: 2, name: "November 8, 2026" })).toBeTruthy();
  expect(["Today", "This week", "This month", "This year", "True-up year"].map(pressed)).toEqual(["true", "false", "false", "false", "false"]);
  fireEvent.click(ranges().getByRole("button", { name: "This week" }));
  expect(router.push).toHaveBeenCalledWith("/impact?start=2026-11-08&end=2026-11-14");
});

test("the served figures show with no request of their own", async () => {
  render(<ImpactPage range={today} figures={figures(95)} today="2026-11-08" backup={NO_BACKUP} backupYear={THIS_YEAR} />);
  await settle();
  expect(fetches).toEqual([]);
  expect(ring()).toContain("95%");
});

test("totals for a day in the range reload the figures in place; other days' don't", async () => {
  render(<ImpactPage range={today} figures={figures(95)} today="2026-11-08" backup={NO_BACKUP} backupYear={THIS_YEAR} />);
  FakeStream.opened[0].send({ date: "2026-11-07" }, "totals");
  expect(fetches).toEqual([]);
  FakeStream.opened[0].send({ date: "2026-11-08" }, "totals");
  await settle();
  expect(fetches).toEqual(["/api/impact?start_date=2026-11-08&end_date=2026-11-08"]);
  expect(ring()).toContain("97%");
});

test("a stream that opens again reloads a range that includes today, but not a past one", async () => {
  const { rerender } = render(<ImpactPage range={march} figures={figures(95)} today="2026-11-08" backup={NO_BACKUP} backupYear={THIS_YEAR} />);
  const [stream] = FakeStream.opened;
  stream.connect();
  stream.fail(false);
  stream.connect();
  await settle();
  const figureFetches = () => fetches.filter((url) => url.startsWith("/api/impact"));
  expect(figureFetches()).toEqual([]);
  rerender(<ImpactPage range={today} figures={figures(95)} today="2026-11-08" backup={NO_BACKUP} backupYear={THIS_YEAR} />);
  stream.fail(false);
  stream.connect();
  await settle();
  expect(figureFetches()).toEqual(["/api/impact?start_date=2026-11-08&end_date=2026-11-08"]);
});

test("a failed reload keeps the figures", async () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  answers.push(() => Promise.resolve({ ok: false, json: () => ({}) }));
  render(<ImpactPage range={today} figures={figures(95)} today="2026-11-08" backup={NO_BACKUP} backupYear={THIS_YEAR} />);
  FakeStream.opened[0].send({ date: "2026-11-08" }, "totals");
  await settle();
  expect(ring()).toContain("95%");
});

test("picking a backup year replaces the address, keeping the range, with no new history entry", () => {
  render(<ImpactPage range={march} figures={figures(95)} today="2026-11-08" backup={NO_BACKUP} backupYear={THIS_YEAR} />);
  fireEvent.click(years().getByRole("button", { name: "'24 - '25" }));
  expect(router.replace).toHaveBeenCalledWith("/impact?start=2026-03-01&end=2026-03-31&backup=24-25", { scroll: false });
  expect(router.push).not.toHaveBeenCalled();
  fireEvent.click(years().getByRole("button", { name: "This year" }));
  expect(router.replace).toHaveBeenLastCalledWith("/impact?start=2026-03-01&end=2026-03-31", { scroll: false });
});

test("a new range keeps the backup year chosen", () => {
  render(<ImpactPage range={today} figures={figures(95)} today="2026-11-08" backup={NO_BACKUP} backupYear={{ start: "2024-10-01", end: "2025-09-30" }} />);
  fireEvent.click(ranges().getByRole("button", { name: "This week" }));
  expect(router.push).toHaveBeenCalledWith("/impact?start=2026-11-08&end=2026-11-14&backup=24-25");
});

test("the Backup section reloads its year on outages, site-state and reopen events", async () => {
  const empty = { ok: true, json: () => ({ data: NO_BACKUP }) };
  answers.push(() => Promise.resolve(empty), () => Promise.resolve(empty), () => Promise.resolve(empty));
  render(<ImpactPage range={march} figures={figures(95)} today="2026-11-08" backup={NO_BACKUP} backupYear={{ start: "2024-10-01", end: "2025-09-30" }} />);
  const [stream] = FakeStream.opened;
  stream.connect();
  stream.send({}, "outages");
  stream.send({ start: "2026-11-08T22:02:10Z", island_status: "on_grid", storm_mode_active: true }, "site_state");
  stream.fail(false);
  stream.connect();
  await settle();
  expect(fetches).toEqual(["/api/backup?year=24-25", "/api/backup?year=24-25", "/api/backup?year=24-25"]);
});

test("this year's reload asks for no year, and a failed one keeps the section", async () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  render(<ImpactPage range={march} figures={figures(95)} today="2026-11-08" backup={NO_BACKUP} backupYear={THIS_YEAR} />);
  answers.push(() => Promise.resolve({ ok: false, json: () => ({}) }));
  FakeStream.opened[0].send({}, "outages");
  await settle();
  expect(fetches).toEqual(["/api/backup"]);
  expect(screen.getByText("No backup events.")).toBeTruthy();
});
