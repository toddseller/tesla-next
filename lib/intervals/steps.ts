import { METER_FIX_DATE, type Readings } from "@/lib/meter";

// energy_interval's rows matching `where` (a condition on whole days, with the caller's parameters), as a subquery
// with the same columns. Corrected, a day before the fix with PG&E's reading gets the difference between the meter and
// its steps. Import goes to the steps the house drew from the grid, by that draw: the Powerwall's own meter read right,
// so the steps it fed keep their figures. A day Tesla saw no grid draw at all shares it by the Powerwall's draw instead,
// the only times the house wasn't on solar. Export is shared by each step's solar. Every flow stays at zero or more.
export function energySteps(readings: Readings, where: string) {
  if (readings === "tesla") return `(SELECT * FROM energy_interval WHERE ${where})`;
  const share = (part: string, whole: string) => `CASE WHEN ${whole} > 0 THEN (${part})::float8 / ${whole} ELSE 1.0 / s.steps END`;
  const drawShare = `CASE WHEN s.day_grid > 0 THEN s.house_from_grid_wh::float8 / s.day_grid ELSE ${share("s.house_from_battery_wh", "s.day_battery")} END`;
  const extraIn = `CASE WHEN s.meter_in IS NULL THEN 0 ELSE (s.meter_in - s.day_in) * ${drawShare} END`;
  const extraOut = `CASE WHEN s.meter_out IS NULL THEN 0 ELSE (s.meter_out - s.day_out) * ${share("s.solar_generated_wh", "s.day_solar")} END`;
  return `(SELECT s.start_at, s.day, s.solar_generated_wh,
      greatest(0, s.grid_imported_wh + ${extraIn}) AS grid_imported_wh,
      greatest(0, s.grid_exported_from_solar_wh + ${extraOut}) AS grid_exported_from_solar_wh,
      s.grid_exported_from_battery_wh, s.battery_exported_wh, s.battery_imported_from_grid_wh, s.battery_imported_from_solar_wh,
      greatest(0, s.house_from_grid_wh + ${extraIn}) AS house_from_grid_wh,
      greatest(0, s.house_from_solar_wh - ${extraOut}) AS house_from_solar_wh,
      s.house_from_battery_wh
    FROM (SELECT e.*, m.imported_wh AS meter_in, m.exported_wh AS meter_out,
        sum(e.grid_imported_wh) OVER d AS day_in,
        sum(e.grid_exported_from_solar_wh + e.grid_exported_from_battery_wh) OVER d AS day_out,
        sum(e.house_from_grid_wh) OVER d AS day_grid,
        sum(e.house_from_battery_wh) OVER d AS day_battery,
        sum(e.solar_generated_wh) OVER d AS day_solar,
        count(*) OVER d AS steps
      FROM energy_interval e LEFT JOIN meter_day m ON m.date = e.day::text AND e.day < '${METER_FIX_DATE}'
      WHERE ${where} WINDOW d AS (PARTITION BY e.day)) s)`;
}
