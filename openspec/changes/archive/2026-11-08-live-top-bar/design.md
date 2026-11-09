# Design

## Context

See proposal.md for why. `lib/live.ts` keeps one `LISTEN` connection per server, the latest status as Flask's JSON text (`latest()`), and forwards every status and `totals` event to each open `/api/live` stream. In the browser, `useLiveStream` (`components/use-live-stream.ts`) opens a stream per call, reopening it 5 seconds after an answer other than 200 and calling `onReopen` when it comes back; the Solar, Impact, True-Up and Top Ten pages use it for `totals`, and the Distribution scene (`useSiteData`) for statuses too. `TopBar` (`components/top-bar.tsx`) is a client component rendered by `app/layout.tsx`, which is rendered per request (`dynamic = "force-dynamic"`), so the layout can read `latest()` as `app/distribution/page.tsx` does. The Distribution page counts a status stale from its own `modified` time, two minutes or more (`staleWarning` and `UPDATE_STALE_SECONDS` in `lib/scene/live-scene.ts`), on a clock that starts at the server's `renderedAt` so hydration matches. Tests drive streams with `test/fake-event-source.ts`.

The status's `battery_status` is anton's: "Charging", "Discharging" or "Standby" (`build_battery_status`).

## Goals / Non-Goals

**Goals:**
- The approved mockup's live status in the top bar, true from the first paint and honest when stale.
- One stream per tab, whatever listens to it.

**Non-Goals:**
- More in the header than the mockup had (the batteries' power, the grid, outages). Outage history is anton's follow-up; it can join later.
- A screen-reader announcement of each update: a status every 10 seconds would talk over the page. The status is plain text a reader finds when it reads the bar.

## Decisions

**`useLiveStream` shares one stream per tab.** A module-level `EventSource` with a set of listeners: the first listener opens it, the last one leaving closes it, and every status, `totals` event and reopen goes to every listener. The hook's signature doesn't change, so the five pages and the Distribution scene keep calling it as they do. The top bar lives in the layout, which Next.js keeps mounted across pages, so moving between pages never closes the stream. The alternative, the top bar opening its own stream, doubles every tab's connections through Cloudflare and the server's fan-out for no gain.

**The layout renders the bar with `latest()` and `renderedAt`,** as the Distribution page renders its labels: the pill is right in the first response, and the bar's clock starts at the server's time so the first render in the browser matches it. `latest()` is Flask's JSON text; the layout passes it as is, and the bar parses it.

**Stale uses the Distribution page's rule,** `staleWarning`'s threshold from the status's own `modified` time, checked on a timer, so the bar and the scene never disagree about whether data is live. Stale turns the dot gray and "LIVE" into "LAST", keeping the last status's time and pill, so a viewer still sees what the batteries last reported.

**The text is a pure function** in `lib/live-status.ts` (status, now → dot, word, time, pill), tested without rendering, as the true-up texts are. Times use the site's `Intl` clock ("9:59 AM", site time zone), like "Last updated at" on the Solar page; the mockup's "09:59" was a placeholder in a mono face, and the bar keeps the mono face. The state is anton's word upper-cased, as mocked; dashes come from `DASH` in `lib/scene/live-scene.ts`, as the Distribution labels show them.

**The dot takes the Powerwall color when live** (`bg-powerwall`), the mockup's green, and the muted gray when stale or unknown.

**On a phone the status sits on its own line under the name, above the links** (placement B of the mockup, https://claude.ai/artifact/7crQGRyQS9J8wSdKYJjD6d, chosen November 8, 2026 with the desktop boards; A let it wrap to the last line, after the links). From the `sm` breakpoint up it follows the links, at the bar's right end as mocked, wrapping after them when the window is too narrow for one line. The order is set with flex `order`, so the markup stays one bar.

## Risks / Trade-offs

- [A shared stream must not let one page's leaving close it for the next] → The stream closes only when the last listener leaves; the top bar is always a listener, so in practice it stays open for the tab's life. A test moves between pages and counts streams.
- [The server's clock and the browser's differ] → Staleness compares the status's time with the browser's clock, as the Distribution page already does; two minutes is far wider than ordinary skew.
- [The layout reading `latest()` on every page] → It is an in-memory read of the last notification; no database query.

## Migration Plan

Release as usual. Nothing changes in anton or the database. Rolling back is the previous release.

## Results

- **Under the production build (task 4.1, November 8, 2026):** `yarn build && yarn start` locally on the throwaway database, statuses sent by hand with `NOTIFY live_status`. Freshly started, the server held no status and served the bar with dashes (`PW — · —`). In headless Chromium: a status reached the bar within a second ("LIVE 7:29 PM", "PW 92% · CHARGING"); moving by the top bar through Top Ten, Solar, Impact and Distribution, each page's bar showed the next status within a second, and the whole visit opened one `/api/live` request; a status three minutes old turned it to "LAST 7:26 PM" with the gray dot; `/impact` was then served with "PW 93% · DISCHARGING" in its HTML; at 375 px the status sat on its own line under the name, above the links, as mockup B, and the page was 375 wide. The only console messages were headless Chromium's GPU notices from the Distribution scene's canvas, none from the app or the CSP.
- **Rollout (November 8, 2026, Pacific):** PR #17 merged and released as `v2026.11.08.10`; the Deploy run succeeded at 03:35:39 UTC on November 9. On teslasolar.report, in headless Chromium: `/impact` was served with "PW 100% · STANDBY" in its HTML (the winter reserve); `/true-up` showed "LIVE 7:35 PM" with the green dot and, 25 seconds later, "LIVE 7:36 PM" with no reload; moving by the top bar through Top Ten, Solar, Impact and Distribution kept the status and opened one `/api/live` request in all; at 375 px the status sat under the name, above the links, with no sideways scroll. The only console messages were headless Chromium's GPU notices from the Distribution scene's canvas.
