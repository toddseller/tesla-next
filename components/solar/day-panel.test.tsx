// @vitest-environment jsdom
// The day view on the Solar page: moving between days, the days strip, returning to the range and staying current,
// from the solar-day-view spec.
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { SolarPage } from "@/components/solar/solar-page";
import type { RangeItem } from "@/lib/range";
import { FakeStream } from "@/test/fake-event-source";

const router = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));
// site-motion, "A day step slides the day": the stand-in shows which slide the day's content gets for each type.
vi.mock("react", async (original) => ({
  ...(await original<typeof import("react")>()),
  ViewTransition: ({ update, children }: { update: Record<string, string>; children: React.ReactNode }) => (
    <div data-testid="day-transition" data-update={JSON.stringify(update)}>{children}</div>
  ),
}));
const NEXT = { transitionTypes: ["day-next"] };
const PREVIOUS = { transitionTypes: ["day-previous"] };
vi.mock("next/link", () => ({ default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => <a href={href} {...rest}>{children}</a> }));

const october = { start: "2026-10-01", end: "2026-10-31" };
const stripItems: RangeItem[] = Array.from({ length: 31 }, (_, i) => ({
  date: `Oct ${i + 1}`, day: `2026-10-${String(i + 1).padStart(2, "0")}`, solar: 30 + i, grid: 1, house: 2,
}));
const dayOf = (date: string) => ({ date, vehicle_data: false, totals: { solar_to_home: 12.27 }, data: [], off_grid: [], storm_watch: [] });

const page = (date: string, extra: Partial<Parameters<typeof SolarPage>[0]> = {}) => (
  <SolarPage range={october} items={stripItems} today="2026-11-07" initialStatus={null}
    day={{ data: dayOf(date), strip: { range: october, items: stripItems } }} {...extra} />
);

let fetches: string[];

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(Date.parse("2026-11-07T20:00:00Z"));
  FakeStream.opened = [];
  vi.stubGlobal("EventSource", FakeStream);
  fetches = [];
  vi.stubGlobal("fetch", (url: string) => {
    fetches.push(url);
    const body = url.startsWith("/api/intervals") ? dayOf(url.slice(-10)) : { data: stripItems };
    return Promise.resolve({ ok: true, json: () => body });
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
  router.push.mockReset();
  router.replace.mockReset();
});

const button = (name: string | RegExp) => screen.getByRole("button", { name }) as HTMLButtonElement;
const settle = () => act(() => new Promise((resolve) => setTimeout(resolve, 0)));

test("the day is shown with its date, and the range's link returns to it", () => {
  render(page("2026-10-14"));
  expect(button("Day").textContent).toBe("Wed, Oct 14, 2026");
  expect(screen.queryByText("Solar by date range")).toBeNull();
  const back = screen.getByRole("link", { name: "October 2026" });
  expect(back.getAttribute("href")).toBe("/?start=2026-10-01&end=2026-10-31");
});

test("previous and next replace the day in the address, keeping the range", () => {
  render(page("2026-10-14"));
  fireEvent.click(button("Next day"));
  expect(router.replace).toHaveBeenCalledWith("/?start=2026-10-01&end=2026-10-31&day=2026-10-15", NEXT);
  fireEvent.click(button("Previous day"));
  expect(router.replace).toHaveBeenLastCalledWith("/?start=2026-10-01&end=2026-10-31&day=2026-10-13", PREVIOUS);
  expect(router.push).not.toHaveBeenCalled();
});

test("stepping past the range keeps going, with the range unchanged", () => {
  render(page("2026-10-31"));
  fireEvent.click(button("Next day"));
  expect(router.replace).toHaveBeenCalledWith("/?start=2026-10-01&end=2026-10-31&day=2026-11-01", NEXT);
});

test("there is no next day after today and no previous day before the first day of service", () => {
  render(page("2026-11-07", { range: { start: "2026-11-01", end: "2026-11-30" } }));
  expect(button("Next day").disabled).toBe(true);
  fireEvent.keyDown(window, { key: "ArrowRight" });
  expect(router.replace).not.toHaveBeenCalled();
  act(() => fireEvent.click(button("Day")));
  expect(button(/November 8th, 2026/).disabled).toBe(true);
  cleanup();
  render(page("2021-10-10", { range: { start: "2021-10-01", end: "2021-10-31" } }));
  expect(button("Previous day").disabled).toBe(true);
});

test("the arrow keys step a day, unless a modifier is held or a field has focus", () => {
  render(page("2026-10-14"));
  fireEvent.keyDown(window, { key: "ArrowLeft" });
  expect(router.replace).toHaveBeenCalledWith("/?start=2026-10-01&end=2026-10-31&day=2026-10-13", PREVIOUS);
  fireEvent.keyDown(window, { key: "ArrowRight", altKey: true });
  fireEvent.keyDown(window, { key: "ArrowRight", metaKey: true });
  const field = document.body.appendChild(document.createElement("input"));
  fireEvent.keyDown(field, { key: "ArrowRight" });
  field.remove();
  expect(router.replace).toHaveBeenCalledTimes(1);
});

test("the calendar opens a day, and arrow keys inside it move the calendar, not the day", () => {
  render(page("2026-10-14"));
  act(() => fireEvent.click(button("Day")));
  // react-day-picker names each day button by its full date, e.g. "Saturday, October 3rd, 2026".
  fireEvent.keyDown(button(/October 3rd, 2026/), { key: "ArrowRight" });
  expect(router.replace).not.toHaveBeenCalled();
  fireEvent.click(button(/October 3rd, 2026/));
  expect(router.replace).toHaveBeenCalledWith("/?start=2026-10-01&end=2026-10-31&day=2026-10-03", PREVIOUS);
});

test("the strip shows the range's days with the shown day marked, and opens any of them", () => {
  render(page("2026-10-14"));
  const strip = screen.getByRole("navigation", { name: "Days" });
  const days = strip.querySelectorAll("button");
  expect(days).toHaveLength(31);
  expect(days[13].getAttribute("aria-current")).toBe("date");
  expect(days[13].getAttribute("aria-label")).toBe("Oct 14, 43 kWh solar");
  fireEvent.click(days[2]);
  expect(router.replace).toHaveBeenCalledWith("/?start=2026-10-01&end=2026-10-31&day=2026-10-03", PREVIOUS);
});

test("today's day view shows the latest live update's time; other days don't", () => {
  const status = JSON.stringify({ modified: "2026-11-07T19:47:00Z" });
  render(page("2026-11-07", { range: { start: "2026-11-01", end: "2026-11-30" }, initialStatus: status }));
  // Exact text: the server renders it, so the browser must render the same.
  expect(screen.getByText(/Last updated/).textContent).toBe("Last updated at 11:47 AM");
  FakeStream.opened[0].send({ modified: "2026-11-07T19:52:00Z" });
  expect(screen.getByText("Last updated at 11:52 AM")).toBeTruthy();
  cleanup();
  render(page("2026-10-14", { initialStatus: status }));
  expect(screen.queryByText(/Last updated/)).toBeNull();
});

test("totals for the shown day reload it and the strip; totals for another strip day reload the strip only; others nothing", async () => {
  render(page("2026-10-14"));
  FakeStream.opened[0].send({ date: "2026-09-30" }, "totals");
  await settle();
  expect(fetches).toEqual([]);
  FakeStream.opened[0].send({ date: "2026-10-14" }, "totals");
  await settle();
  expect(fetches).toEqual(["/api/intervals?date=2026-10-14", "/api/range?start_date=2026-10-01&end_date=2026-10-31"]);
  FakeStream.opened[0].send({ date: "2026-10-20" }, "totals");
  await settle();
  expect(fetches.slice(2)).toEqual(["/api/range?start_date=2026-10-01&end_date=2026-10-31"]);
});

test("on a narrow screen the strip opens scrolled to the shown day", () => {
  // jsdom lays nothing out, so each day button stands 40 pixels after the one before, in a 120 pixel strip.
  const offset = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetLeft");
  Object.defineProperty(HTMLElement.prototype, "offsetLeft", {
    configurable: true,
    get(this: HTMLElement) { return this.parentElement ? [...this.parentElement.children].indexOf(this) * 40 : 0; },
  });
  Object.defineProperty(HTMLElement.prototype, "clientWidth", { configurable: true, get: () => 120 });
  try {
    render(page("2026-10-14"));
    const strip = screen.getByRole("navigation", { name: "Days" });
    // Oct 14's button starts at 520 and is as wide as the strip here, so centering it scrolls 520.
    expect(strip.scrollLeft).toBe(520);
  } finally {
    Object.defineProperty(HTMLElement.prototype, "offsetLeft", offset!);
    delete (HTMLElement.prototype as { clientWidth?: number }).clientWidth;
  }
});

test("the day's content slides the way the step went, and only for a day step", () => {
  render(page("2026-10-14"));
  const transition = screen.getByTestId("day-transition");
  expect(JSON.parse(transition.dataset.update!)).toEqual({ "day-next": "slide-next", "day-previous": "slide-previous", default: "none" });
  expect(transition.querySelector('[role="tablist"]')).not.toBeNull();
  expect(transition.contains(button("Next day"))).toBe(false);
  expect(transition.contains(screen.getByRole("navigation", { name: "Days" }))).toBe(false);
});

test("a later day from the strip slides in as a step forward", () => {
  render(page("2026-10-14"));
  fireEvent.click(screen.getByRole("button", { name: /^Oct 20,/ }));
  expect(router.replace).toHaveBeenCalledWith("/?start=2026-10-01&end=2026-10-31&day=2026-10-20", NEXT);
});
