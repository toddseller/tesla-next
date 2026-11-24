// @vitest-environment jsdom
// The True-Up Tracker in the browser: its year picker and staying current, from the true-up-tracker spec.
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { COST_25_26, CURRENT, CURRENT_COST, CURRENT_SAVINGS, SAVINGS_25_26, YEAR_25_26, YEARS } from "@/components/true-up/fixtures";
import { LEAD } from "@/components/lead";
import { TrueUpPage } from "@/components/true-up/true-up-page";
import type { Payback } from "@/lib/true-up/payback";
import { FakeStream } from "@/test/fake-event-source";

const router = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));

const THIS_YEAR = { start: "2026-10-01", end: "2027-09-30" };
const YEAR_25 = { start: "2025-10-01", end: "2026-09-30" };

let fetches: string[];
let answers: Record<string, unknown>;
let failing: boolean;

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(Date.parse("2026-11-08T20:00:00Z"));
  FakeStream.opened = [];
  vi.stubGlobal("EventSource", FakeStream);
  fetches = [];
  failing = false;
  answers = {};
  vi.stubGlobal("fetch", (url: string) => {
    fetches.push(url);
    const path = url.split("?")[0];
    return Promise.resolve({ ok: !failing, json: () => ({ data: answers[path] }) });
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
  router.push.mockReset();
});

const settle = () => act(() => new Promise((resolve) => setTimeout(resolve, 0)));
const pressed = (name: string) => screen.getByRole("button", { name }).getAttribute("aria-pressed");
const page = (range = THIS_YEAR, cycles = CURRENT, cost = CURRENT_COST, savings: typeof CURRENT_SAVINGS | null = CURRENT_SAVINGS, payback: Payback | null = null) =>
  <TrueUpPage range={range} years={YEARS} cycles={cycles} cost={cost} savings={savings} payback={payback} today="2026-11-08" />;
const PAYBACK: Payback = {
  solar: { year: 2025, month: "2025-06", projected: false, estimated: true }, system: { year: 2030, projected: true, estimated: true },
  powerwalls: { year: null, wont: true }, outages: { count: 35, seconds: 564_840, longest_seconds: 188_172 },
};
const RELOADS = (range: { start: string; end: string }) =>
  ["cycles", "true-up-cost", "true-up-savings"].map((route) => `/api/${route}?start_date=${range.start}&end_date=${range.end}`);
const savingsCard = () => screen.getByRole("region", { name: "What the system saved" }).textContent;

test("True-up year is marked, and the presets and step buttons push their addresses", () => {
  render(page());
  expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("True-Up Tracker");
  expect(["True-up year", "All time"].map(pressed)).toEqual(["true", "false"]);
  expect(screen.queryByRole("button", { name: /Earlier/ })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "All time" }));
  expect(router.push).toHaveBeenLastCalledWith("/true-up?start=2021-10-01&end=2027-09-30", { scroll: false });
  fireEvent.click(within(screen.getByRole("group", { name: "Preset ranges" })).getByRole("button", { name: "Previous true-up year" }));
  expect(router.push).toHaveBeenLastCalledWith("/true-up?start=2025-10-01&end=2026-09-30", { scroll: false });
});

test("the served data shows with no request of its own", async () => {
  render(page());
  await settle();
  expect(fetches).toEqual([]);
  expect(screen.getByRole("region", { name: "Charges so far" }).textContent).toContain("$106.46");
  expect(savingsCard()).toContain("$411");
});

test("totals for today reload the cycles, cost and savings in place", async () => {
  answers = {
    "/api/cycles": CURRENT, "/api/true-up-cost": { ...CURRENT_COST, charges_so_far: 110.5 },
    "/api/true-up-savings": { ...CURRENT_SAVINGS, actual: { pge: 80, westlight: 20, total: 100 } },
  };
  render(page());
  expect(savingsCard()).toContain("$411");
  FakeStream.opened[0].send({ date: "2026-11-08" }, "totals");
  await settle();
  expect(fetches).toEqual(RELOADS(THIS_YEAR));
  expect(screen.getByRole("region", { name: "Charges so far" }).textContent).toContain("$110.50");
  expect(savingsCard()).toContain("$445");
});

test("'25 - '26 reloads for a day in its last cycle, past September 30", async () => {
  answers = { "/api/cycles": YEAR_25_26, "/api/true-up-cost": COST_25_26, "/api/true-up-savings": SAVINGS_25_26 };
  render(page(YEAR_25, YEAR_25_26, COST_25_26, SAVINGS_25_26));
  FakeStream.opened[0].send({ date: "2026-10-05" }, "totals");
  expect(fetches).toEqual([]);
  FakeStream.opened[0].send({ date: "2026-10-02" }, "totals");
  await settle();
  expect(fetches).toEqual(RELOADS(YEAR_25));
});

test("a past year doesn't reload for today, and a reopened stream reloads only a range covering today", async () => {
  answers = { "/api/cycles": CURRENT, "/api/true-up-cost": CURRENT_COST };
  const { rerender } = render(page(YEAR_25, YEAR_25_26, COST_25_26));
  const [stream] = FakeStream.opened;
  stream.send({ date: "2026-11-08" }, "totals");
  stream.connect();
  stream.fail(false);
  stream.connect();
  await settle();
  expect(fetches).toEqual([]);
  rerender(page());
  stream.fail(false);
  stream.connect();
  await settle();
  expect(fetches).toEqual(RELOADS(THIS_YEAR));
});

test("a range that isn't a true-up year reloads its cycles alone", async () => {
  const allTime = { start: "2021-10-01", end: "2027-09-30" };
  answers = { "/api/cycles": CURRENT };
  render(page(allTime, CURRENT, null as never, null));
  expect(screen.queryByRole("region", { name: "What the system saved" })).toBeNull();
  FakeStream.opened[0].send({ date: "2026-11-08" }, "totals");
  await settle();
  expect(fetches).toEqual([RELOADS(allTime)[0]]);
});

test("a failed reload keeps the data", async () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  failing = true;
  render(page());
  FakeStream.opened[0].send({ date: "2026-11-08" }, "totals");
  await settle();
  expect(screen.getByRole("region", { name: "Charges so far" }).textContent).toContain("$106.46");
  expect(savingsCard()).toContain("$411");
});

test("the Payback card shows for any range with payback data, and not without", () => {
  render(page(YEAR_25, YEAR_25_26, COST_25_26, SAVINGS_25_26, PAYBACK));
  expect(screen.getByRole("region", { name: "Payback" })).toBeTruthy();
  cleanup();
  render(page());
  expect(screen.queryByRole("region", { name: "Payback" })).toBeNull();
});

test("a totals event for today reloads the Payback card whatever range is shown, keeping it when the reload fails", async () => {
  render(page({ start: "2022-10-01", end: "2023-09-30" }, [], CURRENT_COST, null, PAYBACK));
  answers["/api/payback"] = { ...PAYBACK, system: { year: 2029, projected: true, estimated: true } };
  FakeStream.opened[0].send({ date: "2026-11-08" }, "totals");
  await settle();
  expect(fetches).toContain("/api/payback");
  expect(screen.getByRole("region", { name: "Payback" }).textContent).toContain("2029");
  failing = true;
  vi.spyOn(console, "error").mockImplementation(() => {});
  FakeStream.opened[0].send({ date: "2026-11-08" }, "totals");
  await settle();
  expect(screen.getByRole("region", { name: "Payback" }).textContent).toContain("2029");
});

const follows = (later: HTMLElement, earlier: HTMLElement) => Boolean(earlier.compareDocumentPosition(later) & Node.DOCUMENT_POSITION_FOLLOWING);

test("on a true-up year the Payback card follows the savings card and comes before the billing-cycle chart", () => {
  render(page(YEAR_25, YEAR_25_26, COST_25_26, SAVINGS_25_26, PAYBACK));
  const payback = screen.getByRole("region", { name: "Payback" });
  expect(follows(payback, screen.getByRole("region", { name: "What the system saved" }))).toBe(true);
  expect(follows(screen.getByRole("region", { name: /by billing cycle$/ }), payback)).toBe(true);
});

test("on All time, with no savings card, the Payback card follows the tiles and comes before the chart", () => {
  render(page({ start: "2021-10-01", end: "2027-09-30" }, CURRENT, null as never, null, PAYBACK));
  const payback = screen.getByRole("region", { name: "Payback" });
  expect(screen.queryByRole("region", { name: "What the system saved" })).toBeNull();
  expect(follows(screen.getByRole("region", { name: /by billing cycle$/ }), payback)).toBe(true);
});

// site-motion, "True-Up's figures count up when first seen": a new range's tiles are new figures, but not a first view.
test("figures count up on the page's first view, and not after a range change brings new tiles", () => {
  vi.useFakeTimers({ toFake: ["Date", "setTimeout", "clearTimeout"] });
  vi.setSystemTime(Date.parse("2026-11-08T20:00:00Z"));
  const { rerender } = render(page());
  expect(document.querySelectorAll("[data-part=counting]").length).toBeGreaterThan(0);
  act(() => vi.advanceTimersByTime(1000));
  rerender(page(YEAR_25, YEAR_25_26, COST_25_26, SAVINGS_25_26));
  expect(document.querySelectorAll("[data-part=counting]").length).toBe(0);
});

test("the title hints the true-up", () => {
  render(page());
  expect(within(screen.getByRole("heading", { level: 1 })).getByRole("button", { name: "True-Up" })).toBeTruthy();
  expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("True-Up Tracker");
});

// true-up-tracker, "The headline": what the tiles don't say is the page's lead, under the full-size title as on Solar and Impact.
const leads = () => [...screen.getByRole("heading", { level: 1 }).parentElement!.querySelectorAll("p")];

test("the current year leads with its projection, under the full-size title", () => {
  render(page());
  const title = screen.getByRole("heading", { level: 1 });
  const [headline, line] = leads();
  expect(headline.textContent).toBe("On track to owe $593 to $652 at the October 2027 true\u2011up; $106 in charges so far.");
  expect(line.textContent!.replace(/\u00a0/g, " ")).toBe("Year-end 2,032 to 2,362 kWh imported, if the rest of the year goes like '24 - '25 or '25 - '26");
  expect(line.textContent).toContain("'24\u00a0-\u00a0'25");
  expect(title.className).toContain("text-[22px]");
  expect(title.className).not.toContain("uppercase");
  expect(headline.className).toContain(LEAD);
  expect(screen.queryByText("Grid energy by PG&E billing cycle")).toBeNull();
});

test("a past year leads with its amount due against the year before's", () => {
  render(<TrueUpPage range={YEAR_25} years={YEARS} cycles={YEAR_25_26} cost={COST_25_26} savings={SAVINGS_25_26} payback={null} today="2026-11-08"
    before={{ label: "'24 - '25", amount_due: 554.83 }} />);
  expect(leads()[0].textContent!.replace(/\u00a0/g, " ")).toBe("'25 - '26 ended owing $768 at the true\u2011up, $213 more than '24 - '25.");
});

test("without a headline, the title and subtitle stay", () => {
  render(page({ start: "2021-10-01", end: "2026-11-08" }, [...YEAR_25_26, ...CURRENT], CURRENT_COST, null));
  expect(screen.getByRole("heading", { level: 1 }).className).not.toContain("uppercase");
  expect(screen.getByText("Grid energy by PG&E billing cycle")).toBeTruthy();
});

// true-up-tracker, "The range explained" and "The headline": under a headline, or the lead itself without one.
test("a true-up year with a headline explains its share under it, muted", () => {
  render(<TrueUpPage range={YEAR_25} years={YEARS} cycles={YEAR_25_26} cost={COST_25_26} savings={SAVINGS_25_26} payback={null} today="2026-11-08"
    explained={{ share: 89, start: "2025-10-03", end: "2026-10-04" }} before={{ label: "'24 - '25", amount_due: 554.83 }} />);
  const [lead, why] = leads();
  expect(lead.textContent).toContain("ended owing");
  expect(why.textContent).toMatch(/^In '25.-.'26 solar covered 89% of the house's use, so the house drew [\d,]+ kWh more from PG&E than it sent\.$/);
  expect(why.className).toContain("text-muted-foreground");
});

test("a true-up year without a headline leads with its explanation, at the lead's size", () => {
  render(<TrueUpPage range={YEAR_25} years={YEARS} cycles={YEAR_25_26} cost={COST_25_26} savings={SAVINGS_25_26} payback={null} today="2026-11-08"
    explained={{ share: 89, start: "2025-10-03", end: "2026-10-04" }} />);
  const [lead] = leads();
  expect(lead.textContent).toMatch(/^In '25.-.'26 solar covered 89%/);
  expect(lead.className).toContain(LEAD);
  expect(screen.queryByText("Grid energy by PG&E billing cycle")).toBeNull();
});

test("All time leads with its explanation, named from the first day of data", () => {
  render(<TrueUpPage range={{ start: "2021-10-01", end: "2027-09-30" }} years={YEARS} cycles={[...YEAR_25_26, ...CURRENT]} cost={null} savings={null} payback={null}
    today="2026-11-08" explained={{ share: 100, start: "2021-10-10", end: "2026-11-08" }} />);
  const [lead] = leads();
  expect(lead.textContent).toMatch(/^Since October 10, 2021 solar has covered 100% of the house's use, yet the house has drawn [\d,]+ kWh more from PG&E than it sent: the Powerwalls lose/);
  expect(lead.className).toContain(LEAD);
  expect(screen.queryByText("Grid energy by PG&E billing cycle")).toBeNull();
});

test("a past custom range is named from and to its cycles' days", () => {
  render(<TrueUpPage range={{ start: "2026-02-10", end: "2026-04-01" }} years={YEARS} cycles={YEAR_25_26.slice(4, 6)} cost={null} savings={null} payback={null}
    today="2026-11-08" explained={{ share: 96, start: "2026-02-05", end: "2026-04-06" }} />);
  expect(leads()[0].textContent).toMatch(/^From February 5 to April 6, 2026 solar covered 96% of the house's use/);
});

test("with nothing to explain yet, the subtitle stays", () => {
  render(page({ start: "2021-10-01", end: "2026-11-08" }, [...YEAR_25_26, ...CURRENT], CURRENT_COST, null));
  expect(screen.getByText("Grid energy by PG&E billing cycle")).toBeTruthy();
  expect(screen.queryByText(/solar (has )?covered/)).toBeNull();
});

// A custom range's figures are its billing cycles', so whether it's under way follows their days, not the days picked.
test("a custom range inside the running cycle reads as under way", () => {
  render(<TrueUpPage range={{ start: "2026-11-01", end: "2026-11-10" }} years={YEARS} cycles={CURRENT.slice(1, 2)} cost={null} savings={null} payback={null}
    today="2026-11-23" explained={{ share: 67, start: "2026-11-03", end: "2026-11-23" }} />);
  expect(leads()[0].textContent).toMatch(/^Since November 3, 2026 solar has covered 67% of the house's use/);
});
