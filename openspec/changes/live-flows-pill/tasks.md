# Tasks

## 1. Before starting

- [x] 1.1 Branch `live-flows-pill` from `mobile-menus-rollout`, so the `Record the mobile-menus rollout` commit rides in this change's PR; `git log` shows it under the new branch's first commit

## 2. The flows' reading

- [x] 2.1 Test first (`lib/scene/live-scene.test.ts`): the exported kW format gives "6.2 kW" for 6.24, "12.3 kW" for 12.34, "0 kW" for 0.04 and "1.5 kW" for -1.5. See it fail on the missing export, then export the scene's `kw`; the test and the scene's existing tests pass
- [x] 2.2 Test first (`lib/live-status.test.ts`), with a status at 2026-11-08 midday carrying `solar_power` 6.2 and `home_power` 1.4:
  - a fresh status gives `solar` 6.2 and `home` 1.4, and string values ("6.2") parse the same;
  - `home` falls back to `load_power`, and is null when neither is reported;
  - after sunset at the site (2026-11-08 17:30 PST) `solar` is null and `home` stays, and a minute after sunrise `solar` is there even at 0.02;
  - a stale status (two minutes old) gives null for both, keeping the Powerwall pill;
  - no status gives null for both.

  Update the existing `toEqual` tests for the two new fields. See the new tests fail, then add `solar` and `home` to `liveStatus`, using `skyAt`, and the three power fields to `LiveStatus`; the whole file passes

## 3. The live pill

- [x] 3.1 Test first (`components/top-bar.test.tsx`):
  - a first-paint status with solar and home gives a pill reading SOLAR 6.2 kW · HOME 1.4 kW · PW 92% · CHARGING, each flow after an `aria-hidden` square with `bg-solar` or `bg-home`;
  - each flow's segment carries `max-[1360px]:hidden` (first built as `max-sm:hidden`; widened after 4.2, see design.md);
  - a stream status updates both figures, rolling: the shown figure is `aria-hidden` mid-tween while the screen-reader figure is already the new one, as the charge test checks;
  - a stale status shows LAST with the pill reading PW 92% · CHARGING alone;
  - after sunset the pill reads HOME and PW with no SOLAR;
  - the OFF GRID pill still comes before the live pill.

  See them fail, then render the segments in `Status` (`components/top-bar.tsx`); the whole suite passes

## 4. Verify

- [x] 4.1 The whole suite passes, `tsc` is clean, `openspec validate live-flows-pill --strict` passes, and `yarn build && yarn start` serves `/` and `/distribution` with no CSP violation in the console
- [x] 4.2 A throwaway branch container on onyx reading production read-only, through an SSH tunnel in Chrome:
  - at 1280 px the bar matches mockup C: SOLAR and HOME with their squares before PW, the figures rolling with each status;
  - the Distribution page's bar shows the same pill, and its figures agree with the scene's;
  - at 390 and 1280 px the pill reads PW alone, the links keep their rows as on teslasolar.report, and nothing scrolls sideways;
  - at 1366 px the flows show, with the name, the six links and the status on one line;
  - the console shows no CSP violation.

  Note whether the check ran before or after sunset, and check the other case with the clock overridden in the browser if needed. Record in design.md under Results
- [x] 4.3 `ponytail:ponytail-review` on the uncommitted diff before the first commit, with its findings reported to choose from; it found nothing to fix

## 5. Rollout

- [ ] 5.1 Release (ask first); the deploy's health check passes, and teslasolar.report shows the live pill on a wide screen and today's pill on a phone, as in 4.2; record in design.md under Rollout

## Workflow follow-up

- Commit the code, then archive the change with its specs synced as a second commit, `Archive live-flows-pill`, before opening the PR, which also carries the mobile-menus rollout record.
