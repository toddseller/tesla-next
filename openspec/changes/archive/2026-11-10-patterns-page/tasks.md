# Tasks

## 1. The rename

- [x] 1.1 `git mv` `app/health`, `components/health` (`health-page.tsx` to `patterns-page.tsx`) and `lib/health*.ts` to their `patterns` names, renaming `health()` to `patterns()` and `Health` to `Patterns`; the whole suite passes unchanged in behavior
- [x] 1.2 Test first: the page test expects "Patterns" as the heading (`app/patterns/page.test.tsx`), and `components/top-bar.test.tsx` expects Patterns (`/patterns`) last and marked current on `/patterns`; see both fail on "Health", then change the heading and the top bar's link
- [x] 1.3 Test first: `next.config.test.ts` expects `/health` to redirect permanently to `/patterns` after `/numbers`; see it fail, then add the redirect

## 2. House use by month and hour

- [x] 2.1 Test first (`lib/patterns.db.test.ts`): the hours query averages each month's intervals by site-time hour from all three house sources in watts (200 Wh is 2,400 W, whatever the source), starts at the first of the month 23 months before today's month, and leaves out an hour with no intervals; an empty table gives no rows. See it fail, then add the third query to `patterns(today)` and pass `today` from the page
- [x] 2.2 Test first (`lib/patterns.test.ts`): `hourGrids` gives December 2025 to November 2026 and December 2024 to November 2025 on 2026-11-10, oldest first, 24 hours each, null for a missing hour or month, and only 12 AM for December on December 1 at 12:30 AM; `stepOf` gives 0 for 999 W and under 500 W, 1 for 1,000 W, 6 for 3,500 W and over

## 3. The section

- [x] 3.1 Add the seven `--color-use-*` tokens to `app/globals.css` in a `@theme` block of their own and check `app/globals.test.ts` still passes
- [x] 3.2 Test first (`components/patterns/house-use.test.tsx`): two tables captioned "The last 12 months" and "The 12 months before", 12 month row headers ("Dec '25") and 24 hour column headers each; a cell's step class from its watts (September 2026 1 AM deepest, 1 PM the 1.5 to 2 kW step), its hidden value "6.2 kW", and an empty unstepped square with "no readings" for a missing hour; the key's seven swatches labelled 0.5 to 3.5+; the no-readings message with no tables when there are no rows. See it fail, then write `components/patterns/house-use.tsx`
- [x] 3.3 Test first (`app/patterns/page.test.tsx`): the first response holds the three sections in order, Always-on load, When the house uses power, Powerwall use; then place the section in `patterns-page.tsx`

## 4. Verify

- [x] 4.1 The whole suite passes, `tsc` is clean, and `openspec validate patterns-page --strict` passes
- [x] 4.2 Local `yarn build && yarn start` on a throwaway database seeded with two years of intervals: `/patterns` at 1280 and 375 pixels against the D boards, every hour of both grids showing at 375, `/health` answering a permanent redirect, the top bar at 1512 and 390 pixels, no CSP violation or console error
- [x] 4.3 With the owner's go-ahead, a throwaway branch container on onyx against production: the grids match the spike (September 2026 1 AM about 6.2 kW, September 2025 1 PM about 3.7 kW), and how long `/patterns` takes; record both in design.md under Results
- [x] 4.4 `ponytail:ponytail-review` on the uncommitted diff before the first commit, with its findings reported for the owner to choose

## 5. Rollout

- [x] 5.1 With the owner's go-ahead, release; the deploy's health check passes
- [x] 5.2 On teslasolar.report: `/patterns` at 1280 and 375 pixels, `/health` redirecting, the top bar on one line at 1512 pixels; record in design.md under Rollout

## Workflow follow-up

- Commit the code, then archive the change with its specs synced (`patterns-page` created, `health-page` retired, `dashboard-shell` updated) as a second commit, `Archive patterns-page`, before opening the PR, which also carries the health-page rollout record (c2edc9e) and the dashboard-shell purpose fix (621b00e).
