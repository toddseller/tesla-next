# Tasks

## 1. One name for a true-up year

- [x] 1.1 Test first: in `lib/solar/ranges.test.ts`, the exported `trueUpName("2025")` is "2025‑26" (non-breaking hyphen), `trueUpName("2099")` is "2099‑00", and `datesLabel` and `step` name 2025-10-01 to 2026-09-30 "2025‑26" (update the cases quoting "'25 - '26"). See them fail, then export `trueUpName` taking the start year and use it in `yearName`; the tests pass.
- [x] 1.2 Test first: in `lib/true-up/text.test.ts`, `yearName("'25 - '26")` is "2025‑26", and the headline and sentence cases read "2025‑26 ended owing $768 at the true‑up, $213 more than 2024‑25." and "if the rest of the year goes like 2024‑25 or 2025‑26". See them fail, then make `yearName` call `trueUpName(\`20${label.slice(1, 3)}\`)`; the tests pass.
- [x] 1.3 Test first: in `lib/backup-figures.test.ts` and `components/impact/backup-section.test.tsx`, blips per year are labeled "2021‑22", the heading reads "Backup · 2023‑24" and the Earlier button "2023‑24". See them fail, then build `blipsPerYear`'s label with `trueUpName(String(year))` (check no import cycle); the tests pass.
- [x] 1.4 Test first: in `lib/terms.test.ts`, the true-up definition says "so 2025‑26 is October 2025 to September 2026". See it fail, then change `lib/terms.ts`; the test passes.
- [x] 1.5 Update the remaining display tests that quote the old form (True-Up page, chart legend, tiles, savings and payback cards, `app/true-up/page.test.tsx`, Impact, dashboard shell, `app/page.test.tsx`) to the new name; data-key tests (`true_up`, API routes, DB tests, `/admin`) keep "'25 - '26". `grep -rn "' - '" components app lib` leaves only data keys and `/admin`.

## 2. The billed tile

- [x] 2.1 Test first: in `lib/true-up/text.test.ts` and `components/true-up/tiles.test.tsx`, $827.82 billed against $825.00 estimated reads "$2.82" with "more than the estimate", $612.40 against $613.00 reads "$0.60" with "less than the estimate", and equal stays "Exact". See them fail, then change `billedText`'s unit; the tests pass.

## 3. Year rows in the cycle list

- [x] 3.1 Test first: in `components/true-up/cycle-list.test.tsx`, cycles across two true-up years give one disclosure per year (its summary naming the year, Imported, Exported, Net from `totals()` and the summed charges), only the last year's open; a year with a calculated cycle shows "est." on its sum; a year with a cycle without charges shows none; one true-up year has no disclosures. See them fail.
- [x] 3.2 In `components/true-up/cycle-list.tsx`, replace the `h3` subheads with `<details>` per year: a `<summary>` on the cycle rows' grid (one shared class constant), a `ChevronRight` turning on open, the browser marker hidden, `open` on the last year; the charges via `chargesText` with the summed charges. The tests pass.

- [x] 3.3 Review fix, test first: in `components/true-up/cycle-list.test.tsx` and `components/true-up/true-up-page.test.tsx`, a custom range across true-up years starts with every year open and All time with only the last. See them fail, then pass `allTime={isTrueUpAllTime(range, years)}` to `CycleList` and open every year when it's false; the tests pass.

## 4. Verify

- [x] 4.1 Whole suite and types pass (`yarn test`, `yarn tsc --noEmit`).
- [x] 4.2 `yarn build && yarn start`: True-Up at All time shows six year rows with only 2026‑27 open, figures aligned with the cycle rows at 1440 and 390 wide, opening and closing by keyboard; 2025‑26 shows the billed tile's new wording and the headline "2025‑26 ended owing..."; the preset button, page title and Impact's Backup heading and blips line read the new name; nothing wraps mid-name at 390. Give the URL for the hand check before push.

## Workflow follow-up

- Run `ponytail:ponytail-review` on the uncommitted diff in a fresh subagent; report findings and wait.
- Commit the code, then `/opsx:archive` with spec sync as `Archive true-up-years-written-out`, then open the PR.
- Record the PR number in the round 8 memory as group 3.
