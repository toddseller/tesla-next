# Tasks

Test-first throughout: each task's test is written and run red, for the right reason, before its code, and the whole suite runs after it. Database tests use the throwaway PostgreSQL, never production.

## 1. Mockups

- [x] 1.1 Mockups of the Payback card at 1280 and 375 pixels (solar's year, solar's year for the whole system and the Powerwalls' year side by side, no dollar amounts, the estimated years marked, the Powerwalls' outage record), and of the '23 - '24 savings card's estimate line; the owner picks one before section 4 starts

## 2. '23 - '24 priced

- [x] 2.1 With the owner's go-ahead, read PG&E's generation rates for the six revisions from 2023-09-01 to 2024-07-01 read-only on onyx; one more search for the 2022 joint rate comparison, recording the result in design.md
- [x] 2.2 Test-first, `lib/true-up/westlight.ts`: the five estimated revisions (PG&E's generation × each period's August 2024 ratio, rounded to 5 places, ECO100 and bonus at 1 cent, `estimated: true`) with a comment on how they were made; tests that a day in March 2024 prices at the estimated revision and one in August 2024 at the known one
- [x] 2.3 Test-first, `lib/true-up/savings.ts`: `FIRST_YEAR` to 2023-10-01 and `estimated_rates` in the savings; db tests that '23 - '24 has savings marked estimated, '24 - '25 none, and '22 - '23 no savings; the route test for '23 - '24

## 3. Payback (`lib/true-up/payback.ts`)

- [x] 3.1 Test-first, pure: each part's net cost from the price, tax share and credit rate (the spec's placeholder figures); the early-year estimate (solar kWh and cost index ratios, the 344 days from PTO); the payback date walking the years with an even rate through the crossing year, or a projection, for solar's net cost and for both net costs together; the Powerwalls' net, years to cover the rest and the won't-pay-back rule; unit tests for every spec scenario
- [x] 3.2 Test-first, reading the costs file named by `SYSTEM_COSTS_FILE`: null when unset, missing or malformed, logging that and never the contents; tests with a temporary file of placeholder figures
- [x] 3.3 Test-first, `payback()`: answers years and estimate markers only, never a cost; priced years from `trueUpSavings` for each true-up year from '23 - '24, solar kWh by year from `data`, VPP from `vppSeason`, the outage record from `backupHistory`; db test with seeded years; `GET /api/payback` with its route test, including that the answer has no dollar amount and is null without the file

## 4. The cards (`components/true-up/`)

- [x] 4.1 Test-first, the savings card's estimates line names WestLight's estimated generation rates when the savings say so; text tests
- [x] 4.2 Test-first, the Payback card as mocked, below the cycle list for every range and absent without payback data, rendered with the page and reloaded with the savings on `totals` and a reopened stream, keeping it when a reload fails; component tests, then the look checked in the browser at 1280 and 375 pixels

## 5. Docs and checks

- [x] 5.1 README: the true-up savings paragraph (priced from '23 - '24, estimated generation), the payback route, and `SYSTEM_COSTS_FILE` with the file's shape but no figures; `docker-compose.yml` mounts it read-only; CLAUDE.md's traps gain never committing or printing the costs
- [x] 5.2 Whole suite, `tsc` and `yarn build` pass; `yarn build && yarn start` on a throwaway database shows the True-Up page with both cards under the production CSP, no console errors, no sideways scrolling
- [x] 5.3 With the owner's go-ahead, create the costs file on onyx (outside the repository, mode 600) and add `SYSTEM_COSTS_FILE` to onyx's `.env`; a build of the branch on onyx in a throwaway container answers `/api/payback` and '23 - '24's savings; record the years and savings (never the costs) in design.md under Results
- [x] 5.4 `openspec validate system-payback --strict` passes, and `ponytail:ponytail-review` runs on the uncommitted diff before the first commit, with its findings reported for the owner to choose

## 6. Release and checks (ask before publishing)

- [x] 6.1 With the owner's go-ahead, release; the deploy's health check passes
- [x] 6.2 On teslasolar.report: the Payback card and '23 - '24's savings card match the onyx run, `/api/payback` holds no dollar amount, at 1280 and 375 pixels with no console errors; record in design.md under Rollout

## Workflow follow-up

- Commit the code, then archive (spec sync included) as `Archive system-payback`, on branch `system-payback`, which also carries the backup-insights rollout record (651dcc9); open one PR.
