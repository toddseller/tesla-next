## 1. The grid's direction

- [x] 1.1 `lib/scene/live-scene.test.ts` and `components/scene/live-scene.test.tsx`: the GRID label gives "to PG&E" exporting and "from PG&E" importing as its note line, nothing at "0 kW"; the phone-fit test checks the three-line label. Verify it fails, change `lib/scene/live-scene.ts` and `live-scene.tsx`, verify it passes
- [x] 1.2 `lib/home/now-sentence.test.ts`: exporting adds "and sends 1.2 kW to PG&E" to the first clause; importing and idle unchanged. Verify it fails, change `lib/home/now-sentence.ts`, verify it passes

## 2. Today's difference

- [x] 2.1 `components/home/today.test.tsx`: the middle figure reads the difference ("5.0 kWh behind the forecast", "3.9 kWh ahead of the forecast", "0.0 kWh on the forecast") instead of "expected by". Verify it fails, change `components/home/today.tsx`, verify it passes

## 3. The savings key

- [x] 3.1 `lib/true-up/text.test.ts` and `components/true-up/savings-card.test.tsx`: when the Powerwalls cost money the key reads "Saved $5,576" with "Solar $5,727 against buying it all from the grid, less the Powerwalls' $151"; a year they saved money keeps "Solar saved". Verify they fail, change `lib/true-up/text.ts` and `savings-card.tsx`, verify they pass

## 4. Verify

- [x] 4.1 Full suite and `yarn build`; on an onyx branch container, zoomed screenshots at 1440 and 390 of Now's scene and sentence, Distribution's scene (live and in replay, the GRID label fitting at 375 and at least 11px), Today's figures, and True-Up's savings card for '25 - '26; verify by your OK on the screenshots before pushing
- [x] 4.2 Run `ponytail:ponytail-review` on the uncommitted diff in a fresh subagent, report the findings and wait for the pick before committing
