# Design

## Context

True-Up's server (`app/true-up/page.tsx`) loads the shown range's cycles and, for a true-up year, its cost (`trueUpCost`), whose projections feed `currentHeadline` in `lib/true-up/text.ts`; the net tile's figure comes from `totals(startedCycles(cycles)).net`. Home (`app/page.tsx`) already loads the current true-up year's start and net the same way, and the since-2021 share as `impactFigures(PTO, today).total_solar_percentage` (`matched`). Impact's `total_solar_percentage` is solar generated as a share of home use, the figure the explanation calls "covered".

## Goals / Non-Goals

**Goals:** one sentence builder shared by both pages, from figures the pages already load or can load with the existing functions; the mockups' wording.

**Non-Goals:** pricing reasons, explaining All time or custom ranges, and any change to how the cost is estimated.

## Decisions

- **`yearExplained({ label, current, share, net })` in `lib/true-up/text.ts`** returns the sentence: the opening ("This true-up year solar has covered N% of the house's use so far" or "In '25 - '26 solar covered N%…"), then by case: net imported and share below 100, "so the house has drawn / drew N kWh more from PG&E than it sent"; net imported and share 100 or more, "yet…: the Powerwalls lose some of what they store, so solar needs a margin over use to break even"; otherwise "and the house has sent / sent N kWh more to PG&E than it drew". kWh whole, as the leads give them. Home calls it too, so the two pages can't drift.
- **The year's share comes from `cyclesShare(rows)` in `lib/true-up/share.ts`:** `impactFigures` over the started billing cycles' own days (the first cycle's first day to the last one's latest day with data), the same days the net beside it counts, which run a few days past September 30; null when those days have no house use yet, since `impactFigures` reads an empty range as 0%. One more query on each page, after the cycles it reads its days from. Alternative: derive the share from the cycles. Rejected: cycles hold grid energy only, not solar or house use. (The first two points, the span and the null, came from the fresh-session review.)
- **Home's estimate reuses True-Up's cost:** `trueUpCost(current.start, current.end, today)` and the same lowest-to-highest rounding `currentHeadline` uses, through a small shared helper both call, so Home's range always matches True-Up's headline. Home shows it only with projections.
- **Home's bridge** ("That N% rests on the early years…") is added in `Since` when `matched >= 100` and the year's share is below 100, before `yearExplained`'s sentence, which replaces the midday paragraph.

## Risks / Trade-offs

- [Two more queries on Home and one on True-Up] → Accepted: both are the sums the pages already run for other ranges, served per request as every page is.
- [The Powerwall-loss clause is a general reason, not a measured one] → Accepted: it appears only for a year above 100% that still imported, where it is the only way the house's own figures can come out that way.
- [The estimate on Home may be read as a bill already owed] → It keeps True-Up's wording, "on track to owe", and links to True-Up.
