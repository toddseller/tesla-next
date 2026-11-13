# Tasks

## 1. Before starting

- [x] 1.1 Branch `weather-vane` from `range-keeps-scroll-rollout`, so the two `Record ... range-keeps-scroll rollout` commits ride in this change's PR; `git log main..` shows them under the new branch's commits
- [x] 1.2 Mockups on an artifact, before any code:
  - the vane on the roof at 1440, 1024 and 390 px, by day and at night, beside the solar label and lines;
  - all eight compass points, showing that north (away) and south (toward) read differently;
  - a calm pose and a still frame of a strong, gusty shake;
  - the open readout ("18 mph, gusts 35 mph, from SW", "Calm", "No wind reading") at 1440 and 390 px.

  Settle the roof point, size, tilt and fill there, record them in design.md, and wait for an OK on the mockups before 2.1

## 2. Wind data

- [x] 2.1 Test first (`app/api/intervals/route.test.ts`): a reading with `wind_speed` 29, `wind_direction` 225 and `wind_gusts` 56 carries `windSpeed`, `windGusts` and `windDirection` as stored; one with null gusts carries `windGusts: null`. Add `wind_gusts smallint` to `test/schema.sql`; see the tests fail for the missing fields, then add them in `lib/intervals/intervals.ts`; the whole suite passes
- [x] 2.2 Test first (`components/scene/use-site-data.test.tsx`): the live status's `windSpeed`, `windGusts` and `windDirection` reach the site data, and a status without them gives nulls. See it fail, then add the fields to `Sky` in `lib/scene/weather.ts` and to `use-site-data.ts`; the whole suite passes

## 3. Vane text and turning

- [x] 3.1 Test first (`lib/scene/weather.test.ts`): `windText` gives "18 mph, gusts 35 mph, from SW" for 29, 56, 225; "18 mph from SW" without gusts; "Calm" below 2 mph; "No wind reading" without speed or direction; each of the eight compass points at its boundary. See them fail, then write it; the whole suite passes
- [x] 3.2 Test first (`lib/scene/weather.test.ts`): `turn(350, 10, 0.5)` is 0 and `turn(10, 350, 0.5)` is 0, both through north; `weatherAt` blends `windDirection` with it between replay readings at 340 and 20 degrees. See them fail, then add `turn` and use it in `weatherAt` for the direction only; the whole suite passes

## 4. The vane

- [x] 4.1 Test first (`components/scene/live-scene.test.tsx`): the shake amplitude is 0 below 5 km/h, about 4 degrees for 30 km/h with 32 km/h gusts, about 18 with 60, capped at 25, and uses gusts of 1.5 times the speed when there are none; the pose angle for 90 degrees is side-on to the right, 270 to the left, and 0 and 180 differ in tilt. See them fail, then add the constants and pure functions next to `driftVelocity`; the whole suite passes
- [x] 4.2 Test first (`components/scene/live-scene.test.tsx`): the scene renders the vane button on the roof with its `aria-label` from `windText`; under reduced motion its transform is the target pose (the vane shares the scene's existing frame loop, which leaves it alone then); below 2 mph the target keeps the last direction; it swings through north, overshoots once and settles within about 3 seconds; a gusty wind shakes it far more than a steady one. See them fail, then draw the vane (SVG posed along the art's ground axes, from the mockups, night dimming as the house) with its spring and shake in the frame loop writing the transform through a ref; the whole suite passes
- [x] 4.3 Test first (`components/scene/distribution.test.tsx`): tapping the vane opens the readout with the live text; Escape and a tap elsewhere close it; the vane is a native button that takes focus, so Enter opens it (jsdom doesn't turn Enter into a click; checked in the browser in 5.2); in replay it shows the replayed reading's text, and "No wind reading" for a time with no readings. Live, `useWalkedWeather` passes `windDirection` through without walking it. See them fail, then wire the readout with `components/ui/popover.tsx`; the whole suite passes

## 5. Verify

- [x] 5.1 The whole suite passes, `tsc` is clean, `openspec validate weather-vane --strict` passes, and `yarn build && yarn start` serves `/distribution` with no CSP violation in the console (the page can't reach the database locally; if it can't render, check the CSP on 5.2's container)
- [x] 5.2 A throwaway branch container on onyx reading production read-only, through an SSH tunnel, at 1440 x 900 and 390 px wide:
  - live, the vane stands on the roof and reads "No wind reading" if anton's change isn't released yet, or the current wind if it is;
  - with the development weather overrides, a west, a north and a south wind each read correctly, and a gusty wind shakes visibly more than a steady one;
  - a replay of a February 2024 storm day turns and shakes the vane through the storm, its readout following;
  - reduced motion turns it without swinging; night dims it; no CSP violation.

  Take zoomed screenshots and record the results in design.md under Results
- [x] 5.3 Show the screenshots and the branch container, and wait for an OK before pushing. OK given 2026-11-13, with the iron letters
- [x] 5.4 `ponytail:ponytail-review` on the uncommitted diff in a fresh subagent before the first commit, with its findings reported to choose from; chosen fixes go test first. Three findings, all fixed test first: a missing gust blended to "gusts 0 mph" (now kept missing); reduced motion turned on mid-shake could leave the arrow off its direction (the frame loop now always owns the transform); the live readout showed figures partway between readings (the vane's wind is no longer walked; its shake eases in the frame loop instead). After the branch check, the compass arms gained a rim and the iron letters a light outline, so they read at night and against a rainy overcast sky

## 6. Rollout

- [x] 6.1 Release (ask first); the deploy's health check passes, and on teslasolar.report the vane shows on the roof and its readout matches the latest `weather_sample` row (or "No wind reading" before anton's release); record in design.md under Rollout. Released as v2026.11.13

## Workflow follow-up

- The anton-tesla-api-ws change (live wind fields, `wind_gusts` column, gust backfill) is proposed and released in that repo; this change works before or after it.
- Commit the code, then archive the change with its specs synced as a second commit, `Archive weather-vane`. Push and open the PR, which also carries the range-keeps-scroll rollout records, only after 5.3's OK.
