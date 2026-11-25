# Tasks

## 1. The readout above the chart on a phone

- [x] 1.1 In `components/home/year.test.tsx`, add a test that below `md` the explanation and the day card come before the chart: the side column carries `max-md:contents`, and the explanation paragraph and the day card each carry `max-md:-order-1`, while the shares block does not. Keep the existing sticky test passing as is. See the new test fail for the missing classes.
- [x] 1.2 Add those classes in `components/home/year.tsx`; 1.1 passes, and `yarn test` passes.

- [x] 1.3 Review fix: in `components/home/year.test.tsx`, expect the canvas's half-height cap as `max-md:max-h-[50svh]`; see it fail; change `max-sm:` to `max-md:` in `components/home/year.tsx`; `yarn test` passes.

## 2. Verify

- [x] 2.1 `yarn build` (its type check) passes.
- [x] 2.2 Under the production CSP (`yarn build && yarn start`, or an onyx branch container for real data): at 390 by 844 Home's year chapter reads heading, explanation, day card, chart, shares; with the whole chart on screen, tapping a November row shows that day in the readout and "Open the day" without scrolling; at 744 by 1133 the chart is at most half the screen and a tapped November row shows in the readout above it; at 1440 by 900 and 1280 by 800 the chapter looks as it does today and the readout stays in view over November. Then give the server's address for the OK before pushing.

## Workflow follow-up

- Fresh ponytail review of the diff, then the code commit, then `Archive phone-readout-above-chart` with specs synced, then the PR.
- Update the `critique-round-7` memory with the PR number.
