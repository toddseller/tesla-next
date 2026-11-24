# Tasks

## 1. The headline

- [x] 1.1 Add a failing test in `lib/true-up/text.test.ts`: '24 - '25 owing $554.83 after '23 - '24's $0 reads "'24 - '25 ended owing $555 at the true-up, after nothing due in '23 - '24."; and two years with nothing due still read "the same as". See it fail.
- [x] 1.2 Add the case to `pastHeadline`; 1.1 passes.

## 2. Verify

- [x] 2.1 `yarn test` and `yarn build` (its type check) pass.
- [x] 2.2 On an onyx branch container against live data, '24 - '25 on True-Up reads as the spec says; then the server's address for the OK before pushing.

## Workflow follow-up

- Record the scorecard round (15 of 15) and mark check 11 in `.impeccable/scorecard.md`, in this change's code commit.
- Fresh ponytail review of the diff, then the code commit, then `Archive headline-wording` with specs synced, then the PR.
