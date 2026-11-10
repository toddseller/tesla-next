// @vitest-environment jsdom
// Ported from anton-tesla-api-ws components/DayView.test.jsx with its values; it mocked Chart.js, these draw with
// Recharts. The estimate note tests are dropped with the notes (solar-day-view, "Flows drawn without estimate markings").
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

import { DayDetails, DayView } from "@/components/solar/day-view";

afterEach(cleanup);

const day = {
  date: "2026-10-16",
  vehicle_data: false,
  totals: { solar_to_home: 12.27, solar_to_powerwall: 20.26, solar_to_grid: 10.77, powerwall_to_home: 17.56,
            powerwall_to_grid: 0, grid_to_home: 0.056, grid_to_powerwall: 0 },
  data: [{ minute: 720, solar_to_home_kw: 1.2, solar_to_powerwall_kw: 4.8, solar_to_grid_kw: 0.4,
           powerwall_to_home_kw: 0, powerwall_to_grid_kw: 0, grid_to_home_kw: 0, grid_to_powerwall_kw: 0,
           battery_percentage: null }],
  off_grid: [],
  storm_watch: [],
};

const areas = (container: HTMLElement) => container.querySelectorAll('[data-testid="day-chart"] .recharts-area');

test("opens on the Solar view", () => {
  render(<DayView day={day} />);

  expect(screen.getByText("Total Generated")).toBeTruthy();
  expect(screen.getByText("43.3")).toBeTruthy();
  expect(screen.getByText("Used By")).toBeTruthy();
  expect(screen.getByRole("tab", { name: "Solar" }).getAttribute("aria-selected")).toBe("true");
});

test("switching to Home shows its total and breakdown", () => {
  render(<DayView day={day} />);

  fireEvent.click(screen.getByRole("tab", { name: "Home" }));

  expect(screen.getByText("Total Usage")).toBeTruthy();
  expect(screen.getByText("29.9")).toBeTruthy();
  expect(screen.getByText("Powered By")).toBeTruthy();
});

describe("Powerwall view", () => {
  const sampled = { ...day, data: [{ ...day.data[0], powerwall_to_home_kw: 1.2, battery_percentage: 48 }] };

  test("shows the power chart, both headlines and the charge level", () => {
    const { container } = render(<DayView day={sampled} />);

    fireEvent.click(screen.getByRole("tab", { name: "Powerwall" }));

    expect(screen.getByText("Discharged")).toBeTruthy();
    expect(screen.getByText("Charged")).toBeTruthy();
    expect(screen.getByTestId("day-chart")).toBeTruthy();
    expect(screen.getByTestId("charge-level-chart")).toBeTruthy();
    expect(screen.getByText("48%")).toBeTruthy();
    expect(areas(container)).toHaveLength(4);
  });

  test("a day without battery samples keeps the power chart; only the charge level becomes a note", () => {
    render(<DayView day={day} />);

    fireEvent.click(screen.getByRole("tab", { name: "Powerwall" }));

    expect(screen.getByTestId("day-chart")).toBeTruthy();
    expect(screen.queryByTestId("charge-level-chart")).toBeNull();
    expect(screen.getByText("Battery history is not available for this day.")).toBeTruthy();
    expect(screen.getByText("Charged From")).toBeTruthy();
  });
});

test("Grid view shows Imported, Exported and the net grid usage", () => {
  render(<DayView day={day} />);
  expect(screen.queryByTestId("net-grid-usage")).toBeNull();

  fireEvent.click(screen.getByRole("tab", { name: "Grid" }));

  expect(screen.getByText("Imported")).toBeTruthy();
  expect(screen.getByText("Exported")).toBeTruthy();
  expect(screen.getByTestId("net-grid-usage").textContent).toBe("Net Grid Usage: 10.7 kWh Exported");
  expect(screen.getByText("Exported From")).toBeTruthy();
});

test("the chart's height follows its width at 4:3, within a phone floor and a window ceiling", () => {
  render(<DayView day={day} />);

  const box = screen.getByTestId("day-chart").className;
  ["aspect-[4/3]", "min-h-[18rem]", "max-h-[70vh]"].forEach((name) => expect(box).toContain(name));
});

test("breakdowns sit in their own column beside the chart from 1280 pixels", () => {
  const { container } = render(<DayView day={day} />);
  const columns = screen.getByTestId("day-main").parentElement!;

  expect(columns.className).toContain("xl:grid");
  expect(columns.className).toContain("xl:grid-cols-");
  expect(screen.getByTestId("day-breakdowns").textContent).toContain("Used By");
  expect(screen.getByTestId("day-main").textContent).not.toContain("Used By");
  expect(container.querySelector('[role="tablist"]')!.parentElement).not.toBe(columns);
});

test("breakdowns for metering noise show dashes instead of percentages", () => {
  const noise = { date: "2026-10-17", totals: { grid_to_home: 0.042, solar_to_grid: 0.019, powerwall_to_grid: 0.024 }, data: [], off_grid: [], storm_watch: [] };
  render(<DayView day={noise} />);

  fireEvent.click(screen.getByRole("tab", { name: "Grid" }));

  expect(screen.getAllByText("–")).toHaveLength(4);
  expect(screen.queryByText(/\d+%/)).toBeNull();
});

describe("Vehicle view", () => {
  const charged = {
    ...day,
    vehicle_data: true,
    vehicle_includes_estimates: true,
    vehicle_includes_session_estimates: true,
    totals: { ...day.totals, solar_to_vehicle: 0, powerwall_to_vehicle: 4.8, grid_to_vehicle: 0 },
    data: [720, 725].map((minute) => ({ ...day.data[0], minute, solar_to_vehicle_kw: 0, powerwall_to_vehicle_kw: 9.6, grid_to_vehicle_kw: 0, vehicle_estimated: true, vehicle: "R2D2" })),
  };

  test("shows Charged and Charged From without naming the car, or saying anything about estimates", () => {
    const { container } = render(<DayView day={charged} />);

    fireEvent.click(screen.getByRole("tab", { name: "Vehicle" }));

    expect(screen.getByText("Charged")).toBeTruthy();
    expect(screen.getByText("4.8")).toBeTruthy();
    expect(screen.getByText("Charged From")).toBeTruthy();
    expect(container.textContent).not.toMatch(/R2D2|T\.I\.E\.|estimat/i);
    const lines = [...container.querySelectorAll(".recharts-line-curve")];
    expect(lines.length).toBeGreaterThan(0);
    expect(lines.filter((line) => line.getAttribute("stroke-dasharray"))).toEqual([]);
  });

  test("a day without vehicle data shows the note instead of a chart", () => {
    render(<DayView day={day} />);

    fireEvent.click(screen.getByRole("tab", { name: "Vehicle" }));

    expect(screen.getByText("Vehicle charging data is not available for this day.")).toBeTruthy();
    expect(screen.queryByTestId("day-chart")).toBeNull();
  });

  test("Solar Used By lists Vehicle only on days with vehicle data", () => {
    const { unmount } = render(<DayView day={charged} />);
    expect(screen.getAllByText("Vehicle").length).toBeGreaterThan(1); // tab + Used By line
    unmount();

    render(<DayView day={day} />);
    expect(screen.getAllByText("Vehicle")).toHaveLength(1); // tab only
  });

  test("five tabs fit in one row", () => {
    render(<DayView day={day} />);

    expect(screen.getAllByRole("tab").map((t) => t.textContent)).toEqual(["Solar", "Home", "Vehicle", "Powerwall", "Grid"]);
    expect(screen.getByRole("tablist").className).toContain("grid-cols-5");
  });
});

test("the view chosen stays when the day changes", () => {
  const { rerender } = render(<DayView day={day} />);
  fireEvent.click(screen.getByRole("tab", { name: "Grid" }));
  rerender(<DayView day={{ ...day, date: "2026-10-17" }} />);
  expect(screen.getByRole("tab", { name: "Grid" }).getAttribute("aria-selected")).toBe("true");
});

test("a step's details show its time and each flow's power", () => {
  render(
    <DayDetails
      active
      label={750}
      payload={[
        { dataKey: "solar_to_home", name: "Home", value: 1.39, color: "var(--color-home)" },
        { dataKey: "solar_to_vehicle", name: "Vehicle", value: 0, color: "var(--color-vehicle)" },
        { dataKey: "solar_to_powerwall", name: "Powerwall", value: 5.62, color: "var(--color-powerwall)" },
        { dataKey: "solar_to_grid", name: "Grid", value: 0, color: "var(--color-grid)" },
      ]}
    />,
  );
  expect(screen.getByText("12:30 PM")).toBeTruthy();
  expect(screen.getByText("1.39 kW")).toBeTruthy();
  expect(screen.getByText("5.62 kW")).toBeTruthy();
  expect(screen.getAllByText("0 kW")).toHaveLength(2);
});

test("a step's details give magnitudes for flows below zero", () => {
  render(<DayDetails active label={720} payload={[{ dataKey: "solar_to_powerwall", name: "Solar", value: -3.4, color: "var(--color-solar)" }]} />);
  expect(screen.getByText("3.4 kW")).toBeTruthy();
});

test("switching views and back stacks the bands in the view's own order", () => {
  const steps = [720, 725].map((minute) => ({ ...day.data[0], minute }));
  const { container } = render(<DayView day={{ ...day, data: steps }} />);
  const bottom = () => {
    const areas = [...container.querySelectorAll('[data-testid="day-chart"] .recharts-area-area')];
    const lowest = (path: Element) => Math.max(...path.getAttribute("d")!.match(/,(-?[\d.]+)/g)!.map((y) => Number(y.slice(1))));
    const floor = Math.max(...areas.map(lowest));
    return areas.filter((path) => lowest(path) === floor).map((path) => path.getAttribute("fill"));
  };
  expect(bottom()).toEqual(["var(--color-home)"]);
  fireEvent.click(screen.getByRole("tab", { name: "Powerwall" }));
  fireEvent.click(screen.getByRole("tab", { name: "Solar" }));
  expect(bottom()).toEqual(["var(--color-home)"]);
});

test("a step's details list the flows, not their outlines", () => {
  render(
    <DayDetails
      active
      label={890}
      payload={[
        { dataKey: "solar_to_home", name: "Home", value: 4.97, color: "var(--color-home)" },
        { dataKey: "solar_to_home_top", name: "solar_to_home_top", value: 4.97, color: "var(--color-home)" },
        { dataKey: "solar_to_grid_top", name: "solar_to_grid_top", value: 5.1899999999999995, color: "var(--color-grid)" },
      ]}
    />,
  );
  expect(screen.queryByText(/_top/)).toBeNull();
  expect(screen.getAllByText(/ kW$/)).toHaveLength(1);
});

test("stepping onto a day with vehicle data stacks the car's band where it belongs", () => {
  const flows = { solar_to_home_kw: 1, solar_to_vehicle_kw: 1, solar_to_powerwall_kw: 1, solar_to_grid_kw: 1 };
  const steps = [720, 725].map((minute) => ({ minute, ...flows }));
  const { container, rerender } = render(<DayView day={{ date: "2021-10-31", vehicle_data: false, totals: {}, data: steps, off_grid: [], storm_watch: [] }} />);
  rerender(<DayView day={{ date: "2021-11-01", vehicle_data: true, totals: {}, data: steps, off_grid: [], storm_watch: [] }} />);
  // Each band's lower edge sits higher than the one beneath it, so ordering by lower edge gives the stack bottom-up.
  const lowerEdge = (path: Element) => Math.max(...path.getAttribute("d")!.match(/,(-?[\d.]+)/g)!.map((y) => Number(y.slice(1))));
  const bands = [...container.querySelectorAll('[data-testid="day-chart"] .recharts-area-area')]
    .sort((a, b) => lowerEdge(b) - lowerEdge(a))
    .map((path) => path.getAttribute("fill"));
  expect(bands).toEqual(["var(--color-home)", "var(--color-vehicle)", "var(--color-powerwall)", "var(--color-grid)"]);
});

test("the charge level's details are in percent", () => {
  render(<DayDetails active label={120} payload={[{ dataKey: "level", name: "Battery", value: 48, unit: "%", color: "var(--color-powerwall)" }]} />);
  expect(screen.getByText("48%")).toBeTruthy();
  expect(screen.queryByText(/kW/)).toBeNull();
});

describe("off-grid and storm watch spans", () => {
  const spans = {
    ...day,
    off_grid: [{ start: "2026-10-16T21:51:38Z", end: "2026-10-18T03:07:50Z", kind: "outage" }],
    storm_watch: [{ start: "2026-10-16T19:00:00Z", end: null }],
  };
  const shading = (container: HTMLElement, selector: string) => container.querySelectorAll(`${selector} .recharts-reference-area`).length;

  test("every view shades them and lists them under the charts", () => {
    const { container } = render(<DayView day={spans} />);
    expect(shading(container, '[data-testid="day-chart"]')).toBe(2);
    expect(screen.getByRole("list", { name: "Off grid and storm watch" }).textContent).toBe(
      "Off grid (outage) 2:51 PM to midnightStorm watch 12:00 PM to now, 0.0 kWh charged from the grid",
    );
    fireEvent.click(screen.getByRole("tab", { name: "Powerwall" }));
    expect(shading(container, '[data-testid="day-chart"]')).toBe(2);
  });

  test("two blips in the same minute are two lines", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const blip = (seconds: number) => ({ start: `2026-10-16T16:14:${seconds}Z`, end: `2026-10-16T16:14:${seconds + 5}Z`, kind: "blip" });
    render(<DayView day={{ ...day, off_grid: [blip(10), blip(40)] }} />);
    expect(screen.getByRole("list", { name: "Off grid and storm watch" }).children).toHaveLength(2);
    expect(error.mock.calls.flat().join(" ")).not.toMatch(/same key/);
    error.mockRestore();
  });

  test("a day without spans has no shading and no list", () => {
    const { container } = render(<DayView day={day} />);
    expect(shading(container, '[data-testid="day-chart"]')).toBe(0);
    expect(screen.queryByRole("list", { name: "Off grid and storm watch" })).toBeNull();
  });
});

describe("selecting a span", () => {
  // A plot 1,440 pixels wide beside the 56-pixel axis: one pixel a minute.
  const area = () => {
    const box = screen.getByTestId("span-area");
    vi.spyOn(box, "getBoundingClientRect").mockReturnValue({ left: 0, width: 1496, top: 0, height: 300, right: 1496, bottom: 300, x: 0, y: 0, toJSON: () => ({}) });
    return box;
  };
  const drag = (from: number, to: number, pointerType = "mouse") => {
    const box = area();
    fireEvent.pointerDown(box, { clientX: from, pointerType, button: 0, pointerId: 1 });
    fireEvent.pointerMove(box, { clientX: (from + to) / 2, pointerType, pointerId: 1 });
    fireEvent.pointerMove(box, { clientX: to, pointerType, pointerId: 1 });
    fireEvent.pointerUp(box, { clientX: to, pointerType, pointerId: 1 });
  };
  // The span's name, in its pill; a phone's breakdowns repeat it.
  const selected = () => screen.queryAllByText(/^\d+:\d\d [AP]M to \d+:\d\d [AP]M$/)[0]?.textContent ?? null;

  test("a mouse drag selects the steps it covers, to the end of the day, with Clear", () => {
    render(<DayView day={day} />);
    drag(962, 1495);
    expect(selected()).toBe("4:00 PM to 12:00 AM");
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(selected()).toBeNull();
  });

  test("dragging leftwards selects the same span", () => {
    render(<DayView day={day} />);
    drag(1003, 541);
    expect(selected()).toBe("9:00 AM to 4:45 PM");
  });

  test("a click without a drag selects nothing", () => {
    render(<DayView day={day} />);
    const box = area();
    fireEvent.pointerDown(box, { clientX: 750, pointerType: "mouse", button: 0, pointerId: 1 });
    fireEvent.pointerUp(box, { clientX: 752, pointerType: "mouse", pointerId: 1 });
    expect(selected()).toBeNull();
  });

  test("the span stays across views and a reload of the day, and ends when another day opens", () => {
    const { rerender } = render(<DayView day={day} />);
    drag(960, 1495);
    fireEvent.click(screen.getByRole("tab", { name: "Grid" }));
    expect(selected()).toBe("4:00 PM to 12:00 AM");
    rerender(<DayView day={{ ...day, data: [...day.data] }} />);
    expect(selected()).toBe("4:00 PM to 12:00 AM");
    rerender(<DayView day={{ ...day, date: "2026-10-17" }} />);
    expect(selected()).toBeNull();
  });

  // Grid: 0.5 kWh imported and 0.2 kWh exported at 3:00 PM, then 0.3 kWh imported at 4:00 and at 4:40 PM.
  const gridDay = {
    ...day,
    totals: { ...day.totals, solar_to_grid: 0.2, grid_to_home: 1.1, grid_to_powerwall: 0, powerwall_to_grid: 0 },
    data: [
      { minute: 900, grid_to_home_wh: 500, solar_to_grid_wh: 200 },
      { minute: 960, grid_to_home_wh: 300, solar_to_grid_wh: 0 },
      { minute: 1000, grid_to_home_wh: 300, solar_to_grid_wh: 0 },
    ],
  };
  const inside = (testId: string) => screen.getByTestId(testId);
  const shown = (el: Element, text: string, classPart: string) =>
    [...el.querySelectorAll("*")].some((node) => node.textContent === text && String((node as HTMLElement).className).includes(classPart));

  test("from 640 pixels the span's figures sit beside the day's; on a phone they take their place", () => {
    render(<DayView day={gridDay} />);
    fireEvent.click(screen.getByRole("tab", { name: "Grid" }));
    expect(shown(inside("day-main"), "1.1 kWh", "max-sm:hidden")).toBe(false);
    drag(960, 1495);
    const main = inside("day-main");
    // From 640 pixels: the day's Imported 1.1 stays, with the span's 0.6 under it.
    expect(shown(main, "1.1 kWh", "max-sm:hidden")).toBe(true);
    expect(shown(main, "0.6 kWh 4 PM to 12 AM", "max-sm:hidden")).toBe(true);
    // On a phone: the span's 0.6 in its place.
    expect(shown(main, "0.6 kWh", "sm:hidden")).toBe(true);
    const net = inside("net-grid-usage");
    expect(shown(net, "Net Grid Usage: 0.9 kWh Imported", "max-sm:hidden")).toBe(true);
    expect(shown(net, "0.6 kWh Imported, 4 PM to 12 AM", "max-sm:hidden")).toBe(true);
    expect(shown(net, "Net Grid Usage: 0.6 kWh Imported", "sm:hidden")).toBe(true);
    const breakdowns = inside("day-breakdowns");
    expect(shown(breakdowns, "4 PM to 12 AM", "max-sm:hidden")).toBe(true);
    const home = [...breakdowns.querySelectorAll("li")].find((li) => li.textContent!.startsWith("Home"))!;
    expect(shown(home, "1.1 kWh", "max-sm:hidden")).toBe(true);
    expect(shown(home, "0.6 kWh", "max-sm:hidden")).toBe(true);
    expect(shown(home, "0.6 kWh", "sm:hidden")).toBe(true);
    expect(shown(home, "100%", "sm:hidden")).toBe(true);
  });

  test("without a chart to drag across there is no hint and no Select", () => {
    render(<DayView day={day} />);
    fireEvent.click(screen.getByRole("tab", { name: "Vehicle" }));
    expect(screen.getByText("Vehicle charging data is not available for this day.")).toBeTruthy();
    expect(screen.queryByText(/^Drag across the chart/)).toBeNull();
    expect(screen.queryByRole("button", { name: "Select" })).toBeNull();
  });

  test("a finger drag reads values unless Select is on, which turns off once the span is made", () => {
    render(<DayView day={day} />);
    const toggle = screen.getByRole("button", { name: "Select" });
    expect(toggle.className).toContain("pointer-coarse:flex");
    drag(960, 1495, "touch");
    expect(selected()).toBeNull();
    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByTestId("span-area").className).toContain("touch-none");
    drag(960, 1495, "touch");
    expect(selected()).toBe("4:00 PM to 12:00 AM");
    expect(toggle.getAttribute("aria-pressed")).toBe("false");
  });
});
