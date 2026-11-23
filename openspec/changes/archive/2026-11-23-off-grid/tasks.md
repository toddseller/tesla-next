# Tasks

## 1. Redirect a range or day the page can't show

- [x] 1.1 Write failing tests in `lib/solar/ranges.test.ts` for the check beside `parseRange`: no range does nothing; a malformed, out-of-span, inverted or half range redirects to the path without `start` and `end`, keeping other params; Solar's invalid `day` redirects without `day`, keeping the range. Run them and see them fail for the missing function.
- [x] 1.2 Add the check to `lib/solar/ranges.ts`; the tests in 1.1 pass.
- [x] 1.3 Change the "malformed range" and "future day" tests in `app/solar/page.test.tsx`, `app/impact/page.test.tsx` and `app/true-up/page.test.tsx` to expect the redirect (as `app/page.test.tsx` mocks `permanentRedirect`); see them fail, then call the check first in each page's default export; they pass.

## 2. The 404 page

- [x] 2.1 Write a failing `app/not-found.test.tsx`: it renders the h1 "You've gone off-grid", the sentence with the path from `usePathname()`, Pick a day, and a link to `/`; its metadata title is "Not found". Run it and see it fail for the missing file.
- [x] 2.2 Add `app/not-found.tsx` (and the small path component) on the design tokens; the test passes.

## 3. Verify

- [x] 3.1 `yarn test` and `yarn build` (its type check) pass.
- [x] 3.2 Under `yarn build && yarn start`: `/nope` answers 404 on the dark field at 1440x900 and 390x844 with a light-mode browser; `/solar?start=banana`, `/impact?start=2030-01-01&end=2030-01-31` and `/true-up?start=x` redirect (307) to their plain addresses; `/solar?start=2026-10-01&end=2026-10-31&day=soon` keeps its range. Screenshots for the OK before pushing.

## Workflow follow-up

- Fresh ponytail review of the diff, then the code commit, then `Archive off-grid` with specs synced, then the PR.
