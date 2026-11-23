## 1. The ramp

- [x] 1.1 `app/globals.test.ts`: the seven use steps get lighter from `use-1` to `use-7`, keeping their seven blues. Verify it fails, reverse the values in `app/globals.css` (and its comment), verify it passes
- [x] 1.2 `components/patterns/house-use.test.tsx`: rename "the key shows the seven steps, palest to deepest" to say dark to light (the classes are unchanged)
- [x] 1.3 DESIGN.md: the Home flow color's heat scale note runs from #213C86 to #D4E1FA, Home as the third step, heavier use lighter as on Home's year chart

## 2. Verify

- [x] 2.1 Full suite and `yarn build`; on an onyx branch container, zoomed screenshots of the When the house uses power section at 1440 and 390; verify by your OK on the screenshots before pushing
- [x] 2.2 Run `ponytail:ponytail-review` on the uncommitted diff in a fresh subagent, report the findings and wait for the pick before committing

## Workflow follow-up

- Commit the code, then `/opsx:archive` with the specs synced and commit "Archive heatmap-ramp"; push over SSH and open the PR.
