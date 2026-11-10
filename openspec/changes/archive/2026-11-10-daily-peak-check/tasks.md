# Tasks

## 1. The check

- [x] 1.1 Test first (`lib/checks.db.test.ts`, own database, seeding `solar_forecast` and `energy_interval`): the solar peak check fails the spec's April 13 (4,416 W against a middle of 8,448 W, 52%) and passes the foggy summer day (10,440 against 10,080 W); see it fail for the missing function, then write `peakCheck` in `lib/checks.ts`; the tests pass
- [x] 1.2 Test first: a dull day (10.3 MJ/m²), a day with no forecast, and fewer than 5 bright days in the window pass unjudged, each saying why; no interval stored for yesterday fails; an even number of bright days takes the lower middle peak; then cover them in `peakCheck`; the tests pass
- [x] 1.3 Test first: bright is 60% of the date's clear-day forecast, the 90th percentile of every year's forecasts within 15 days of the date: the spec's December 15 (9.8 against 10.6 MJ/m², peak 3,000 against 6,000 W) fails at 50%, the dull day (10.3 against 25.0) passes at 41% of a clear day, and a December 28 clear-day forecast counts January 1 to 12; the earlier tests seed a past year's clear days; see them fail against the 15 MJ/m² rule, then change `peakCheck`'s query and README.md's description; the tests pass

## 2. Route and daily run

- [x] 2.1 Test first: `GET /api/checks/daily` answers 200 plain text with the solar peak line; then write `app/api/checks/daily/route.ts`; the test passes
- [x] 2.2 Test first (`test/weekly-audit.test.ts` style, fake `docker` and `deploy/pushover` on PATH): `deploy/checks /api/checks/daily Daily` sends the failing line titled "Daily checks failed: tesla-next", an alert titled "Daily checks couldn't run: tesla-next" when the site can't be reached, and nothing when the check passes; the weekly run's existing tests still pass after its checks step moves into `deploy/checks`
- [x] 2.3 Add `deploy/tesla-next-daily-check.service` and `.timer` (07:00 America/Los_Angeles daily, `Persistent=true`), and the daily run and its install commands to README.md's Weekly audit section; `systemd-analyze calendar "*-*-* 07:00:00 America/Los_Angeles"` accepts the timer's time

## 3. Verify

- [x] 3.1 The whole suite passes, `tsc` is clean, `openspec validate daily-peak-check --strict` passes
- [x] 3.2 A throwaway branch container on onyx reading production read-only: `peakCheck` fails for 2026-04-14 (judging April 13) and 2025-08-29 (judging August 28), and passes for 2026-04-11 (judging April 10); run over every day from 2021-10-11 to today, it fails only on the replay's days plus any day without intervals, which are listed, and the count of days too dull to judge falls from the 15 MJ/m² run's 1,176 to about the replay's share; `/api/checks/daily` answers for yesterday; record in design.md under Results
- [x] 3.3 `ponytail:ponytail-review` on the uncommitted diff before the first commit, with its findings reported for the owner to choose; the owner chose its one finding: a window whose bright days all peaked at 0 W read "NaN%" and passed, and now fails (test first)

## 4. Rollout

- [x] 4.1 With the owner's go-ahead, release; the deploy's health check passes
- [x] 4.2 On onyx: copy the daily units to `~/.config/systemd/user/`, `daemon-reload`, `enable --now tesla-next-daily-check.timer`; `list-timers` shows it due at 07:00; `systemctl --user start tesla-next-daily-check` prints an `ok solar peak` line and sends nothing; `start tesla-next-weekly-audit`'s checks still run through `deploy/checks`; record in design.md under Rollout

## Workflow follow-up

- Commit the code, then archive the change with its specs synced as a second commit, `Archive daily-peak-check`, before opening the PR, which also carries the day-span-totals rollout record (286114c).
