# Tasks

Code tasks are test-first: write the test, run it and see it fail for the right reason, then write the smallest code that passes and run the whole suite (`yarn vitest run`), plus `yarn tsc --noEmit` once a task touches types. Tasks marked **(owner)** are done by you; I check each where I can.

## 1. The mockup

- [x] 1.1 Add a phone artboard (390 px) to the original canvas (https://claude.ai/artifact/7crQGRyQS9J8wSdKYJjD6d) showing the top bar with the live status, in its live and stale states, and the desktop header with "LIVE 9:59 AM"; **(owner)** approve or change the phone placement, and the choice is recorded in the design

## 2. One stream per tab

- [x] 2.1 `useLiveStream` shares one stream test-first with `FakeStream`: two components using the hook open one stream; both receive each status and `totals` event; a reopen after a closed stream reaches both; unmounting one leaves the stream open for the other; unmounting both closes it; moving from one page's component to another's with the top bar mounted keeps one stream; the existing hook and page tests stay green

## 3. The top bar's status

- [x] 3.1 `lib/live-status.ts` test-first: from a status and now, the dot (live or not), the word (LIVE or LAST), the time ("9:59 AM", site time zone) and the pill ("PW 92% · CHARGING"); stale at two minutes by `staleWarning`'s rule; dashes with no status, or a status without a charge
- [x] 3.2 `TopBar` test-first: rendered with a status and `renderedAt`, it shows it with no stream message; a stream status updates it; a status turning two minutes old turns it to LAST with a gray dot; dashes with no status; placed as the approved mockup with the design system's tokens; the existing navigation tests stay green
- [x] 3.3 `app/layout.tsx` renders `TopBar` with `latest()` and `renderedAt`, test-first with a server render: a held status appears in the HTML before any script runs; `README.md`'s live status entry says the top bar shows it and the Impact note stays true

## 4. Checks

- [x] 4.1 Under `yarn build && yarn start` locally on the throwaway database, sending `NOTIFY live_status` statuses by hand: no CSP violation or console message on each page; the pill in the served HTML; a new status updates it within a second on Solar, Impact, True-Up, Top Ten and Distribution; one `/api/live` request per tab while moving between pages; LAST with a gray dot when statuses stop; at 375 px nothing scrolls sideways and the bar matches the approved phone mockup; record the results in the design

## 5. Release and checks (after merging)

- [ ] 5.1 **(owner)** Publish a release; I watch the Deploy run
- [ ] 5.2 On teslasolar.report: the top bar shows LIVE with the current charge and state on every page and updates without a reload, one `/api/live` stream per tab, no console message; record the results in the design, committed on the next change's branch

## Workflow follow-up

- Run `ponytail:ponytail-review` on the uncommitted diff and fix the findings you choose, test-first.
- On the branch `powerwall-what-if-rollout` (so "Record the powerwall-what-if rollout" rides along), renamed for this change if you like: commit the code, then archive this change with spec sync as a second commit, `Archive live-top-bar`, then open the pull request, mentioning the riding commit.
