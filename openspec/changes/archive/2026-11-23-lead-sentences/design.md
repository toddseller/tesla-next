# Design

## Context

See proposal.md for why. The pages are client components rendered with their data on the server, and they reload figures in place on `totals` events (`useReload`). The year-earlier figures never change while a page is open, because they're in the past.

The sentences were settled in an explore session with mockups on 2026-11-22. The rule throughout: a sentence only where it says what the figures under it don't. That's why Patterns gets none, and why Impact and a past True-Up year get none without a comparison.

## Goals / Non-Goals

**Goals:**
- Every sentence is built by a pure function with unit tests for each case in the specs.
- The year-earlier figures come with the page, so the sentence is in the first response.

**Non-Goals:**
- No new API routes or parameters. A range change is a navigation, so the server renders the new year-earlier figures.
- Patterns, Home and Distribution are unchanged.
- The house-use line in the range chart (round 2, step 4) and the per-page `<title>` (step 5) stay out of scope. Only step 5's Solar heading order comes in, since moving the forecast fixes it.

## Decisions

**The year-earlier figures come from the page's server, passed as a prop.**
- `app/solar/page.tsx` adds a `rangeTotals` call over the year-earlier days and passes their solar sum.
- `app/impact/page.tsx` adds an `impactFigures` call over the year-earlier days and passes its self-powered share.
- Both use the page's readings, so Corrected and As Tesla reported compare like with like.
- The alternative, an extra API parameter and a client fetch, would add a route for a figure that can't change while the page is open.

**The compared days are one helper in `lib/solar/ranges.ts`.** It shifts each end back a year, Feb 29 becoming Feb 28. It returns null when the shifted start falls before the first day (2021-10-10). Solar and Impact share it.
- Today is only partly over, so a range of more than one day that includes today is compared through yesterday on both sides. Clipping only the year-earlier side at today's date set a morning against a whole day: at 9 am on December 1, Solar would have said "97% less".
- A range that starts today has no days to compare, so Solar gives its total alone and Impact no sentence.
- A one-day range still compares with the whole of that date a year earlier; Impact's Today keeps its sentence, a morning against last year's day, which the sentence names.
- Solar's server sums the range through yesterday too, as a second figure, since the sentence's kWh includes today. Impact compares the shown share, a ratio a partial day barely moves, with the clipped year-earlier days.

**Naming the range and its comparison is one helper too.** Range names:
- the current month: "November so far"
- a month: "October 2026"
- a year: "2026", with "so far" while it's under way
- a true-up year: "'26 - '27"
- this week: "this week so far"
- one day: "today", "yesterday", "on Nov 3, 2026"
- anything else: "from Mar 3 to Apr 9, 2026", using `datesLabel`

A finished whole period compares by name. Everything else compares with "the same days last year". Impact's preposition for a range is "in"; the day forms carry their own.

**Percent rounding.**
- Solar: the difference is `Math.round(100 * (now - before) / before)`, and 0 reads "about the same as".
- Impact compares the two whole percentages the API already gives, so 35 against 27 says exactly what the rings would show.

**True-Up's headline replaces the subtitle and shrinks the h1 to a label** (14px, uppercase, muted, as the sections' h2s are). The h1 stays an h1 for the document outline.
- The projection's tile text (`projectionText`) already builds the kWh line, so the muted line reuses it. With dollars, the line is its "Year-end … if the rest of the year goes like …" text.
- Without dollars the headline holds the kWh. The muted line drops to "If the rest of the year goes like …", so the figure isn't said twice.
- The explored wording's "at the last two years' pace" is left out, because the muted line names the years.

**A past year's headline needs the year before's cost.** `app/true-up/page.tsx` calls `trueUpCost` for the previous true-up year (from `trueUpYears`) only when a finished year is shown. The difference is computed on the raw amounts and then rounded: $767.73 - $554.83 = $212.90 reads $213.

**The Top Ten sentence is computed on the client from the rankings it already holds.** It follows the VPP switch and reloads for free.
- "This year" is `today`'s year.
- A record is a ranking's first entry.
- The newest record is the latest of the four first entries, a month counting as its first day.
- A month reads "June 2026's export month".

**Where the sentence sits.**
- On Solar, Impact and Top Ten, it's a 20px, weight-500 paragraph on its own line under the row holding the h1 and the controls. Beside the h1, a two-line sentence pushed the controls onto a row of their own at 1024px.
- On Top Ten, it replaces the static subtitle. Where there's no sentence (an empty database), the subtitle stays.
- The range controls stay beside the heading, as `impact-report`'s "Range controls beside the heading" requires. Its scenario no longer promises the first card stays put, since a sentence comes and goes with the range.
- Figures are marked in braces and set in mono by `Measured`, given the braces as its pattern, since its own pattern would set the years in a date or a true-up year's name in mono.

**The Layout scenario keeps its name.** OpenSpec refuses a MODIFIED requirement that drops a scenario, so "Five tiles on a wide screen" keeps its name and now checks four tiles.

## Risks / Trade-offs

- **[Risk] The sentence wraps badly on a phone.** Mitigation: `text-pretty` and a max width. Check every page's phone screenshot before the push.
- **[Risk] One-day comparisons swing with the weather.** This was accepted in the explore session; the sentence names the day it compares with.
- **[Risk] One more database query per Solar and Impact render.** It's the same indexed per-day scan the page already runs, over a range at most as long, and the pages render per request already.
