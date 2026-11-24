# Design

## Context

`BackupSection` gets the chosen `year` (a range) and `today`; `backupParam(year, today)` in `lib/backup-years.ts` already answers `"all"` for All time, `null` for this year and `"24-25"` for another, and `rangeTitle` names a true-up year as "'25 - '26". The heading is an `h2` reading "Backup" whose id names the section's region.

## Goals / Non-Goals

**Goals:** the section says which year it covers, in the heading, where the eye lands first.

**Non-Goals:** tying the section to the page's range (tried on this branch and turned down: the independent picker reads better).

## Decisions

- **The label comes from the range itself**: "All time" when `backupParam` says `"all"`, else `rangeTitle(year)`, the name the picker's button gives a stepped year, its spaces unbreakable. It shows the year even when the picker's button reads "This year", which is the case the critique tripped on.
- **The label sits inside the `h2`**, after a middle dot, muted, so the region's accessible name carries it too ("Backup · '26 - '27"), and a screen reader hears the same scope a sighted reader sees.

- **The picker is the shared `PresetGroup` given `today`**, as True-Up's and Impact's range controls give it: the selected preset then holds step buttons, `step()` already moves an October-to-September range by a true-up year and names it "'24 - '25", the arrows stop at the first day of data and at today, and All time has no step shape so no arrows. `backupPresets` shrinks to This year and All time; `earlier` goes.

## Risks / Trade-offs

- [The page and the card can still show different ranges] → Accepted, by choice: the heading now says so plainly.
