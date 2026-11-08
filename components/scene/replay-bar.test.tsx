// @vitest-environment jsdom
// Ported from anton-tesla-api-ws tesla-api-frontend/client/src/components/ReplayBar.test.jsx. anton's mocked MUI's
// date picker and read its props; this bar's picker is shadcn's Calendar in a Popover, driven as a visitor would.
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, test, vi } from "vitest";

import ReplayBar, { DEFAULT_SPEED, SPEEDS } from "@/components/scene/replay-bar";
import { daySpan } from "@/lib/scene/replay";

afterEach(cleanup);

// Radix positions the popover with ResizeObserver, which jsdom lacks.
beforeAll(() => {
  globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
});

type Props = Partial<Parameters<typeof ReplayBar>[0]>;
const handlers = () => ({ onDay: vi.fn(), onTime: vi.fn(), onPlay: vi.fn(), onSpeed: vi.fn(), onLive: vi.fn() });
const bar = (props: Props = {}) => {
  const on = handlers();
  const day = props.day ?? "2026-10-19";
  render(
    <ReplayBar live={false} day={day} today="2026-10-20" time={Date.parse("2026-10-19T18:35:00-07:00")}
      span={daySpan(day)} playing={false} speed={DEFAULT_SPEED} {...on} {...props} />
  );
  return on;
};
const openPicker = () => act(() => fireEvent.click(screen.getByRole("button", { name: "Day" })));
// react-day-picker names each day button by its full date, e.g. "Wednesday, October 21st, 2026".
const dayButton = (name: RegExp) => screen.getByRole("button", { name });

test("shows the replayed time at the site", () => {
  bar();
  expect(screen.getByText("6:35 PM")).toBeTruthy();
});

test("the day field is labelled Day for screen readers, and shows the day", () => {
  bar();
  expect(screen.getByRole("button", { name: "Day" }).textContent).toBe("Mon, Oct 19, 2026");
});

test("the day is bounded by the first day of service and today", () => {
  bar({ day: "2026-10-20" });
  expect((screen.getByRole("button", { name: "Next day" }) as HTMLButtonElement).disabled).toBe(true);
  openPicker();
  expect((dayButton(/October 20th, 2026/) as HTMLButtonElement).disabled).toBe(false);
  expect((dayButton(/October 21st, 2026/) as HTMLButtonElement).disabled).toBe(true);
});

test("no day before the first day of service", () => {
  bar({ day: "2021-10-10" });
  expect((screen.getByRole("button", { name: "Previous day" }) as HTMLButtonElement).disabled).toBe(true);
  openPicker();
  expect((dayButton(/October 9th, 2021/) as HTMLButtonElement).disabled).toBe(true);
  expect((dayButton(/October 10th, 2021/) as HTMLButtonElement).disabled).toBe(false);
});

test("speeds are real time and 1, 10 and 60 replay minutes per second, starting at real time", () => {
  bar();
  expect(SPEEDS.map(({ value }) => value)).toEqual([1, 60, 600, 3600]);
  const select = screen.getByRole("combobox", { name: "Speed" }) as HTMLSelectElement;
  expect([...select.options].map((o) => o.textContent)).toEqual(["Real time", "1 min/s", "10 min/s", "60 min/s"]);
  expect(select.value).toBe("1");
});

test("each control reports to the page", () => {
  const on = bar();

  fireEvent.click(screen.getByRole("button", { name: "Previous day" }));
  expect(on.onDay).toHaveBeenCalledWith("2026-10-18");
  fireEvent.click(screen.getByRole("button", { name: "Next day" }));
  expect(on.onDay).toHaveBeenCalledWith("2026-10-20");
  openPicker();
  act(() => fireEvent.click(dayButton(/October 1st, 2026/)));
  expect(on.onDay).toHaveBeenCalledWith("2026-10-01");
  fireEvent.click(screen.getByRole("button", { name: "Play" }));
  expect(on.onPlay).toHaveBeenCalled();
  fireEvent.change(screen.getByRole("combobox", { name: "Speed" }), { target: { value: "600" } });
  expect(on.onSpeed).toHaveBeenCalledWith(600);
  fireEvent.change(screen.getByRole("slider", { name: "Time" }), { target: { value: String(Date.parse("2026-10-19T12:00:00-07:00")) } });
  expect(on.onTime).toHaveBeenCalledWith(Date.parse("2026-10-19T12:00:00-07:00"));
  fireEvent.click(screen.getByRole("button", { name: "LIVE" }));
  expect(on.onLive).toHaveBeenCalled();
});

test("while playing, the button pauses", () => {
  bar({ playing: true });
  expect(screen.getByRole("button", { name: "Pause" })).toBeTruthy();
});

describe("holding the bar shown", () => {
  const held = (props: Props = {}) => {
    const onHold = vi.fn();
    bar({ onHold, ...props });
    return onHold;
  };

  test("while the date picker is open", () => {
    const onHold = held();
    openPicker();
    expect(onHold).toHaveBeenLastCalledWith(true);
    act(() => fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" }));
    expect(onHold).toHaveBeenLastCalledWith(false);
  });

  test("while the speed menu has focus, until a speed is picked", () => {
    const onHold = held();
    const select = screen.getByRole("combobox", { name: "Speed" });
    fireEvent.focus(select);
    expect(onHold.mock.calls).toEqual([[true]]);
    fireEvent.change(select, { target: { value: "600" } });
    fireEvent.blur(select);
    expect(onHold.mock.calls).toEqual([[true], [false]]);
  });

  test("while the scrubber is held, wherever it is let go", () => {
    const onHold = held();
    fireEvent.pointerDown(screen.getByRole("slider", { name: "Time" }));
    expect(onHold).toHaveBeenLastCalledWith(true);
    fireEvent.pointerUp(window);
    expect(onHold.mock.calls).toEqual([[true], [false]]);
    fireEvent.pointerUp(window);
    expect(onHold).toHaveBeenCalledTimes(2);
  });

  test("not for a click on a button", () => {
    const onHold = held();
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    expect(onHold).not.toHaveBeenCalled();
  });
});
