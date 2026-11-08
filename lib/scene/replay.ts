// Pure, so every rule is tested here; the page only keeps the replay's time and draws this. See the scene-replay
// spec.

import { ACTIVE_KW, type Link, type LiveInput } from "@/lib/scene/live-scene";

// The site's first day of service: no history before it.
export const FIRST_DAY = "2021-10-10";
// The site's clock, whatever the viewer's own time zone.
export const TIME_ZONE = "America/Los_Angeles";
export const STEP_MS = 5 * 60 * 1000;

const wallParts = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE, hourCycle: "h23",
  year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
});

export const wallTime = (ms: number) => {
  const p = Object.fromEntries(wallParts.formatToParts(new Date(ms)).map(({ type, value }) => [type, value]));
  return { date: `${p.year}-${p.month}-${p.day}`, hour: Number(p.hour), minute: Number(p.minute) };
};

export const siteToday = (now = Date.now()) => wallTime(now).date;

const utcFields = (date: string, hour: number, minute: number) => {
  const [y, m, d] = date.split("-").map(Number);
  return Date.UTC(y, m - 1, d, hour, minute);
};

// On the fall-back night, 1:00 to 2:00 AM is the first one.
export const siteInstant = (date: string, hour = 0, minute = 0) => {
  const wanted = utcFields(date, hour, minute);
  let t = wanted;
  for (let i = 0; i < 2; i += 1) {
    const shown = wallTime(t);
    t += wanted - utcFields(shown.date, shown.hour, shown.minute);
  }
  return t;
};

export const shiftDay = (date: string, days: number) => {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
};

// 23 or 25 hours on the days the clocks change.
export const daySpan = (date: string) => ({ start: siteInstant(date), end: siteInstant(shiftDay(date, 1)) });

// The recorded flows by source, each in the order the live page links them,
// so a replayed flow keeps the lane it would have live. Vehicle flows go to the car.
const FLOWS = [
  ["solar", "powerwall"], ["solar", "home"], ["solar", "vehicle"], ["solar", "grid"],
  ["powerwall", "home"], ["powerwall", "vehicle"], ["powerwall", "grid"],
  ["grid", "home"], ["grid", "vehicle"], ["grid", "powerwall"],
].map(([from, to]) => ({ from, to: to === "vehicle" ? "car" : to, key: `${from}_to_${to}_kw` }) as Pick<Link, "from" | "to"> & { key: string });

// Each flow's kW is null in a record without energy data.
export type IntervalRecord = { start: string; battery_percentage?: number | null; vehicle?: string | null; [key: string]: unknown };
type Flows = Record<string, number>;
export type Moment = { flows: Flows | null; battery: number | null; vehicle: string | null };
export type Step = Moment & { start: number };

export const toSteps = (records: IntervalRecord[] = []): Step[] =>
  records
    .map((r) => ({
      start: Date.parse(r.start),
      flows: r[FLOWS[0].key] == null ? null : (Object.fromEntries(FLOWS.map(({ key }) => [key, r[key]])) as Flows),
      battery: r.battery_percentage ?? null,
      vehicle: r.vehicle ?? null,
    }))
    .sort((a, b) => a.start - b.start);

// The latest step with flows, since the battery is sampled live while Tesla publishes each step's energy minutes
// later.
export const dataEnd = (steps: Step[]) => {
  if (!steps.length) return null;
  const last = steps.findLast((s) => s.flows) ?? steps[steps.length - 1];
  return last.start + STEP_MS;
};

const lerp = (a: number, b: number, f: number) => a + (b - a) * f;

// A power value is the average over its step, so it stands for the step's middle and blends to the neighboring
// step's middle; battery charge is read at the step's start. A value never blends toward a step without it.
export const momentAt = (steps: Step[], t: number): Moment => {
  const i = steps.findIndex((s) => s.start <= t && t < s.start + STEP_MS);
  if (i < 0) return { flows: null, battery: null, vehicle: null };
  const step = steps[i];
  const adjacent = (other: Step | undefined): other is Step => !!other && Math.abs(other.start - step.start) === STEP_MS;

  let flows = step.flows;
  const neighbor = t < step.start + STEP_MS / 2 ? steps[i - 1] : steps[i + 1];
  if (flows && adjacent(neighbor) && neighbor.flows) {
    const [a, b] = neighbor.start < step.start ? [neighbor, step] : [step, neighbor];
    const f = (t - (a.start + STEP_MS / 2)) / STEP_MS;
    flows = Object.fromEntries(Object.keys(a.flows!).map((key) => [key, lerp(a.flows![key], b.flows![key], f)]));
  }

  let { battery } = step;
  const next = steps[i + 1];
  if (battery != null && adjacent(next) && next.battery != null) {
    battery = lerp(battery, next.battery, (t - step.start) / STEP_MS);
  }

  return { flows, battery, vehicle: step.vehicle };
};

// The links come straight from the recorded flows rather than being assigned as live.
export const replayValues = ({ flows, battery, vehicle }: Moment): { values: LiveInput; links: Link[] } => {
  const kw = (from: string, to: string) => (flows ? flows[`${from}_to_${to}_kw`] : 0);
  const sum = (...pairs: [string, string][]) => pairs.reduce((total, [from, to]) => total + kw(from, to), 0);
  const charging = sum(["solar", "vehicle"], ["powerwall", "vehicle"], ["grid", "vehicle"]);
  return {
    values: {
      liveReceived: flows != null,
      solarPower: sum(["solar", "home"], ["solar", "vehicle"], ["solar", "powerwall"], ["solar", "grid"]),
      homePower: sum(["solar", "home"], ["powerwall", "home"], ["grid", "home"]),
      // Negative while charging, as in live status.
      batteryPower: sum(["powerwall", "home"], ["powerwall", "vehicle"], ["powerwall", "grid"]) - sum(["solar", "powerwall"], ["grid", "powerwall"]),
      // Positive while importing, as in live status.
      gridPower: sum(["grid", "home"], ["grid", "vehicle"], ["grid", "powerwall"]) - sum(["solar", "grid"], ["powerwall", "grid"]),
      battery: battery == null ? null : Math.round(battery),
      // Charging with no car named (estimated from a charge session) still shows the car.
      vehicle: vehicle || charging >= ACTIVE_KW ? { name: vehicle ?? "Vehicle", charging_power: charging } : null,
    },
    links: flows ? FLOWS.filter(({ key }) => flows[key] >= ACTIVE_KW).map(({ from, to, key }) => ({ from, to, kw: flows[key] })) : [],
  };
};

const AT = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})$/;

// null unless it's a real moment from the first day of service to now, so a bad link opens live.
export const parseAt = (value: string | null | undefined, now = Date.now()) => {
  const match = AT.exec(value || "");
  if (!match) return null;
  const [, date, hour, minute] = match;
  if (shiftDay(date, 0) !== date || Number(hour) > 23 || Number(minute) > 59) return null;
  const t = siteInstant(date, Number(hour), Number(minute));
  return t >= siteInstant(FIRST_DAY) && t <= now ? t : null;
};

const pad = (n: number) => String(n).padStart(2, "0");

export const formatAt = (ms: number) => {
  const { date, hour, minute } = wallTime(ms);
  return `${date}T${pad(hour)}:${pad(minute)}`;
};
