# Tasks

## 1. Mockups

- [x] 1.1 Mockups of the readings switch and its note on the Solar range view, the Solar day view, Impact, Patterns and Top Ten (beside its VPP switch), at 1280 and 375 pixels, with production's figures for one corrected range shown both ways; the chosen placement recorded in design.md, settling the open question

## 2. The window and the daily figures

- [x] 2.1 Test first (`lib/meter.test.ts`): `readingsOf` is `"tesla"` only for `readings=tesla`; the window's dates; then add `lib/meter.ts`, with `lib/range.ts` and `lib/true-up/grid.ts` importing the fix date from it; the tests pass
- [x] 2.2 Test first (`lib/range.db.test.ts`, `lib/impact.db.test.ts`, `lib/top-ten.db.test.ts`): with `"tesla"`, a day with a PG&E reading shows Tesla's import, export and home use; corrected stays as today (the spec's 2025-12-10 scenario); then make the fragments and `dailyItem` take the choice and pass it through `rangeTotals`, `impactFigures` and `topTen`; the tests pass

## 3. The 5-minute steps

- [x] 3.1 Test first (`lib/intervals/steps.db.test.ts`, on the throwaway database): for a corrected day, the steps' import and export add up to PG&E's reading; the import difference lands by home use from the grid and the Powerwall (the night scenario); a day with no Tesla import gets the meter's import spread by that use; the export difference comes out of home use from solar, never below zero; a day without a PG&E reading, a day after the fix, and `"tesla"` return the stored columns; then add `energySteps`; the tests pass
- [x] 3.2 Test first: `dayIntervals` (`/api/intervals`), `dayCharging` (car charging) and the three Patterns queries read through `energySteps` with the choice; `/api/intervals?readings=tesla` answers as stored; the kept memories key on the choice; then wire them; the tests pass
- [x] 3.3 On production, read-only: corrected Always on for June to August 2025 against June to August 2026 (after the fix), and for a winter month against the same Powerwall-fed nights; record the figures in design.md; if summer overshoots by more than about 150 W, move the import weighting to home use from the grid (Powerwall only on days without grid draw), test first, and record why

## 4. The switch on the pages

- [x] 4.1 Test first (`components/readings-switch.test.tsx`): two buttons, Corrected pressed by default, picking one replaces the address with `readings=tesla` added or removed and other parameters kept; then add it; the tests pass
- [x] 4.2 Test first: the Solar page (range and day view), Impact, Patterns and Top Ten show the switch and the note only when their span reaches the window, read `readings` from the address, pass it to their data and every reload; Top Ten keeps `vpp` alongside; True-Up shows none; then wire them; the tests pass

## 5. Verify

- [x] 5.1 The whole suite passes, `tsc` is clean, `openspec validate meter-corrected-readings --strict` passes
- [x] 5.2 A throwaway branch container on onyx, read-only against production:
  - October 2025 on the Solar page and Impact matches today's live figures when corrected, and shows about half the grid figures with As Tesla reported;
  - the day view of a winter day's steps adds up to PG&E's import;
  - Patterns' Always on no longer shows the year-over-year jump;
  - switching survives a reload;
  - Patterns' cold time is recorded;
  - 1280 and 375 pixels, no CSP violation.
  Record in design.md under Results.
- [x] 5.3 `ponytail:ponytail-review` on the uncommitted diff before the first commit, with its findings reported to choose from; the one finding, chosen and fixed: the open day's reload was kept by its date alone, so a day reloaded in one view could stay on screen after switching to the other; it is now kept by view and date, with a test shown failing first (12.3 kWh corrected still showing where Tesla's 5.0 was served)

## 6. Rollout

- [x] 6.1 Release (ask first); the deploy's health check passes, and teslasolar.report shows the switch on October 2025 with corrected figures by default; record in design.md under Rollout

## Workflow follow-up

- Commit the code, then archive the change with its specs synced as a second commit, `Archive meter-corrected-readings`, before opening the PR, which also carries the page-transitions rollout record (757069f).
