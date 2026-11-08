# Proposal

## Why

Every page now runs on tesla-next at next.teslasolar.report, matched against Flask's answers, so teslasolar.report can move to it. This is change 7a of the migration, the part that must ship before the switch: the one address anton serves that tesla-next doesn't, and the docs that still describe a migration in progress. It also writes down the whole cutover (the switch, a week of soak, anton's retirement and the cleanup after it), so the order and each step's rollback are settled before anything moves.

## What Changes

- **`/numbers` redirects to `/true-up`,** as it does on anton, where it was the True-Up Tracker's address before its rename. Old bookmarks keep working from the first minute after the switch.
- **The README says this app is teslasolar.report,** served from onyx, with anton-tesla-api-ws as the writer of the database, instead of describing pages moving one at a time.
- **The cutover plan is recorded in the design:** the switch (you, in Cloudflare: teslasolar.report's route moves from anton's tunnel to tesla-next's), a week of soak with anton untouched so rollback is moving the route back, then anton's companion change retiring Flask's HTTP API, Socket.IO, nginx, the React app and anton's tunnel, and then change 7b here.
- **Not in this change (7b, after anton retires):** deleting the compare scripts, the parity comments and the CLAUDE.md traps about Flask equality; the deploy's health check moving to https://teslasolar.report/; and next.teslasolar.report becoming a Cloudflare redirect to teslasolar.report that keeps the path and query.

## Capabilities

### New Capabilities

None.

### Modified Capabilities
- `dashboard-shell`: gains the old `/numbers` address redirecting to the True-Up Tracker.

## Impact

- **Code:** `next.config.ts` gains one permanent redirect, with a test.
- **Docs:** `README.md`'s introduction and its notes that assume next.teslasolar.report is a preview. The compare instructions stay until 7b, since the scripts still run during the soak.
- **Unchanged:** every page and route, the deploy (its health check stays on next.teslasolar.report, which keeps reaching this app through the soak), the database, and anton-tesla-api-ws.
- **Outside the repos:** the Cloudflare route change is yours, after this change is released.
