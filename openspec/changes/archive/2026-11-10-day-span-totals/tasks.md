# Tasks

## 1. Mockups

- [x] 1.1 A new Design canvas, "Day Span Mockups": the day view's Grid view for November 9, 2026, with 4:00 PM to 12:00 AM selected, at 1280 pixels (headlines with the span's figure under the day's, breakdowns with a span column) and at 390 pixels (the Select toggle, the span's figures in place of the day's, Clear), with the real figures from production; the owner picks or adjusts before any code

## 2. The data

- [x] 2.1 Test first (`app/api/intervals/route.test.ts`, which runs `dayIntervals` against a database of its own): each record carries `<flow>_wh`, unrounded, beside `<flow>_kw`; null where its kW is null; the records' Wh per flow add up to the day's totals exactly. See it fail, then add the Wh in `dayIntervals`
- [x] 2.2 Test first (`lib/solar/day-views.test.ts`): `spanTotals` sums each flow's Wh over the records in `from <= minute < to` into kWh, skips records with null energy, and over 0 to 1440 equals the day's totals; `viewSummary` of it gives the span's headlines, breakdowns and net. See it fail, then add `spanTotals`

## 3. Selecting

- [x] 3.1 Test first (`components/solar/day-view.test.tsx`): a mouse drag from one step to another selects that span, snapped to steps, shaded and named ("4:00 PM to 12:00 AM") with Clear; a click without a drag selects nothing; Clear ends it; the span stays across a view switch and a reload of the same day, and ends when another day opens. See it fail, then add the span to `DayView` and the drag to `PowerChart`
- [x] 3.2 Test first: the Select toggle shows for a coarse pointer, a touch drag selects only while it is on, and it turns off once the span is selected. See it fail, then add it (a real touch drag is checked in 5.2)

## 4. The figures

- [x] 4.1 Test first: with a span, from 640 pixels the headlines and net line show the span's figures under the day's and the breakdowns a span column; under 640 pixels the span's figures and shares replace the day's; without a span nothing changes. See it fail, then build it
- [x] 4.2 The whole suite passes, `tsc` is clean, and `openspec validate day-span-totals --strict` passes; measure `/api/intervals`' size before and after for one day, gzipped

## 5. Verify

- [x] 5.1 A branch container on onyx against production: on November 9, 2026's Grid view, 4:00 PM to 12:00 AM gives Imported 8.7 kWh, and the whole day matches every headline; record in design.md under Results
- [x] 5.2 `yarn build && yarn start` against the local preview database: screenshots at 1280 and 375 pixels with a span selected, checked against the chosen mockup, and a touch drag with Select on in the phone-sized browser
- [x] 5.3 `ponytail:ponytail-review` on the uncommitted diff before the first commit, with its findings reported for the owner to choose

## 6. Rollout

- [ ] 6.1 With the owner's go-ahead, release; the run passes
- [ ] 6.2 On teslasolar.report: a span's totals on a past day against its intervals; record in design.md under Rollout

## Workflow follow-up

- Commit the code, then archive the change with its specs synced as a second commit, `Archive day-span-totals`, before opening the PR, which also carries the today-by-hour rollout record (553cb74).
