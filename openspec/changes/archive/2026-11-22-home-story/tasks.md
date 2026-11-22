# Tasks

Each code task goes test-first: write the test, run it and see it fail for the right reason, then the smallest code that passes, then `yarn vitest run`.

## 1. Mockups

- [x] 1.1 On the `home-story` canvas (https://claude.ai/artifact/Qrh6vWVpA3gREz12ACGjdi), draw mockups v2 at 1440 wide and 390 by 844 with real figures (no costs): each chapter in its own form (the balance beside the real Distribution scene; Today's chart; the year raster with its switcher and a row's readout; Records' tabs with a staircase and top five; Habits' lines by year; Since 2021's running totals with payback marks; Pick a day), the oversized chapter words, Now's stale and outage states and the car charging, and the top bar at 1366 and 1440. Verify by your approval of one design, recorded with its link in design.md's "Mockups decide the layout". Approved 2026-11-21: mockups v4 (https://claude.ai/artifact/Qrh6vWVpA3gREz12ACGjdi#page-v4)

## 2. The Solar page moves to `/solar`

- [x] 2.0 `lib/forecast.test.ts`: a day whose hours the hourly forecast covers takes its expected kWh from their sum, rounded (17.95 gives 18 where the daily scale gives 17); a day without hours keeps the daily scale; `byNow.expected` never exceeds the day's expected. Verify it fails, change `forecastCard()`, verify it passes and that `components/solar/forecast.test.tsx` still passes or is updated to the spec's figures

- [x] 2.1 `lib/solar/ranges.test.ts`: `address()` gives `/solar?start=…&end=…` and `/solar?…&day=…`. Verify it fails, change `address()`, verify it passes, and that Top Ten's and Impact's link tests now expect `/solar` (update them to the spec's addresses)
- [x] 2.2 `git mv app/page.tsx app/solar/page.tsx` with its test; update the test's imports and expected addresses. Verify `app/solar/page.test.tsx` passes unchanged in behavior
- [x] 2.3 `app/page.test.tsx` (new): `/` with `start`, `end`, `day` or `readings` calls `permanentRedirect` to `/solar` with the same query; `/` with none of them, or with only `year`, renders the home page. Verify it fails, then implement the check in `app/page.tsx`, verify it passes

## 3. Top bar

- [x] 3.1 `components/top-bar.test.tsx`: seven links in order (Home `/`, Solar `/solar`, …), Home current on `/` and Solar current on `/solar?start=2026-10-01&end=2026-10-31`, the phone menu listing the seven, and the pill's SOLAR and HOME hidden below 1440 pixels (the class the test reads). Verify it fails, add Home to `pages`, move Solar's `href` and the pill's breakpoint, verify it passes

## 4. Now

- [x] 4.1 `lib/home/balance.test.ts`: the sources signed as the scene reads them (the Powerwalls charging and the grid exporting negative), a source under 0.05 kW left out. Verify it fails, implement, verify it passes (the equation it first drew was dropped on 2026-11-22; the sentence leads)
- [x] 4.1b `lib/home/now-sentence.test.ts`: the spec's sentences (after sunset with the car at 50%, midday with the car charging), the house's supply largest first, solar at 0 after sunset, the Powerwalls charging, supplying or idle with their charge, the car only when the live status carries it. Verify it fails, implement `lib/home/now-sentence.ts` on `lib/home/balance.ts`, verify it passes
- [x] 4.2 `components/home/now.test.tsx`: the sentence leading under Now, changing with a new status and replaced by "No live update since …" when stale; the status line (normal, stale, off-grid text after the time); the scene with its labels and no replay controls, not itself a link; the pill linking to `/distribution`. Verify it fails, implement, verify it passes

## 5. Today

- [x] 5.1 `lib/home/today.test.ts`: still to come is the forecast hours left after `byNow.at`, none once `byNow.over`; without hours the day's expected; no forecast gives none. Verify it fails, implement, verify it passes
- [x] 5.2 `components/home/today.test.tsx`: leads with so far, then "of 18.0 expected", "17.8 expected by 3:35 PM" and "0.2 kWh still to come"; no forecast shows so far alone; the six totals from the day's `totals` (the house without the car, the car's charging apart); the chart's solar area ending at the latest record, the dashed forecast over every hour, the dimmed rest of the day and the negative charging and export; the three days ahead or "no forecast right now"; a totals event for today reloads `/api/forecast` and `/api/intervals?date=<today>`, a failed reload keeps the chapter and shows "as of" its time until one succeeds, a totals event for another day reloads nothing; the link to today in its month on `/solar`. Verify it fails, implement on `useReload` as `solar-page.tsx` does, verify it passes

## 6. The year

- [x] 6.1 `lib/home/solar-hours.db.test.ts` on the throwaway database: a day's 5-minute `solar_generated_wh` summed into its site-day hours (across a daylight-saving change), days before October 22, 2021 and after today absent, and the current year worked out again after a totals event for today while a past year is kept. Verify it fails, implement `solarHours()` with `keptFor`, verify it passes
- [x] 6.2 `app/api/solar-hours/route.test.ts`: 200 with the year's cells; 400 for a missing year, one before 2021 or after the current year. Verify it fails, implement, verify it passes
- [x] 6.3 `components/home/year.test.tsx`: the canvas's rows and columns from the cells, blank rows after today, today's row marked, its text summary; month labels beside the chart; a row's readout with date, kWh and its `/solar` link, following a drag, with 44-pixel previous-day and next-day buttons; focus with Up, Down, Home and End moving the readout, which is a polite live region; a year loading ("Loading 2023…", the shown year kept) and failing ("Couldn't load 2023" with Try again, the shown year still chosen); the switcher replacing the history entry, and below 640 pixels a menu button naming the year; the switcher's years 2021 to now, choosing one fetching it, replacing the address with `?year=` and not reloading; the shares and the `/impact` link for the year. Verify it fails, implement, verify it passes

## 7. Records

- [x] 7.1 `lib/home/records.test.ts`: the count of days (or months) since the record within 2% of it, and none; running-maximum steps from a daily series, the current record's date, a record set today, "set today", "set 5 days ago", "set 3 months ago", "set 4 years ago", and no outages. Verify it fails, implement, verify it passes
- [x] 7.2 `components/home/records.test.tsx`: four tabs (role tab, `aria-selected`) with Best solar day chosen, all four fully shown at 390 pixels; each tab's top five with `/solar` day or month links, its steps and its mark; the never-off-the-grid wording; the link to `/top`. Verify it fails, implement, verify it passes

## 8. Habits and Since 2021

- [x] 8.1 `components/home/habits.test.tsx`: "Since July it has run above last year" for a run of three or more months, the latest month's comparison otherwise; one line per year from Patterns' months on a scale in watts, the current year in the home color and labelled, the latest month and a year earlier with Patterns' labels (the earlier one left out when missing) and their difference in kWh a day, this year's Powerwall energy out, the link to `/patterns`. Verify it fails, implement, verify it passes
- [x] 8.2 `lib/impact.db.test.ts` (extended) and `components/home/since.test.tsx`: monthly figures since October 2021 equal to `impactFigures` month by month, their running totals, payback marks with and without costs and a projected year drawn apart, each line named and today marked, "solar has made as much as the house used" with its share, the sentence on the midday surplus and the night's draw, the solar since 2021, the true-up net so far in words ("611.4 kWh more imported than sent since October 1"), the Powerwalls' payback in words when it lies past their warranty, no dollar figure, the link to `/true-up`. Verify they fail, implement, verify they pass

## 9. The page

- [x] 9.1 `components/home/pick-a-day.test.tsx`: the date field empty with its `min` and `max`, changing it alone opening nothing, a date outside the span refused with a message naming it, submitting a date (Go or Enter) and Random day (with a seeded random) each opening that day on `/solar` in its month. Verify it fails, implement, verify it passes
- [x] 9.2 `app/page.test.tsx`: the page calls each reader with the linked page's arguments (corrected readings, the chosen year, the current true-up year, `topTen(false, …)`), honors `?year=` and falls back to the current year, and the first render holds the page's one h1 ("One home's 12.24 kW of Tesla solar and three Powerwalls, live and since October 22, 2021"), the six chapter words in order and Pick a day, each chapter with its chart and link, the same at 390 and 1440 pixels. Verify it fails, wire `app/page.tsx`, verify it passes

## 10. Integration

- [x] 10.0 DESIGN.md and `.impeccable/design.json`: record the oversized chapter words as the home page's pattern (an exception to "the largest type is a figure") and the chapter words' colors (no flow color but its flow's). Verify by reading both against the built page

- [x] 10.1 Full suite (`yarn vitest run`) and `yarn build && yarn start`: `/`, `/?year=2023` and `/solar` render under the production CSP with no console errors, and `/?day=2026-10-14&start=2026-10-01&end=2026-10-31` answers 308 to `/solar` with the same query (curl). Verify by the commands' output
- [x] 10.2 On an onyx branch container against the production database: time `/` (over one second means keeping the slow reads per site day, design's Risks), then zoomed screenshots at 390 by 844 and 1440 wide, and the top bar at 1366 and 1440, compared with the approved mockup; verify by your OK on the screenshots before pushing
- [x] 10.3 README: the page list, the new `/api/solar-hours` route and any mention of the Solar page at `/`. Verify by grepping README for `` `/` `` and "Solar page"
- [x] 10.4 Run `ponytail:ponytail-review` on the uncommitted diff in a fresh subagent, report the findings and wait for the pick before committing (all fourteen fixed, test-first, with still to come after sundown)

## Workflow follow-up

- Commit the code, then archive the change (spec sync included) as a second commit, `Archive home-story`, and open one PR. PRODUCT.md's new audience and the DESIGN.md commit already on this branch ride with it.
- Ask before publishing the release.
