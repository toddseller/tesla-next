# Tasks

## 1. The note names the bars' unit

- [x] 1.1 Test first: in `components/solar/range-chart.test.tsx` the note ends "that day" under a month's daily bars and "that month" under a year's monthly bars. Run it and see the monthly case fail.
- [x] 1.2 End the note in `components/solar/range-chart.tsx` by `isDaily(range)`; the tests pass.

## 2. The forecast only on a range with today

- [x] 2.1 Test first: in `app/solar/page.test.tsx` a past range (April 2023) is served without the card and without asking for the forecast, and a range running past today (the true-up year) with it. Run it and see the past range fail.
- [x] 2.2 In `app/solar/page.tsx` ask for the forecast and pass the card only when the range includes today; the tests pass.
- [x] 2.3 Move `components/solar/solar-page.test.tsx`'s forecast tests that use a past range (March) to ranges that include today, since the page is no longer served a card there.

## 3. Verify

- [x] 3.1 Whole suite and types pass (`yarn test`, `yarn tsc --noEmit`).
- [x] 3.2 `yarn build && yarn start`: `/solar` shows the card, 2023 and April 2023 don't, 2023's note says "that month" and April 2023's "that day". Checked by hand in the browser before push.

## Workflow follow-up

- Run `ponytail:ponytail-review` on the uncommitted diff in a fresh subagent; report findings and wait.
- Commit the code, then `/opsx:archive` with spec sync as `Archive solar-caption-and-forecast`, then open the PR.
