# Tasks

## 1. The redirect marks what it dropped

- [x] 1.1 In `app/solar/page.test.tsx`, `app/impact/page.test.tsx` and `app/true-up/page.test.tsx`, change the redirect expectations to the specs' addresses with `unshown=1` (for example `NEXT_REDIRECT /solar?readings=reported&unshown=1`), and add the Solar cases for a bad range with a valid day (`/solar?day=2026-10-14&unshown=1`), a malformed day in a range, and a refused address that already carries `unshown` (the marker appears once). See them fail for the missing marker.
- [x] 1.2 In `lib/solar/ranges.ts`, make `dropUnshown` leave out any existing `unshown` and add `unshown=1`; 1.1 passes.

## 2. The notice

- [x] 2.1 Write `components/unshown-notice.test.tsx`: given a range, it renders "That link asked for dates the site doesn't have, so this shows November 2026." with `role="status"`, and it replaces `/solar?readings=reported&unshown=1` with `/solar?readings=reported` (and `/true-up?unshown=1` with `/true-up`) while the line stays on screen; given no range (the day view), it renders nothing and still removes the marker. See it fail for the missing component.
- [x] 2.2 Write `components/unshown-notice.tsx` (a client component; `rangeTitle` names the range); 2.1 passes.
- [x] 2.3 In the three server page tests, which render each client page whole, add: `unshown=1` shows the line between the title row and the page's first section, naming the shown range as the tab title does ("November 2026", "Nov 8, 2026", "'26 - '27"); without it there's no line; Solar's day view with `unshown=1` shows no line. See them fail.
- [x] 2.4 Have each server page pass `unshown: params.unshown === "1"` and each client page render the notice (Solar's day view renders it without a range); 2.3 passes.

## 3. The year readout stays in view

- [x] 3.1 In `components/home/year.test.tsx`, check that the column holding the day readout carries `md:sticky`, `md:top-6` and `md:self-start`. See it fail.
- [x] 3.2 Add those classes to the side column in `components/home/year.tsx`; 3.1 passes.

## 4. Verify

- [x] 4.1 `yarn test` and `yarn build` (its type check) pass.
- [x] 4.2 Under the production CSP (`yarn build && yarn start`, or an onyx branch container where a page needs data): `/solar?start=2030-01-01&end=2030-01-31`, `/impact?start=nope&end=2026-10-31` and `/true-up?start=2030-10-01&end=2031-09-30` each land on the default range with the line under the title, and the address bar then shows no `unshown`. Reloading shows no line, and picking a preset removes the line. At 1440 by 900 and 1280 by 800, pointing at the year chart's November rows on Home keeps the readout on screen; at 390 the chapter looks as it does today. Then give the server's address for the OK before pushing.

## Workflow follow-up

- Fresh ponytail review of the diff, then the code commit, then `Archive unshown-range-notice` with specs synced, then the PR.
- Update the `critique-round-6` memory with the PR number.
