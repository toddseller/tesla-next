## 1. The morning sentence

- [x] 1.1 `lib/home/today.test.ts`: `solarWindow(hours)` gives the start of the hour by which 10% of the expected kWh has come and the end of the hour before 90% has; no hours give none. Verify it fails, implement in `lib/home/today.ts`, verify it passes
- [x] 1.2 `components/home/today.test.tsx`: at 8:00 AM the chapter reads "Sunrise 6:58 AM. Most of today's 22.6 kWh is expected between 10 AM and 3 PM."; after the window begins, or without hours, there is none. Verify it fails, implement in `components/home/today.tsx`, verify it passes

## 2. Impact opens on a whole day

- [x] 2.1 `app/impact/page.test.tsx`: with no range, today's solar at 0.0 kWh shows yesterday and at 0.4 kWh shows today; a valid range is shown as asked. Verify it fails, implement in `app/impact/page.tsx`, verify it passes

## 3. Today's totals under Distribution's scene

- [x] 3.1 Move the six totals into `TodayTotals({ day })`, used by `Today`; its tests keep passing unchanged. Then `components/scene/today-so-far.test.tsx`: on a phone the browser fetches today and shows "Today so far", solar made, the six totals and "Today, hour by hour" linking to today on `/solar`; on a wide screen it fetches nothing; no block until the figures arrive or if they fail; a totals event for today and the stream's return after a sleep fetch again. `app/distribution/page.test.tsx`: the page reads no database. Verify they fail, implement in `components/scene/today-so-far.tsx` and `components/scene/distribution.tsx`, verify they pass

## 4. Verify

- [x] 4.1 Full suite and `yarn build`; on an onyx branch container, zoomed screenshots at 390 and 1440 of the home page's Today (with the clock set to a morning hour), Impact opened with no range, and Distribution, and no console errors; verify by your OK on the screenshots before pushing
- [x] 4.2 Run `ponytail:ponytail-review` on the uncommitted diff in a fresh subagent, report the findings and wait for the pick before committing
