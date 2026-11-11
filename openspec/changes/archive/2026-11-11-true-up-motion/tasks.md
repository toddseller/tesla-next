# Tasks

## 1. Before starting

- [x] 1.1 Branch `true-up-motion` from `payback-cache-rollout`, so the `Record the payback-cache rollout` commit rides in this change's PR; `git log` shows it under the new branch's first commit

## 2. The count-up

- [x] 2.1 Test first (`components/count-up.test.tsx`):
  - `CountUp` shows "$0" on mount for "$410" and reaches "$410" within 500 ms;
  - it keeps "1,840" and "12.5%" formatting while counting;
  - a screen reader gets "$410" at once, and the counting copy is `aria-hidden`;
  - a new text after the first count shows at once;
  - under reduced motion it shows "$410" at once.

  See them fail, then add `CountUp` and `useTween`'s optional starting value; `rolling.test.tsx` and the whole suite pass
- [x] 2.2 Test first (`components/true-up/*.test.tsx`): the tiles' values and the savings card's figures render through `CountUp`, and the Payback card's years don't. See it fail, then use it there; the whole suite passes

## 3. The Payback card

- [x] 3.1 Test first (`components/true-up/payback-card.test.tsx`, `app/motion.test.ts`): the story's classes and delays from the schedule, first at 2.4 s across and 600 ms stops after a 650 ms wait; no story classes once it has played; the phone's steps on the same delays; the reduced-motion block lists the new classes. Done, then reworked by 3.3 and 3.4 after it felt too fast
- [x] 3.2 Test first (`components/true-up/payback-card.test.tsx`): on a phone, the rail from Today to the whole-system year is the dashed solar pattern, the rails before Today are solid solar, and the one after the whole-system year is grey. See it fail, then change the phone's rails; the whole suite passes

- [x] 3.3 Test first (`components/true-up/payback-card.test.tsx`, `app/motion.test.ts`):
  - the story waits, its pieces carrying `motion-waiting`, until half the timeline is in view (a mocked `IntersectionObserver`), then plays from that moment at 6 s across the track and 900 ms stops, with even stretches;
  - it never replays after a reload or a range change;
  - `motion.css` shows waiting pieces under `@media (scripting: none)` and under reduced motion.

  See them fail, then start the story in view in `payback-card.tsx` and add the rules; the whole suite passes
- [x] 3.4 Test first (`components/true-up/payback-card.test.tsx`, `app/motion.test.ts`):
  - a landing dot carries `motion-land` and a ring with `motion-ring` at its stop;
  - the connector `motion-raise` at +160 ms over 260 ms;
  - the label `motion-grow` at +320 ms over 600 ms, its peak 1.4 for solar's mark and 1.15 for the others;
  - the keyframes overshoot to 112% and grow from 85% to `var(--peak)`.

  See them fail, then add them; the whole suite passes

- [x] 3.5 Test first (`lib/true-up/payback.test.ts` or `payback.cache.test.ts`, `app/api/payback` route test): `payback()` gives solar's `month` ("YYYY-MM") when solar has paid back, and `null` when it is projected. See it fail, then add it; the whole suite passes
- [x] 3.6 Test first (`components/true-up/payback-card.test.tsx`):
  - the solar mark shows "Jun '25" under its label on desktop and " · Jun '25" beside it on the phone, fading in 920 ms into its stop;
  - its connector raises, then shrinks (`motion-shrink`) as the month comes, resting at 12 px;
  - no month for a projected solar payback;
  - the screen-reader label says "June 2025";
  - the footnote says "Years, and the month solar paid back."

  See them fail, then add them; the whole suite passes

- [x] 3.7 Test first (`app/motion.test.ts`, `components/true-up/payback-card.test.tsx`):
  - the stretches' and `motion-uncover`'s keyframes end at an `inset(0 0 0 0)` shape, so a reveal blends across its whole time;
  - solar's dot sits at the 15th of its month, and a projected one at mid-year;
  - the forecast's fill sets `--hidden` to the share it keeps covered, and `motion-uncover` ends at `var(--hidden, 0%)`, so a fill uncovers to its share (`components/solar/forecast.test.tsx`).

  See them fail, then fix them; the whole suite passes

- [x] 3.8 Test first (`components/impact/sections.test.tsx`, `impact-page.test.tsx`): another range keeps Solar offset's bars, which move by their clip to the new lengths after entering, uncover only on first view, and roll the energy offset and their kWh. See them fail, then change `SolarOffset`; the whole suite passes

- [x] 3.9 Test first (`components/impact/car-charging.test.tsx`, `impact-page.test.tsx`): another range keeps the car charging ring and each car's split; a split's sources are cut to their stretches with the gaps, move by clip to new shares, and the kWh roll; a car new to the range uncovers on its own. See them fail, then change the section; the whole suite passes

## 4. Verify

- [x] 4.1 The whole suite passes, `tsc` is clean, `openspec validate true-up-motion --strict` passes, and `yarn build && yarn start` serves `/true-up` with no CSP violation in the console. A local build can't reach the database, so the CSP was checked on 4.2's branch container, which serves the production build
- [x] 4.2 A throwaway branch container on onyx reading production read-only, through an SSH tunnel:
  - on the first view, the amounts count up and the years don't;
  - the Payback story waits until the card is scrolled into view, then plays at 6 s across and 900 ms per stop, each mark landing (overshoot and ring, connector, growing label, solar's most), on desktop and phone, with the phone's dashed projection, as on the mockup;
  - without JavaScript the timeline shows complete;
  - a reload on totals and a range change don't count or replay;
  - reduced motion shows everything at once;
  - Chrome's performance panel reports a cumulative layout shift of 0 at 1280 and 375 px;
  - there is no CSP violation.

  Take zoomed screenshots mid-count, mid-story and complete, at 1280 and 390 px, and record the results in design.md under Results
- [x] 4.3 Show the screenshots and the branch container, and wait for an OK before pushing. OK given 2026-11-11, after the uncover, the solar dot at its month, and Impact's bars, ring and car splits moving to a new range
- [x] 4.4 `ponytail:ponytail-review` on the uncommitted diff before the first commit, with its findings reported to choose from. First review: chosen and fixed test first: 1b, the counting figure is blank, not zero, until the page hydrates, which also fixed a hydration mismatch under reduced motion; 2, one `playing()` call per element in the Payback card. Second review: chosen and fixed test first (3.7): 1, solar's dot at its month; with it, `motion-uncover`'s end shape, found while checking the story's line. Third review, after Impact's bars: both fixed test first: 1, cars of one name (the default name, for a car missing from the account's list) no longer share a React key; 2, Solar offset's bar keeps `rounded-md`, so its left end matches the track's while the uncover's clip rounds 4 px

## 5. Rollout

- [ ] 5.1 Release (ask first); the deploy's health check passes, and teslasolar.report shows the count-up and the Payback story on a first view, desktop and phone; record in design.md under Rollout

## Workflow follow-up

- Commit the code, then archive the change with its specs synced as a second commit, `Archive true-up-motion`. Push and open the PR, which also carries the payback-cache rollout record, only after 4.3's OK.
