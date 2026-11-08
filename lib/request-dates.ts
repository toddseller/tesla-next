import { shiftDay, siteToday } from "@/lib/scene/replay";

// The site's dates, as anton-tesla-api-ws's parse_day sets them: the first day of service to two years ahead.
const FIRST_DAY = "2021-10-01";
const HORIZON_DAYS = 732;

function isCalendarDate(value: string) {
  const parsed = new Date(`${value}T00:00:00Z`);
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value);
}

// Python's date.fromisoformat also reads 20261016 and week dates; the pages only ever send YYYY-MM-DD.
export function dateError(name: string, value: string | null): string | null {
  if (!isCalendarDate(value ?? "")) return `${name} is required as YYYY-MM-DD`;
  const last = shiftDay(siteToday(), HORIZON_DAYS);
  return value! < FIRST_DAY || value! > last ? `${name} must be from ${FIRST_DAY} to ${last}` : null;
}
