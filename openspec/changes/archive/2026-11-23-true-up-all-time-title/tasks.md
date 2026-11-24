# Tasks

## 1. The name

- [x] 1.1 Add failing tests: `app/true-up/page.test.tsx` gives All time the title "True-Up · All time · Tesla Solar Report"; `components/true-up/true-up-page.test.tsx` heads All time's chart "All time by billing cycle". See them fail.
- [x] 1.2 Name True-Up's All time range "All time" in its title and chart heading; 1.1 passes.

## 2. Verify

- [x] 2.1 `yarn test` and `yarn build` (its type check) pass.
- [x] 2.2 On an onyx branch container against live data, True-Up's All time shows both; then the server's address for the OK before pushing.

## Workflow follow-up

- Fresh ponytail review of the diff, then the code commit, then `Archive true-up-all-time-title` with specs synced, then the PR.
