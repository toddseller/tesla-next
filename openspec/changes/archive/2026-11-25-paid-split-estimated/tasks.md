# Tasks

## 1. The Paid split says it's estimated

- [x] 1.1 Test first: in `lib/true-up/text.test.ts` (the '25 - '26 case and the credit case) and `components/true-up/savings-card.test.tsx`, expect the split to read "Estimated: PG&E $825 · WestLight $293" and "Estimated: PG&E $144 · WestLight $72 credit". Run them and see them fail on the old split.
- [x] 1.2 In `lib/true-up/text.ts`, prefix `paidSplit` with "Estimated: "; those tests pass.

## 2. Verify

- [x] 2.1 Whole suite and types pass (`yarn test`, `yarn tsc --noEmit`).
- [x] 2.2 `yarn build && yarn start`: `/true-up` at 390 and 1440, the Paid key's split line fits as before. Give the URL for the hand check before push.

## Workflow follow-up

- Run `ponytail:ponytail-review` on the uncommitted diff in a fresh subagent; report findings and wait.
- Commit the code, then `/opsx:archive` with spec sync as `Archive paid-split-estimated`, then open the PR.
