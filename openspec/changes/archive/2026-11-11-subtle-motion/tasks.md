# Tasks

## 1. Check the platform first

- [x] 1.1 A throwaway spike, not committed: in a `yarn build && yarn start` production build under the production CSP, a `router.replace` with `{ transitionTypes: ["day-next"] }` around a `<ViewTransition>` runs `document.startViewTransition` with the type, and a recharts `Area` with `fill="none"` reveals left to right with `animationEasing="linear"`; if either fails, stop and bring it back to the owner before task 2

## 2. Shared pieces

- [x] 2.1 Test first (`components/use-tween.test.ts`): `useTween` returns the value at once on the first render and under reduced motion; after a change it passes through values between the old and the new one and ends on the new one at 400 ms, never starting from zero; see it fail, then add `components/use-tween.ts`; the tests pass
- [x] 2.2 Add `app/motion.css` (timings, `rise`, `uncover`, `sweep`, `pop`, `ring`, the stagger with its 200 ms cap, the day slide classes, the root's transition off, and the reduced-motion block), imported by `app/globals.css`; a test reads the stylesheet and pins the 450 ms and 400 ms timings, the 200 ms cap and that the reduced-motion block turns every motion class off

## 3. The top bar

- [x] 3.1 Test first (`components/top-bar.test.tsx`): each new live status mounts one ring on the dot and none appears without one; the charge's final value is in an `sr-only` span while the shown one is `aria-hidden`; then add the ring and `useTween` to `Status`; the tests pass

## 4. Solar

- [x] 4.1 Test first (`components/solar/range-chart.test.tsx`): each segment carries `rise` with its column's `--i` and a transform origin on the zero line; a re-render with the same items keeps the same elements (no remount); a new range (a new key in `SolarPage`) mounts new ones; then add the class, the origin, the key and `isAnimationActive` after the first paint; the tests pass
- [x] 4.2 Test first (`components/solar/day-view.test.tsx`): while the Solar view draws in, the expected line is clipped by a rect growing linearly over 600 ms and the flows by one growing over 600 ms from 300 ms; a day without expected hours draws its flows with no delay; after 900 ms a reload's re-render clips nothing, and another day draws in again; then add the two clip paths and key the chart by its day; the tests pass
- [x] 4.3 Test first: Total Generated rolls with `useTween` and keeps its final value in an `sr-only` span; then add it; the tests pass
- [x] 4.4 Test first (`components/solar/day-panel.test.tsx`): the stepper buttons and the arrow keys call the day change with `day-next` or `day-previous`, and the day's content sits in a `ViewTransition` whose update class is `slide-next` or `slide-previous` for those types and `none` otherwise; then pass the types through `SolarPage`'s `router.replace` and wrap `DayView`; the tests pass
- [x] 4.5 Test first (`components/solar/forecast.test.tsx`): the Today bar's track uncovers linearly over 450 ms and the made bar's clip starts at 225 ms, then follows its value by transition; Today by hour's expected columns rise linearly and each made column starts half the enter time later; then add them; the tests pass

## 5. The other pages

- [x] 5.1 Test first (`components/impact/*.test.tsx`): the ring's slices sweep from the top on first view and change by transition when the shares change; the middle and legend figures roll with final values for screen readers; the section bars, the car charging split (one piece) and the backup lengths uncover with `--i`; a new range redraws the bars while the ring stays; then add them; the tests pass
- [x] 5.2 Test first (`components/patterns/*.test.tsx`): Always on's rows and Powerwall use's bars uncover with `--i`; the house use grid gets no motion class; then add them; the tests pass
- [x] 5.3 Test first (`components/top-ten/timeline.test.tsx`): each dot carries `pop` with `--i` by rank; then add it; the test passes
- [x] 5.4 Test first (`components/true-up/*.test.tsx`): the cycle chart's columns rise about the zero line, its running line reveals on mount only, the savings card's bar uncovers as one piece, and the payback track has no motion class; then add them; the tests pass
- [x] 5.5 Every remaining `isAnimationActive={false}` is deliberate: those charts move by CSS while they enter and redraw in place on a reload; only the range chart turns recharts' animation on after entering, for today's column

## 6. Verify

- [x] 6.1 The whole suite passes, `tsc` is clean, `openspec validate subtle-motion --strict` passes
- [x] 6.2 A throwaway branch container on onyx reading production read-only, through an SSH tunnel in Chrome at 1280 and 375 pixels:
  - each page's first view draws in as on the prototype;
  - the Solar page's 5-minute reload moves only today's column;
  - a day step slides, rolls Total Generated and draws the estimate first;
  - the top bar's charge rolls and the dot rings;
  - with reduced motion emulated, nothing moves;
  - Lighthouse reports CLS 0 on `/` and `/impact`;
  - the console shows no CSP violation.
  Check one day step and one first view in Safari. Record in design.md under Results.
- [x] 6.3 `ponytail:ponytail-review` on the uncommitted diff before the first commit, with its findings reported for the owner to choose; the owner chose two: the range chart's reload tween ran under reduced motion (`isAnimationActive` now `"auto"`, tested with reduced motion mocked, shown failing mid-glide first), and nothing guarded a class name run into `${` (a test now scans the components, shown failing on the glued `fill-solar/25`)

## 7. Rollout

- [ ] 7.1 With the owner's go-ahead, release; the deploy's health check passes, and teslasolar.report's Solar page draws in on first view and holds still on its next reload; record in design.md under Rollout

## Workflow follow-up

- Commit the code, then archive the change with its specs synced as a second commit, `Archive subtle-motion`, before opening the PR, which also carries the true-up-kept-years rollout record (b846219).
