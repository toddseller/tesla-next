# Design

## Context

`app/impact/page.tsx` reads the page's range (`parseRange`) and, apart from it, the Backup year (`backupYear(params.backup, today)` in `lib/backup-years.ts`). `ImpactPage`'s `address()` carries `backup` into every address it makes, through `backupParam`, which leaves it out only for this true-up year. `BackupSection` always shows the shared `PresetGroup` with `backupPresets`, and sizes each bar as `length / longest` over the year's events.

The page's All time runs from `FIRST_DAY` (2021-10-10, `lib/scene/replay.ts`) to today, and `holds()` in `lib/solar/ranges.ts` already treats any range from that day or earlier to today or later as All time. Backup's All time runs from 2021-10-01 to the end of this true-up year. The page's True-up year preset gives October 1 to September 30, and its arrows step it a year at a time.

PR #87's design turned down tying the section to the page's range; critique round 8 showed that the heading alone doesn't stop All time and '26 - '27 reading as a contradiction, so this change ties them for the two spans they share.

## Goals / Non-Goals

**Goals:** one answer on the page for All time and for a true-up year; a short event's bar reads short.

**Non-Goals:** tying the section to any other range (a month or a calendar year doesn't map onto true-up years); redirecting a typed address to drop a stale `backup` (it's ignored, and the next address the page makes leaves it out); changing `/api/backup`.

## Decisions

- **One helper decides whether the section follows**: `followedYear(range, today)` in `lib/backup-years.ts` gives Backup's range for the page's range, All time (by `holds` on the page's All time preset) or a true-up year (start October 1 and end the next September 30, within '21 - '22 to this one), or `null`. The page route uses `followedYear(range, today) ?? backupYear(params.backup, today)`, so the server fetches the right history on the first render. Alternative: a `follows` flag sent from the server; turned down, as the client can work it out from the same pure function and `range` it already has.
- **`ImpactPage` asks the same helper** for whether the section follows: when it does, `address()` leaves `backup` out (including the address of the next range picked, so leaving All time for This month lands on this true-up year, as the spec says), and `BackupSection` gets `follows` to hide its `PresetGroup`. The heading keeps naming the span from `year`, which already holds the followed range.
- **A followed true-up year must lie between '21 - '22 and this one**: a page range of October 2027 to September 2028 isn't a year Backup knows, so it falls back to the section's own year, which `backupYear` already bounds.
- **The bar is `min(length / 86 400, 1)`**, one constant, no per-year maximum; `min-w-0.5` keeps a blip visible as a sliver. Alternatives: the all-time longest event (needs every year's data in each response) and a log scale (misreads lengths); both turned down.

## Risks / Trade-offs

- [Every outage of a day or more draws the same full bar] → The duration beside it gives the real length; the storm outages are the only ones that long.
- [A visitor on All time can't see one year's Backup without changing the page's range] → By choice: the page's own True-up year preset and arrows reach every year.
