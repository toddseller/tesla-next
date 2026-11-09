import { expect, test } from "vitest";
import { liveStatus } from "./live-status";

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
