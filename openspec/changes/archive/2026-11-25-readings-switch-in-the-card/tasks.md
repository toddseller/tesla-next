# Tasks

## 1. Solar's range view

- [x] 1.1 In `components/solar/solar-page.test.tsx`, add a test that for October 2025 the "Grid readings" group sits inside the range card (`section` labeled by the range's dates), in the same row as the corrected note, and not in the heading's row; run it and see it fail because the switch is in the header
- [x] 1.2 In `components/solar/solar-page.tsx`, move `ReadingsSwitch` from the header into one wrapping row with `ReadingsNote` at the card's foot (note first; the switch already goes full width below `sm`), and see 1.1 and the existing readings tests pass

## 2. Impact

- [x] 2.1 In `components/impact/impact-page.test.tsx`, add the same test for Impact's 2025 range card; run it and see it fail for the same reason
- [x] 2.2 In `components/impact/impact-page.tsx`, make the same move, and see 2.1 and the existing Impact tests pass

## 3. Checks

- [x] 3.1 Run the whole suite (`yarn test`), lint and `yarn build`, and see them pass
- [x] 3.2 In the browser at 1440, 1024 and 390, step Solar and Impact from This month to This year to True-up year: the header doesn't move, and the switch shows beside the note only for This year; the note and switch read well together at each width (owner checks before push)

## Workflow follow-up

- Run `ponytail:ponytail-review` in a fresh subagent on the uncommitted diff and report its findings before the first commit.
- Commit the code, then archive the change (specs synced) as a second commit, `Archive readings-switch-in-the-card`, on this branch before opening the PR.
