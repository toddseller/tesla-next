# Tasks

## 1. The builder

- [x] 1.1 Change `yearExplained`'s tests in `lib/true-up/text.test.ts` to `rangeExplained({ name, under, soFar, share, net })` with the same wording, and add All time's and a past custom range's sentences from the spec; see them fail.
- [x] 1.2 Turn `yearExplained` into `rangeExplained` and update Home's caller (`components/home/since.tsx`); 1.1 passes and Home's tests still pass.

## 2. True-Up's lead

- [x] 2.1 Write failing tests: `lib/true-up/share` gives the cycles' days with the share; `app/true-up/page.test.tsx` serves All time and a custom range with their sentence; `components/true-up/true-up-page.test.tsx` shows a year without a headline, All time and a custom range leading with their sentence at the lead size and no subtitle, a headline year keeping it muted under the headline, and a year with no house use keeping the subtitle.
- [x] 2.2 Return the days from `cyclesShare`, pass them to `TrueUpPage`, name non-year ranges from them, and render the sentence as the lead without a headline; 2.1 passes.

## 3. Verify

- [x] 3.1 `yarn test` and `yarn build` (its type check) pass.
- [x] 3.2 On an onyx branch container against live data: True-Up's All time, '21 - '22 to '25 - '26, the current year and a custom range read as the spec says at 1440 and 390; then the server's address for the OK before pushing.

## Workflow follow-up

- Record the scorecard round in `.impeccable/scorecard.md` (14 of 15; check 10 passing; check 11 failing on True-Up, with the evidence) and mark check 10, in this change's code commit.
- Fresh ponytail review of the diff, then the code commit, then `Archive true-up-lead` with specs synced, then the PR. After release, mark check 11.
