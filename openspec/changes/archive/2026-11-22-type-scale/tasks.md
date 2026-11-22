## 1. One-offs onto the scale

- [x] 1.1 `components/home/pick-a-day.test.tsx`: the heading is 28px at every width (no `md:text-[32px]`). Verify it fails, change `components/home/pick-a-day.tsx`, verify it passes
- [x] 1.2 `components/home/year.test.tsx`: the day readout is the 15px Lede. Verify it fails, change `components/home/year.tsx`, verify it passes
- [x] 1.3 `components/patterns/house-use.test.tsx`: the hour labels are 11px on phones. Verify it fails, change `components/patterns/house-use.tsx`, verify it passes

## 2. Record the scale

- [x] 2.1 `DESIGN.md`: add the Lede tier (frontmatter token and Hierarchy line), widen the lead figure range to 34 to 56px with where each lands, and add the chapter word's 64px phone size to its token

## 3. Verify

- [x] 3.1 Full suite and `yarn build`; on an onyx branch container, zoomed screenshots at 1440 and 390 of Pick a day, the year chapter's readout and Patterns' hour table; verify by your OK on the screenshots before pushing
- [x] 3.2 Run `ponytail:ponytail-review` on the uncommitted diff in a fresh subagent, report the findings and wait for the pick before committing
