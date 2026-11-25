# Tasks

## 1. The term

- [x] 1.1 In `lib/terms.test.ts`, add `readings` to the expected keys and check its definition names October 6, 2023, April 26, 2026, Corrected and As Tesla reported. See it fail.
- [x] 1.2 Add the `readings` term ("Grid readings", the definition in design.md) to `lib/terms.ts`; 1.1 passes.

## 2. The label on the switch

- [x] 2.1 In `components/readings-switch.test.tsx`, expect the group named "Grid readings", a "Grid readings" button before it that opens the readings definition in a popover without calling `router.replace`, and no hint on "Corrected" or "As Tesla reported". Change the group name the Solar page, day panel and Impact tests query to "Grid readings". See them fail.
- [x] 2.2 In `components/readings-switch.tsx`, return the `Term` label and the group together (the label above the switch at every width, the rows holding it aligned along the bottom), and rename the group; 2.1 passes.

## 3. Verify

- [x] 3.1 `yarn test` and `yarn build` (its type check) pass.
- [x] 3.2 In an onyx branch container under the production CSP: Solar for October 2025 (range and a day), Impact for 2025, Patterns and Top Ten at 1440 and 390 show the hinted label before the switch, and tapping it opens the definition; Impact at 1024 and 1440 keeps its heading and controls on one row; Solar for May 2026 shows no label. Zoom in on the label's alignment with the switch. Then give the server's address for the OK before pushing.

## Workflow follow-up

- Fresh ponytail review of the diff, then the code commit, then `Archive readings-hint` with specs synced, then the PR.
- Update the `critique-round-7` memory with the PR number.
