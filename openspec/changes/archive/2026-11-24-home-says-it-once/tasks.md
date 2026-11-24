# Tasks

Each task goes test-first: write the test, see it fail for the right reason, make it pass, then run the whole suite (`yarn test`).

## 1. The explanation's net in tenths

- [x] 1.1 In `lib/true-up/text.test.ts`, change the `rangeExplained` expectations to tenths (671.3 kWh, 231.3 kWh, 412.3 kWh, 120.4 kWh; MWh cases unchanged) and keep the "as much sent as drew" case for a net under 0.05 kWh; make it pass in `lib/true-up/text.ts` (energy to a tenth, the zero check on "0.0")
- [x] 1.2 Update any True-Up page or Home test that quotes the sentence with a whole-kWh figure

## 2. Since 2021 says solar's payback once

- [x] 2.1 In `components/home/since.test.tsx`, test that with solar paid back in March 2025 the key reads "dotted line: solar paid back, March 2025" and no "Solar paid for itself" sentence shows, while the Powerwalls' sentence still does; and that a projected solar payback is still said in words; make it pass in `components/home/since.tsx`

## 3. Habits without the Powerwall figure

- [x] 3.1 In `components/home/habits.test.tsx`, replace the Powerwall figure's expectation with one that Habits gives no Powerwall figure; make it pass by removing the figure and its `powerwallOut` prop from `components/home/habits.tsx`, and the `powerwallOut` query wiring from `app/page.tsx`

## 4. Checks

- [x] 4.1 Run `yarn test`, `npx tsc --noEmit` and the production build (branch container on onyx), and check Home's Habits and Since 2021 and True-Up's sentence at 375px and 1440px; looked over and approved before pushing

## Workflow follow-up

- Run the ponytail review on the uncommitted diff in a fresh subagent and wait for the pick of fixes.
- Commit the code, then archive the change with spec sync as `Archive home-says-it-once`, then open the PR.
