## 1. Naming a range

- [x] 1.1 `lib/solar/ranges.test.ts`: `rangeTitle` for a whole month, a calendar year, a true-up year, a day and another span. Verify it fails, add it to `lib/solar/ranges.ts`, verify it passes

## 2. Titles

- [x] 2.1 `app/layout.test.tsx`: the layout's title is "Tesla Solar Report" with the " · Tesla Solar Report" template. Verify it fails, change `app/layout.tsx`, verify it passes
- [x] 2.2 Page tests: Solar's `generateMetadata` for the current month, a calendar year and a day; Impact's for a range and for yesterday before any solar; True-Up's for the current year and a past one; static titles for Distribution, Patterns, Top Ten and Admin. Verify they fail, add the metadata (and the shared, cached range lookups on Impact and True-Up), verify they pass. React's `cache` doesn't memoize outside the server build, so the shared query isn't testable here; it rests on Next rendering metadata and the page in one request

## 3. The hidden h1s

- [x] 3.1 Distribution's component test: one h1, "Distribution", visually hidden. Verify it fails, add it, verify it passes
- [x] 3.2 `components/solar/day-panel.test.tsx`: one h1, "Solar on Sat, Nov 14, 2026", visually hidden, following the shown day. Verify it fails, add it, verify it passes

## 4. Verify

- [x] 4.1 Full suite and `yarn build`; on an onyx branch container, every page's title, a preset change updating Solar's title, and zoomed screenshots of Distribution and a Solar day at 1440 and 390 showing them unchanged; verify by your OK before pushing
- [x] 4.2 Run `ponytail:ponytail-review` on the uncommitted diff in a fresh subagent, report the findings and wait for the pick before committing

## Workflow follow-up

- Commit the code, then `/opsx:archive` with the specs synced and commit "Archive page-titles"; push over SSH and open the PR.
