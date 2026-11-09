// carCharging works out a finished day once per server process, and yesterday and today every time (car-charging design).
import { expect, test, vi } from "vitest";

const dayCharging = vi.hoisted(() => vi.fn(async () => ({ charging: new Map(), measuredVins: new Map(), intervals: [] })));
vi.mock("@/lib/intervals/intervals", () => ({ dayCharging, intervalWh: () => ({}) }));
vi.mock("@/lib/intervals/vehicles", () => ({ loadCars: async () => [], carName: () => "Vehicle" }));
vi.mock("@/lib/db", () => ({ db: { query: async () => ({ rows: [{ first: "2026-10-05", cars: "2026-10-17" }] }) } }));

// Yesterday too: a session plugged in yesterday can charge today, past what today's data holds so far.
test("a second call works out only yesterday and today again", async () => {
  const { carCharging } = await import("./car-charging");
  await carCharging("2026-11-07", "2026-11-09", "2026-11-09");
  await carCharging("2026-11-07", "2026-11-09", "2026-11-09");
  const days = dayCharging.mock.calls.map((call: unknown[]) => call[0]);
  expect(days.filter((day) => day === "2026-11-07")).toHaveLength(1);
  expect(days.filter((day) => day === "2026-11-08")).toHaveLength(2);
  expect(days.filter((day) => day === "2026-11-09")).toHaveLength(2);
});
