import { expect, test } from "vitest";
import { gridPill, liveStatus } from "./live-status";

const status = { battery_percentage: 92, battery_status: "Charging", modified: "2026-11-08T09:59:20-08:00" };
const at = (iso: string) => new Date(iso);

test("a fresh status reads LIVE with its time, charge and state", () => {
  expect(liveStatus(status, at("2026-11-08T10:00:00-08:00"))).toEqual({ live: true, word: "LIVE", time: "9:59 AM", pill: "PW 92% · CHARGING" });
});

test("two minutes old, it reads LAST and keeps what it last said", () => {
  expect(liveStatus(status, at("2026-11-08T10:01:19-08:00")).live).toBe(true);
  expect(liveStatus(status, at("2026-11-08T10:01:20-08:00"))).toEqual({ live: false, word: "LAST", time: "9:59 AM", pill: "PW 92% · CHARGING" });
});

test("the time is the site's, whatever the browser's zone", () => {
  expect(liveStatus({ ...status, modified: "2026-11-08T21:05:00Z" }, at("2026-11-08T21:05:30Z")).time).toBe("1:05 PM");
});

test("no status yet shows dashes", () => {
  expect(liveStatus(null, at("2026-11-08T10:00:00-08:00"))).toEqual({ live: false, word: "LIVE", time: "—", pill: "PW — · —" });
});

test("a status without a charge or a state shows dashes for them", () => {
  expect(liveStatus({ ...status, battery_percentage: null, battery_status: null }, at("2026-11-08T10:00:00-08:00")).pill).toBe("PW — · —");
});

const outage = { island_status: "off_grid_unintentional", storm_mode_active: false };
const stretch = (island_status: string, storm_mode_active = false) => ({ start: "2026-11-09T14:25:52Z", island_status, storm_mode_active });

test("an outage with its stretch stored reads OFF GRID SINCE the stretch's start, in the site's time", () => {
  expect(gridPill(outage, stretch("off_grid_unintentional"))).toEqual({ kind: "outage", text: "OFF GRID SINCE 6:25 AM" });
});

test("an outage whose stretch isn't stored yet reads OFF GRID with no time", () => {
  expect(gridPill(outage, stretch("on_grid"))).toEqual({ kind: "outage", text: "OFF GRID" });
  expect(gridPill(outage, null)).toEqual({ kind: "outage", text: "OFF GRID" });
});

test("any off_grid status but the intentional one is an outage", () => {
  expect(gridPill({ island_status: "off_grid", storm_mode_active: false }, null)).toEqual({ kind: "outage", text: "OFF GRID" });
});

test("a Go Off-Grid test reads OFF GRID TEST", () => {
  expect(gridPill({ island_status: "off_grid_intentional", storm_mode_active: false }, stretch("off_grid_intentional"))).toEqual({ kind: "test", text: "OFF GRID TEST" });
});

test("storm watch on the grid reads STORM WATCH; during an outage, OFF GRID wins", () => {
  expect(gridPill({ island_status: "on_grid", storm_mode_active: true }, null)).toEqual({ kind: "storm", text: "STORM WATCH" });
  expect(gridPill({ ...outage, storm_mode_active: true }, null)).toEqual({ kind: "outage", text: "OFF GRID" });
});

test("on the grid, without the fields, or with no status, there is no pill", () => {
  expect(gridPill({ island_status: "on_grid", storm_mode_active: false }, stretch("on_grid"))).toBeNull();
  expect(gridPill(status, null)).toBeNull();
  expect(gridPill(null, null)).toBeNull();
});
