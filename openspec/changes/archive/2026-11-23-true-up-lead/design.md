# Design

## Context

`yearExplained({ label, current, share, net })` in `lib/true-up/text.ts` builds the sentence for a true-up year, and `components/true-up/true-up-page.tsx` shows it under the lead when the shown range is a true-up year and `share` isn't null. The share comes from `cyclesShare(rows)` in `lib/true-up/share.ts`: Impact's share over the started cycles' first day to the last one's latest day, or null before any house use. Without a headline the page shows the subtitle "Grid energy by PG&E billing cycle". Home's Since 2021 chapter calls `yearExplained` for the current year.

## Goals / Non-Goals

**Goals:** every range on True-Up with house use leads with a figure; one sentence builder for years and other ranges.

**Non-Goals:** changing a headline year's layout or any sentence's wording for true-up years.

## Decisions

- **The builder takes the range's name instead of a year label:** `rangeExplained({ name, under, soFar, share, net })`, where `under` picks the present perfect and `soFar` adds "so far" after "the house's use". `yearExplained`'s cases and wording carry over unchanged; Home and True-Up call it with `This true-up year` / `In '25 - '26` as before.
- **A range that isn't a true-up year is named by the cycles' days**, the days its figures cover, which can differ from the days picked (billing cycles run across them): the first day no earlier than `FIRST_DAY`, "Since <day>" while those cycles' days reach today (the running cycle can lie inside a range picked in the past; caught by the fresh-session review), else "From <day> to <day>", both in `longDate`'s long form, as the start-date rule asks. `cyclesShare` returns those days with the share so the server works them out once.
- **The sentence is the lead when there's no headline:** rendered with the lead's size where the subtitle was, the subtitle kept for a range with no house use yet. Under a headline it stays the muted line it is now.

## Risks / Trade-offs

- [A custom range's sentence names the billing cycles' days, not exactly the days picked] → Accepted: they are the days the net tile and the share count, so the sentence says what it measures.
- [All time's sentence is long at the lead size] → Accepted: the Powerwall clause is the point of it; it wraps within the lead's 46 characters.
