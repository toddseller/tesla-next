# Proposal

## Why

anton-tesla-api-ws's web side is gone: its `retire-flask-web` change deployed on November 9, 2026, so `/api/v2` no longer answers and the `flask` container only runs the scheduler. Everything this repo kept to stay equal to Flask (the compare scripts, the "matches Flask's" requirements, the parity traps and comments, and the top ten route's Flask default) now checks against nothing. This is change 7b of the migration, the last of the cutover.

## What Changes

- The five compare scripts (`scripts/compare-*.mjs`) and their tests are deleted, with the README's compare instructions and CLAUDE.md's two "keep answering as Flask" traps.
- **BREAKING** `/api/top-ten` leaves VPP days out of the export rankings by default, as the page does; `?vpp=with` includes them. `?vpp=without` keeps working, since anything but `with` reads as without. The page asks for the plain route for its default.
- Each route's "answers as Flask's ... until cutover" comment goes. Comments that say where code was ported from stay. Those that describe anton's scheduler as Flask's web side ("Flask notifies", "the payload it broadcasts") are reworded.
- Behavior that was kept to match Flask but is simply how the app works (the range sums and their rounding, the periods, Python's rounding) stays as it is; only the reason given for it changes.
- The deploy's health check moves from https://next.teslasolar.report/ to https://teslasolar.report/.
- After the release, next.teslasolar.report becomes a Cloudflare redirect (you) to teslasolar.report that keeps the path and query.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `top-ten`: the API's default leaves VPP days out; the comparison with Flask is removed.
- `solar-range-chart`: the periods and bar values are stated as rules instead of "as Flask's"; the comparison is removed.
- `impact-report`: the meter correction is stated directly; the comparison is removed.
- `day-intervals`: the comparison with Flask is removed.
- `true-up-cycles`: the comparison is removed; the years and cycles routes are described as they answer.
- `true-up-cost`: the comparison is removed; the cost route is described as it answers.
- `live-status-stream`: the stream follows anton's notifications, not its socket events; the two requirements on what anton sends are removed (anton's `live-site-status` and `energy-intervals` specs own them).
- `deploy-on-tag`: the health check is on https://teslasolar.report/.
- `site-serving`: the site is reached at teslasolar.report, and next.teslasolar.report redirects to it.

## Impact

- **Code:** `app/api/top-ten/route.ts` and its test, `components/top-ten/top-ten-page.tsx`, comments in `app/api/*/route.ts`, `lib/` and `components/`, `bin/deploy` and its test, `scripts/` (deleted files), `README.md`, `CLAUDE.md`.
- **Systems:** the release's own deploy checks teslasolar.report. The redirect is set in Cloudflare after that, by you; the order matters, since a check against a redirect gets a 301, not a 200.
- **anton-tesla-api-ws:** nothing. The `tsr-tunnel` container and its tunnel are deleted there, by you, whenever you choose.
- The branch carries the two local rollout commits ("Record the live-top-bar rollout", "Record the cutover soak").
