# Scorecard

A fixed set of pass/fail checks for teslasolar.report, so each design round measures the same things instead of an open-ended critique that samples different corners each time. Each check is tied to a goal in PRODUCT.md or to one of the weak spots the round 3 critique (2026-11-23, 28/40) left at 2 out of 4: consistent range controls (WS1), error and partial states (WS2), and the data as a story (WS3).

Check every item on the live site, at 1440x900 and 390x844. A check passes only when it holds on every page it names.

## Checks

| # | Check | Serves | 2026-11-23 | Evidence then |
|---|---|---|---|---|
| 1 | Solar, Impact and True-Up offer the same core range set in the same order, with a custom range always visible | WS1 | Fail | Solar 3 presets, Custom only after a range is set; Impact 6; True-Up 5 year buttons |
| 2 | Every data page has the same header order (h1, then a lead sentence with a figure, then controls) at the same height | WS1 | Fail | Solar's lead sits above its h1 by default and below it with a range; Impact's and True-Up's at different heights; Patterns has a subtitle with no figure |
| 3 | Picking any preset updates the address, and that address reloads the same view | A link shows what was shared | Pass | Impact This month gives `?start=2026-11-01&end=2026-11-30`; True-Up '24 - '25 gives `?start=2024-10-01&end=2025-09-30` |
| 4 | The tab title names the range shown | WS1 | Pass | "Solar · June 2024", "Impact · Nov 23, 2026", "True-Up · '26 - '27" |
| 5 | Any year since 2021 is reachable on Solar in 3 interactions or fewer | WS1 | Fail | The calendar steps one month at a time, about 48 clicks to 2022 |
| 6 | An unknown path answers 404 with a styled page, a sentence and a way onward | WS2 | Fail | `/nope` showed Next's default page; fixed by PR #78 (off-grid), passes once released |
| 7 | A bad or out-of-range address never disagrees with the page: it redirects to a valid one or says what it shows | WS2 | Fail | banana, 2030, pre-2021, reversed ranges and a future `day` showed the default at the bad address; fixed by PR #78, passes once released |
| 8 | Partial periods say "so far", and comparisons use the same elapsed span | Owner: how is it doing | Fail | Impact at 10:06 AM: "24% self-powered today; this day last year was 38%" sets a morning against a whole day. Solar's month ("same days last year") and the day view pass |
| 9 | Every page shows how fresh its data is | Owner: is it working | Pass | "LIVE 10:07 AM" with kW readings in the top bar of every page |
| 10 | One data start date, stated the same way everywhere | Trust every number | Fail | Home says "since October 22, 2021"; Impact's All time and Solar's October 2021 bars start October 10 |
| 11 | Every range view opens with a lead sentence carrying a figure, in every preset | WS3 | Fail | Impact's All time has no lead; Patterns has none |
| 12 | Home answers the owner's three questions: live state, today against expected, and the PG&E standing in dollars | Owner at a glance | Fail | Live and today pass; PG&E shows only kWh imported against sent, far down the page; the dollar estimate is only on True-Up |
| 13 | "Solar made 100% of use, yet the bill is owed" is explained in body text next to the figures, on Home and True-Up | WS3 | Fail | Home explains midday export and evening import; True-Up doesn't |
| 14 | Every Home chapter links to the page and range holding its data | WS3 | Pass | See the house live, Open the day, The year on Impact, Every top ten, The patterns behind it, The true-up and payback |
| 15 | Exploration entry points exist (Pick a day, Random day), and every record links to its day | WS3 | Pass | Home has Pick a day and Random day; Top Ten entries open `/solar?...&day=` |

2026-11-23: 5 of 15 pass (3, 4, 9, 14, 15). 7 of 15 once PR #78 is released.

2026-11-23, live with v2026.11.23.8: 10 of 15 pass. Checks 6 and 7 pass with PR #78 (`/nope` answers 404 in the site's look; `?start=banana`, a 2030 range and `?start=x` answer 307 to the plain address). Checks 1, 2 and 5 pass with PR #79 (Solar, Impact and True-Up share the core presets in one order, header order and size match, and the calendar's year list reaches any year in two choices once it's open). Still failing: 8, 10, 11, 12, 13.

2026-11-23, live with v2026.11.23.10: 12 of 15 pass. Check 8 passes with PR #81: today says "today so far" with no comparison against a whole day, and ranges under way say "so far" or "since". Check 11 passes for every range view with PR #81: Impact's All time reads "68% self-powered since Oct 10, 2021." and every preset on Solar and Impact opens with a figure; Patterns, which the check also named, has no range, so it isn't a range view and keeps its subtitle. Still failing: 10, 12, 13.

2026-11-23, live with v2026.11.23.11: 14 of 15 pass. Checks 12 and 13 pass with PR #82: Home's Since 2021 chapter gives True-Up's estimate in dollars ("$607 to $651, on track to owe at the October 2027 true-up") beside the kWh net, and True-Up and Home each explain the year from its own figures ("This true-up year solar has covered 73% of the house's use so far, so the house has drawn 669 kWh more from PG&E than it sent."), Home adding that its since-2021 100% rests on the early years. Still failing: 10.

## What comparable sites do

Studied 2026-11-23 at 1440x900: Electricity Maps, Grid Status, Our World in Data, PVOutput and a public Enphase Enlighten page. Not studied: phone layouts, SolarEdge (no public page found), and anything behind a login.

**Range controls (WS1)**
- Enphase shows one fixed row on every view (Day, Week, Month, Year, Lifetime, Custom), with previous and next arrows around the date, next disabled at today.
- PVOutput keeps the same link row under every chart, with the range as the chart's subtitle.
- Our World in Data puts the range in the chart title and its controls as labeled dropdowns in one header band above a two-handle time slider; everything lives in the URL.
- Grid Status has one date picker in the same corner of every view, with first and last buttons and "Back to today".

**Error and partial states (WS2)**
- Electricity Maps rewrites a bad address to the nearest valid one; its 404 is styled with a way home.
- Our World in Data clamps an out-of-range time to the data and shows the real range in the title; an empty selection says why and what to try.
- Grid Status puts "No data available" in each empty panel with "Back to today", and labels partial figures "Day so far".
- PVOutput labels "Partial Month (23 days)"; its chart silently skips missing months, the thing to avoid.
- Grid Status Trends sets "So far today" against a 30-day average and the same day last year.

**The data as a story (WS3)**
- Our World in Data heads each section with a question, then the chart, then a one-sentence answer, and a "Note that..." paragraph wherever two figures look contradictory.
- Our World in Data's "About this data" gives one fixed block: last updated, date range, unit.
- Grid Status lists current records with how long ago each was set, and a feed of new ones.

## Changes with the most payoff

1. Validate the range on the server and give unknown paths a styled 404 (checks 6, 7). Done in PR #78.
2. One shared range header for Solar, Impact and True-Up: h1, lead, then the same preset row, with a year jump in the calendar (checks 1, 2, 5). Done in PR #79.
3. Honest partial periods: "so far" labels and same-span comparisons, or Impact opening on yesterday before noon; a lead for Impact's All time (checks 8, 11). Done in PR #81.
4. On True-Up, explain owing money despite 100% solar as a question and answer under the lead, and bring the dollar estimate to Home's true-up chapter (checks 12, 13). Done in PR #82, as a sentence from each year's own figures rather than a fixed question and answer.
5. One data start date in one "data since" line on Home, Impact's All time and Solar (check 10).
