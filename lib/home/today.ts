import { wallTime } from "@/lib/scene/replay";


const HOUR = 3_600_000;
type Hours = { hours: { start: string; expected: number }[]; byNow: { at: string; over: boolean } | null };

// The forecast hours left after now, rather than the day's rounded kWh less the expected by now, so after sundown
// nothing is left whatever the rounding.
export function stillToCome(byHour: Hours | null, dayExpected: number | null) {
  if (!byHour) return dayExpected;
  if (byHour.byNow?.over) return 0;
  const at = byHour.byNow ? Date.parse(byHour.byNow.at) : 0;
  const left = byHour.hours.reduce((sum, h) => sum + h.expected * Math.min(1, Math.max(0, (Date.parse(h.start) + HOUR - at) / HOUR)), 0);
  return Math.round(left * 10) / 10;
}

type Kw = Record<string, unknown> & { minute: number };
const kw = (record: Kw, key: string) => Number(record[`${key}_kw`] ?? 0);
const SOLAR = ["solar_to_home", "solar_to_vehicle", "solar_to_powerwall", "solar_to_grid"];
const RECORD_MINUTES = 5;

// Today's chart in kW by minute of the site day. An hour's expected kWh over its hour is its average kW, drawn at its
// middle so the dashed line passes through the hour it stands for.
export function todayRows(day: { data: Kw[] }, hours: { start: string; expected: number }[]) {
  const records = day.data.map((r) => ({
    minute: r.minute,
    solar: SOLAR.reduce((sum, key) => sum + kw(r, key), 0),
    charging: -(kw(r, "solar_to_powerwall") + kw(r, "grid_to_powerwall")),
    exporting: -(kw(r, "solar_to_grid") + kw(r, "powerwall_to_grid")),
  }));
  return {
    records,
    forecast: hours.map((h) => ({ minute: wallTime(Date.parse(h.start)).hour * 60 + 30, kw: h.expected })),
    latest: records.length ? records.at(-1)!.minute + RECORD_MINUTES : 0,
  };
}
