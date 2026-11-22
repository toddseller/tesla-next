## 1. The term and the glossary

- [x] 1.1 `lib/terms.test.ts`: each term in the glossary has its words and a definition, the eight named in the spec. Verify it fails, write `lib/terms.ts` with the definitions as reviewed in design.md, verify it passes
- [x] 1.2 `components/term.test.tsx`: `<Term name="vpp">VPP</Term>` is a button named "VPP" that opens a popover with VPP's definition on click and on Enter, closes on Escape returning focus, and never navigates; `<WithTerm text terms>` hints each named term's first match in a string and renders a string without it unchanged. Verify it fails, write `components/term.tsx` on `components/ui/popover.tsx`, verify it passes

## 2. The hints in place

- [x] 2.1 True-Up tests: "True-Up" in the title, "Peak (4 to 9 p.m.)", "NEM", "VPP" and "WestLight" are each one hint button, "Net Surplus Compensation" only when a past year's true-up tile mentions it, "NEM2" and "Storm watch" in the savings card only when they appear; every figure and line reads as before. Verify they fail, wrap the terms in `true-up-page.tsx`, `tiles.tsx` and `savings-card.tsx`, verify they pass
- [x] 2.2 `components/solar/day-view.test.tsx`: a storm watch span's "Storm watch" is a hint. Verify it fails, wrap it in `day-view.tsx`, verify it passes
- [x] 2.3 DESIGN.md: record the tappable term (dotted underline in the muted foreground, popover on the card surface) beside the doorway links

## 3. Verify

- [x] 3.1 Full suite and `yarn build`; on an onyx branch container, zoomed screenshots at 390 and 1440 of the True-Up page's hinted terms and an open popover, by touch and by keyboard, and of a day view with a storm watch span; verify by your OK on the screenshots before pushing
- [x] 3.2 Run `ponytail:ponytail-review` on the uncommitted diff in a fresh subagent, report the findings and wait for the pick before committing
