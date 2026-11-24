# Tasks

## 1. Link names stay on one line

- [x] 1.1 In `components/top-bar.test.tsx`, add to the "links never wrap" test (dashboard-shell, "The frame fits any screen") that every wide-nav link carries `whitespace-nowrap`. See it fail for the missing class.
- [x] 1.2 Add `whitespace-nowrap` to the wide nav's link class in `components/top-bar.tsx`; 1.1 passes.

## 2. Verify

- [x] 2.1 `yarn test` and `yarn build` (its type check) pass.
- [x] 2.2 Rendered under the production build (`yarn build && yarn start`, or an onyx branch container for live data), measured in headless Chrome: at 768, 1024, 1440 and 1536, no link's name spans two lines and nothing scrolls sideways; at 1440 with an extra pill forced into the bar (STORM WATCH, by editing the status in the page), the live status drops to its own row while the links stay one row; at 1512 without one, the bar is one line. Then give the server's address for the OK before pushing.

## Workflow follow-up

- Fresh ponytail review of the diff, then the code commit, then `Archive nav-link-wrap` with specs synced, then the PR.
- Update the `critique-round-7` memory with the PR number.
