# Proposal

## Why

The approved "Instrument" mockup (https://claude.ai/artifact/7crQGRyQS9J8wSdKYJjD6d) put the Powerwalls' live state at the right end of the top bar: a green dot, "LIVE" with the time of the latest status, and a pill reading "PW 92% · CHARGING". dashboard-foundation deferred it to live-distribution, which brought the stream it needed; live-distribution then wired the stream into the Distribution scene only, and the top bar never got it. impact-page went on to leave the battery fields out of `/api/impact` on the grounds that the top bar shows them, and the README says so, so today no page but Distribution shows the batteries' state at all. The data already reaches every page: each live status arrives about every 10 seconds on the `/api/live` stream the pages open for their `totals` events.

## What Changes

- **The top bar shows the live status on every page,** as mocked: a dot, "LIVE" and the time of the latest status, and a pill with the Powerwalls' charge and state (Charging, Discharging or Standby, as anton reports them).
- **It is right from the first paint:** the bar is rendered with the latest status the server already holds, as the Distribution page is, and updates from the stream after that.
- **It says when it is stale:** a status two minutes old or more, the Distribution page's rule, turns the dot gray and reads "LAST" with its time, rather than showing an old charge as live; no status yet shows dashes.
- **One stream per tab:** the top bar and the page share a single `/api/live` connection, instead of the bar opening a second one.
- **On a phone** the dot, time and pill fit the wrapped top bar without sideways scrolling; their place there comes from a phone artboard added to the original mockup canvas.
- **`README.md`'s note that the top bar shows the battery fields** becomes true.

## Capabilities

### New Capabilities

None.

### Modified Capabilities
- `dashboard-shell`: the top bar gains the live status: dot, time and the Powerwalls' charge and state, with stale and not-yet-received states, fitting a phone.
- `live-status-stream`: every page, not only Distribution, is rendered with the latest live status, and a tab shares one stream between its top bar and its page.

## Impact

- **Code:** `components/top-bar.tsx` (the status), `components/use-live-stream.ts` (one shared stream per tab), `app/layout.tsx` (the latest status for the first paint), and their tests.
- **Database and anton-tesla-api-ws:** unchanged; the status is anton's existing `live_status` notification.
- **Docs:** `README.md`'s live status entry.
- **Unchanged:** the pages' `totals` reloads, the Distribution scene, `/api/live`'s answers.
