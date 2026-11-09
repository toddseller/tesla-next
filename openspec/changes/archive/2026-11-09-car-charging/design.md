## Context

`dayIntervals(day)` in `lib/intervals/intervals.ts` (ported from anton for the Distribution replay) already does the hard part for one day: measured Wall Connector charging from `vehicle_interval`, short gaps filled, charge sessions placed where the home's use shows the extra load, and each interval's charging moved out of the home flows into `solar_to_vehicle`, `powerwall_to_vehicle` and `grid_to_vehicle` in the home's proportions (`intervalWh`). It also loads weather, battery samples, the sky reference and off-grid spans, which charging doesn't need.

Data on onyx (read-only queries, 2026-11-09): `charge_session` holds 312 sessions, 3,961 kWh, 2025-10-20 to 2026-10-20 (a one-off Teslemetry backfill; Teslemetry keeps 12 months); `vehicle_interval` measures per car every 5 minutes from 2026-10-17; `energy_interval` reaches back to 2021-10-10. Before 2025-10-20 there is no charging data.

anton's `services/vehicles.py` `refresh()` deletes the `vehicle` table and re-adds the account's cars every 6 hours.

## Goals / Non-Goals

**Goals:** the section of mockup A for any Impact range, with figures that agree with the Distribution replay's day totals.

**Non-Goals:** dollars (what charging cost or saved) and a month-by-month chart (mockup B), both later changes if wanted; charging away from home, which no table records; naming older sessions by their inferred car (the owner's call: the cars are leased, and inferring by power against the current car list would credit a replaced car's sessions to its successor).

## Decisions

- **Take the charging out of `dayIntervals` into `dayCharging(day)`**, returning each interval's charging Wh by source, its car (when named) and whether that name came from measurement or a same-car gap. `dayIntervals` calls it, so the replay keeps its answers (its tests and the day-intervals spec guard that). Calling `dayIntervals` per day instead would also load weather, battery and the sky reference for every day of a range.
- **`carCharging(start, end)` sums `dayCharging` over the covered days of the range**, clamped to the coverage start (the earliest of the first `charge_session` and the first `vehicle_interval`, read from the data, never hard-coded). Percentages are whole numbers of the summed Wh, as Impact's are; the off-grid share is solar plus Powerwall.
- **Sessions are placed in their best stretch (owner's choice, after the onyx run found a third of the session energy dropped).** A session's recorded duration is how long it charged, and its start when the car was plugged in; the stretch of that length plus one interval (a start between boundaries) with the most creditable energy within 24 hours is filled as the old walk filled intervals. The 30-quiet-minutes end goes, since the stretch's length does that job. To choose the same stretch whichever day asks, a day loads the excess and measured charging of the day before, itself and the day after. Considered: only widening the walk to 24 hours (still ends on the first brief load, as on 2026-07-20) and counting unplaced energy as an unknown source (honest totals, but the replay would stay wrong).
- **Car lines count only measured intervals and same-car gaps.** Session estimates, including those whose car `sessionVin` infers, count toward the household only.
- **Finished days are computed once per server process**, kept on `globalThis` like `paybackYears` (Next.js gives route handlers and pages their own module copies); yesterday and today are always recomputed, since a session plugged in yesterday can charge today (review finding). A deploy starts afresh, which also takes in anton's corrections. All time is about 390 days of a handful of queries each; measured on onyx before release (task), with a pre-warm at startup only if the cold load is too slow.
- **Its own route, `/api/car-charging`**, rather than new fields on `/api/impact`: the Impact figures are a port with a fixed shape, and the section reloads alongside them with the same `useReload` pattern.
- **The anton companion upserts the vehicle list**: cars on the account are added or renamed and stay `streamed` per the stream list; a car no longer on the account keeps its row with `streamed` false. `vinForModel` already filters on `streamed`, so a departed car is never inferred for a session. tesla-next needs no change to `carName` for this.

## Risks / Trade-offs

- [Cold All time load after a deploy takes several seconds] → measure on onyx in a throwaway branch container; pre-warm finished days at startup if it matters.
- [Session estimates are estimates] → the household figures are labelled as from the Wall Connector's sessions before measurement, as the replay already marks them; the car lines use measurement only.
- [Until anton's companion deploys, a returned car shows as "Vehicle"] → ship the companion before the T.I.E. Fighter goes back.

## Migration Plan

Release as usual. anton's companion can deploy before or after; until it does, cars still on the account are named as now.

## Results

A throwaway build of the branch on onyx (2026-11-09; its image's 1,352 tests passed), reading production read-only, removed afterwards:

- `/api/car-charging` for All time: 1,957 ms cold after a restart, 19 ms warm.
- Day totals match `/api/intervals` exactly: 16.7 kWh on 2026-10-24 (measured), 17.2 kWh on 2026-09-15 (sessions), 0 on 2026-11-09 (idle).
- All time: 2,658 kWh, 26% solar, 23% Powerwall, 51% grid; Tesla T.I.E. Fighter 139.6 kWh and R2D2 53.3 kWh measured since 2026-10-17.
- The sessions hold 3,961 kWh, but placement credits about 2,460 of them. Session starts are plug-in times; a charge that begins more than 12 hours later (2026-07-20's 30.1 kWh session, plugged in at 16:50, charged about 10:00 to 16:00 the next day), or after a brief load ends the walk with 30 quiet minutes, is dropped by the day-intervals rule "Energy not placed when the walk ends SHALL NOT be shown". By month the placed share runs from 22% (July 2026) to 94% (September 2026). The replay drops the same energy.

After the new placement (best stretch of the session's duration within 24 hours, ended by the next session's start), the same onyx run (its image's 1,355 tests passed):

- Placed: 2,805 of the 3,755 kWh of sessions from October 2025 to September 2026 (75%, up from 62%); by month 53% (December 2025) to 97% (September 2026). 2026-07-20's session now lands on 2026-07-21 (22.2 kWh).
- All time: 3,215.7 kWh, 35% solar, 23% Powerwall, 42% grid; 2,574 ms cold, 21 ms warm.
- Day totals still match `/api/intervals` exactly (2025-12-05, 2026-07-21, 2026-10-24, 2026-09-15, 2026-11-09).
- What stays unplaced is mostly load the home's meter never shows: 2025-12-09's 20:29 session records 27.1 kWh at 9.3 kW while the home's load shows about 5 kW, and 2025-12-02's load comes before its session's start. No rule over the home's load can place that.
