# Proposal

## Why

The 2026-11-22 design check found that the inner pages "open on numbers with no sentence": nothing says what the range shown amounts to. Home leads with sentences; Solar, Impact, True-Up and Top Ten should too, but only where the sentence says something their figures don't (explored with mockups on 2026-11-22).

## What Changes

- **Solar** gets a sentence under its title giving the range's solar total, which the page never shows, against the same days a year earlier in percent: "Solar made 556 kWh in November so far, 6% more than the same days last year."
- **Solar's forecast card moves below the range chart**, so the title, sentence, range buttons and chart sit together at the top and the page's h1 comes before the card's heading.
- **Impact** gets a sentence under its title comparing the self-powered share with the same days a year earlier: "35% self-powered in November so far, up from 27% over the same days last year." With no year before the range (All time, 2021), there is no sentence: the ring already says the figure.
- **True-Up** leads with a headline sentence (the title becomes a small label above it): the current year's projection ("On track to owe $611 to $657 at the October 2027 true-up, at the last two years' pace; $180 in charges so far.") or a past year's outcome against the year before. **BREAKING** for the page's layout: the Projected true-up tile is removed; its kWh basis becomes a muted line under the headline, leaving four tiles.
- **Top Ten** gets a sentence under its title counting this year's places in the four rankings as shown, naming any record it set, or the newest record when the year has none.
- **Patterns** is unchanged: its sections don't add up to one sentence about a range.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `solar-range-chart`: the range's lead sentence.
- `solar-forecast`: the forecast card sits below the range chart instead of above "Solar by date range".
- `impact-report`: the range's lead sentence.
- `true-up-tracker`: the headline sentence, the projection moving from its tile to the headline, and the tile row's layout with four tiles.
- `top-ten`: the lead sentence about this year's places.

## Impact

- Pages: `components/solar/solar-page.tsx`, `components/impact/impact-page.tsx`, `components/true-up/true-up-page.tsx` and `tiles.tsx`, `components/top-ten/top-ten-page.tsx`.
- Servers: `app/solar/page.tsx` and `app/impact/page.tsx` also read the year-earlier span; `app/true-up/page.tsx` reads the previous year's cost for a past year.
- Sentence text in pure functions beside the existing text helpers (`lib/true-up/text.ts` and its neighbors), so every case is unit tested.
- No API, database or dependency changes.
