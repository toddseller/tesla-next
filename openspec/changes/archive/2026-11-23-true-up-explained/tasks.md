# Tasks

## 1. The explanation

- [x] 1.1 Write failing tests in `lib/true-up/text.test.ts` for `yearExplained`: each of the spec's four scenarios word for word, and a year that sent exactly as much as it drew. See them fail for the missing function.
- [x] 1.2 Add `yearExplained` to `lib/true-up/text.ts`; 1.1 passes.

## 2. True-Up

- [x] 2.1 Write failing tests: `components/true-up/true-up-page.test.tsx` shows the sentence under the lead for a true-up year and none for All time; `app/true-up/page.test.tsx` loads the year's Impact figures for its days up to today. See them fail.
- [x] 2.2 Load the share in `app/true-up/page.tsx` and render the sentence in `components/true-up/true-up-page.tsx`; 2.1 passes.

## 3. Home

- [x] 3.1 Write failing tests in `components/home/since.test.tsx`: the bridge and the year's sentence in place of the midday paragraph, the sentence alone when not yet matched, and the estimate under the net with its true-up month, or none without projections. See them fail.
- [x] 3.2 Load this year's share and cost in `app/page.tsx`, add the shared estimate helper beside `currentHeadline`, and render both in `components/home/since.tsx`; 3.1 passes, and the home page's route tests still pass.

## 4. Verify

- [x] 4.1 `yarn test` and `yarn build` (its type check) pass.
- [x] 4.2 On an onyx branch container against live data: Home's Since 2021 and True-Up for this year, '25 - '26, '22 - '23, '23 - '24 and All time read as the mockups do at 1440 and 390; then the server's address for the OK before pushing.

## Workflow follow-up

- Mark scorecard checks 8 and 11 (released in v2026.11.23.10) in this change's code commit, noting Patterns for 11.
- Fresh ponytail review of the diff, then the code commit, then `Archive true-up-explained` with specs synced, then the PR. After release, mark checks 12 and 13 on the next branch.
