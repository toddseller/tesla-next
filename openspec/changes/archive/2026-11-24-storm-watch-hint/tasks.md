# Tasks

## 1. The STORM WATCH pill hints its term

- [x] 1.1 In `components/top-bar.test.tsx`, extend "a test, storm watch and going back on the grid": while storm watch is active the grid pill holds a button named "STORM WATCH", and activating it opens a dialog labeled "Storm watch" with the storm watch definition from `lib/terms.ts`, the pill keeping `text-solar`; while OFF GRID TEST and OFF GRID show, the grid pill holds no button. See it fail for the missing button.
- [x] 1.2 In `components/top-bar.tsx`, wrap the grid pill's text in `<Term name="storm-watch">` when its kind is `storm`; 1.1 and the rest of the top bar tests pass.

## 2. Verify

- [x] 2.1 `yarn test` and `yarn build` (its type check) pass.
- [x] 2.2 Storm watch can't be called up live, and a local server has no live status, so for this check only, a throwaway uncommitted edit makes `gridPill` return the storm pill; `git diff` shows it gone before the commit. Under `yarn build && yarn start` (production CSP) the pill opens the definition by tap, click and keyboard (Enter opens, Escape closes and returns focus) at 1440 and 390 pixels; at 390 the underlined text taps reliably and the definition wraps inside the viewport. If the tap target fails, take design.md's whole-pill alternative before continuing. Then the server's address for the OK before pushing.

## Workflow follow-up

- Fresh ponytail review of the diff, then the code commit, then `Archive storm-watch-hint` with specs synced, then the PR.
- Update the `critique-round-6` memory with the PR number.
