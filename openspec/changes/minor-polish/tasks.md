## 1. Home

- [x] 1.1 `components/home/pick-a-day.test.tsx`: Go is filled and Random day outlined; the refusal message sits under the field on wide screens (`sm:` placement that leaves the buttons' row). Verify it fails, change `pick-a-day.tsx`, verify it passes
- [x] 1.2 `components/home/year.test.tsx`: choosing 2024 from November 22, 2026 opens November 22, 2024; choosing 2021 from June 13 opens October 22, 2021; the address keeps `record`. Verify it fails, change `year.tsx`, verify it passes
- [x] 1.3 `components/home/now.test.tsx`: no status line (`data-part="status-line"`). Verify it fails, remove it from `now.tsx` (and any test that expects it), verify it passes
- [x] 1.4 `components/home/records.test.tsx` and `app/page` test: choosing a tab sets `record` keeping `year`; a served `record` opens its tab. Verify it fails, change `records.tsx` and `app/page.tsx`, verify it passes

## 2. Figures

- [x] 2.1 `components/measured.test.tsx`: figures in mono, words in sans ("$30 cost on the bill", "About $9 less", "369.8 imported", "$80.23 est."). Verify it fails, add `components/measured.tsx`, verify it passes
- [x] 2.2 `components/true-up/savings-card.test.tsx` and `cycle-list.test.tsx`: the words beside figures aren't mono. Verify they fail, render CountUp and the cycle list's net and charges through `Measured`, drop the wrapping `font-mono`, verify they pass
- [x] 2.3 `components/impact/backup-section.test.tsx`: duration tiles set their units small, as Top Ten does. Verify it fails, move `Length` to a shared component with em margins, use it in Impact's tiles, verify Top Ten's tests still pass

## 3. Shell

- [x] 3.1 `components/footer.test.tsx`: the footer links the seven pages. Verify it fails, change `footer.tsx`, verify it passes
- [x] 3.2 `app/layout` test: a "Skip to content" link first, pointing at `main#content`. Verify it fails, add it to `app/layout.tsx`, verify it passes
- [x] 3.3 Focus ring: `outline-ring` at full strength with a 2px solid `:focus-visible` outline in `app/globals.css`; the six `ring-ring/50` uses become `ring-ring` (checked in the browser)
- [x] 3.4 `components/top-bar.test.tsx`: the nav doesn't wrap internally. Verify it fails, change `top-bar.tsx`, verify it passes

## 4. Verify

- [x] 4.1 Full suite and `yarn build`; on an onyx branch container, zoomed screenshots at 1440, 1024 and 390 of the top bar, footer, a keyboard focus and the skip link, Pick a day with a refused date, the year switch, Records with `record` in the address, Now without its status line, True-Up's savings card and cycle list, and Impact's duration tiles; verify by your OK on the screenshots before pushing
- [x] 4.2 Run `ponytail:ponytail-review` on the uncommitted diff in a fresh subagent, report the findings and wait for the pick before committing
