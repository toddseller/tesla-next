## 1. Backup

- [x] 1.1 `components/impact/backup-section.test.tsx`: a year without outages names what its list holds ("No outages, only a Go Off-Grid test.", "No outages, only 3 blips and a Go Off-Grid test.") and an empty year reads "No outages.". Verify it fails, change the section, verify it passes
- [x] 1.2 Same test file: an event's duration has its figures in mono and its units in sans (through `Measured`). Verify it fails, change the row, verify it passes

## 2. Payback

- [x] 2.1 `components/true-up/payback-card.test.tsx`: the story's pace is 3 s across and 600 ms a stop. Verify it fails, change `PACE_MS` and `STOP_MS` (and their comment), verify it passes

## 3. The start date

- [x] 3.1 Tests for Top Ten's note ("after October 22, 2021, the day the system was approved to run", no "October 23"), the Records tab without outages, Since's spoken label and Payback's spoken timeline ("October 22, 2021"). Verify they fail, change the wording, verify they pass

## 4. Typography

- [x] 4.1 `components/home/today.test.tsx`: a figure's unit is never under 11px (`max(11px, 0.6em)`). Verify it fails, change `Unit`, verify it passes
- [x] 4.2 `components/top-ten/top-ten-page.test.tsx`: the note is capped at 75ch. Verify it fails, add the cap, verify it passes

## 5. Verify

- [x] 5.1 Full suite and `yarn build`; on an onyx branch container, zoomed screenshots at 1440 and 390 of Impact's Backup section (a quiet year and All time), Home's Today, Top Ten's note and the Payback card's story; verify by your OK on the screenshots before pushing
- [x] 5.2 Run `ponytail:ponytail-review` on the uncommitted diff in a fresh subagent, report the findings and wait for the pick before committing

## Workflow follow-up

- Commit the code, then `/opsx:archive` with the specs synced and commit "Archive leftovers"; push over SSH and open the PR.
