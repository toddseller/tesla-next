# Design

## Context

anton writes two copies of each day's solar: the daily row in `data` (`solar_generated`, kWh as `real`, one decimal) and the 5-minute rows in `energy_interval` (`solar_generated_wh`, integer Wh). The range chart and every daily figure read the first; the day view, the replay and the peak check read the second. `lib/checks.ts` holds the weekly checks; `allChecks` feeds `GET /api/checks`, which the Monday run on onyx (`deploy/checks`) turns into a Pushover alert for any `FAIL` line.

## Goals / Non-Goals

**Goals:**
- A frozen or otherwise short daily row is alerted within a week, by the run that already exists.

**Non-Goals:**
- Comparing grid or house figures. Grid differs on purpose before the meter fix when the site corrects, and house would need its own tolerance; solar alone would have caught Feb 4, 2024.
- Re-checking history. The bulk-filled stretches (Oct 2021 to Sep 2022, Jul 31 to Sep 30, 2025) run about 5% under their intervals; that is a separate decision, and a whole-history window would fail every week until it's made.
- Repairing anything. The app only reads; a failing day is re-saved with anton's `backfill_history`.

## Decisions

- **A weekly check in `allChecks`, not a daily one.** The 7-day window covers every day once a week, matching the meter check's, and anton finishes a day after its midnight, so yesterday is complete by Monday 06:30. A daily check would alert sooner, but nothing on the site goes wrong in a way a week's delay worsens. Alternative: add it to `/api/checks/daily` and judge only yesterday; rejected as more noise for the same catch.
- **One SQL query, compared in it.** A join of the window's `data` rows with each day's `sum(solar_generated_wh)`, keeping the days where `abs(solar_generated - sum / 1000.0) > 0.5`, plus a count of the days compared. The inner join leaves out a day missing either side, as the spec says; a missing interval day already fails the daily peak check.
- **Compared in numeric, the total at its one decimal.** `solar_generated` is a `real`, so 15.7 reads as 15.69999980926514 and a day exactly 0.5 kWh apart could fail by a float's last digit. `round(solar_generated::numeric, 1)` against `sum(solar_generated_wh) / 1000.0` compares exactly, so the spec's 0.5 edge holds. Alternative: compare floats with an epsilon; rejected as a second tolerance to explain. The 0.5 itself has room: no row the collector finished normally is over it anywhere in the history.
- **Line wording follows the other checks.** `ok solar totals: <span>, <n> days, each within 0.5 kWh of its 5-minute intervals`, with `<span>` from `datesLabel(..., "short")` as the meter check does; a failing day as `<long date>'s total is X kWh, its 5-minute intervals add to Y kWh`, several joined by `; `, the total to its one stored decimal and the intervals' sum to two, so a day just over 0.5 apart (20.0 against 20.54) doesn't print as 20.5 and read like a pass. No link: the day view shows only the intervals' side, which is the side that is right.

## Risks / Trade-offs

- [A day whose intervals are incomplete, with a complete row, fails too] → That is a real disagreement worth seeing; the line names both figures, so which side is short is plain.
- [Tesla's day before anton's cutover ends at 11:55 p.m., the intervals at midnight] → The last 5 minutes of a day carry no solar.
- [After the cutover anton sums the daily row from the intervals, so they can only disagree when a row stops updating] → That is exactly the failure this catches.

## Migration Plan

Ships with the next release; the weekly run picks the new line up from `/api/checks` with no server change. Feb 4, 2024 and Mar 11, 2023 were already re-saved (2026-11-24), so the first run passes.
