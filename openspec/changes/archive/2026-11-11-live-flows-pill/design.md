# Design

## Context

- **Mockups:** https://claude.ai/artifact/7crQGRyQS9J8wSdKYJjD6d, the row "Solar and Home live in the top bar" (November 11, 2026). Artboard "C · One live pill" was chosen over A (separate figures beside the pill) and B (the flows in a pill of their own). It shows the day, after sunset, stale, nothing received yet, off grid and a phone. The charge keeps its "·" before the state, as today.
- `components/top-bar.tsx`'s `Status` reads the bar through `liveStatus(status, now)` in `lib/live-status.ts`. That returns `live`, `word`, `time` and the Powerwall `pill` text, and the charge rolls through `Rolling`. `now` ticks each second and starts at the server's `renderedAt`, so the first render in the browser matches the server's.
- The status object is anton's whole `live_status` notification, both from the server's `latest()` for the first paint and from the shared stream. It carries `solar_power` and `home_power` (older payloads: `load_power`). The values may come as strings, so the Distribution page reads them with `parseFloat(String(value))` (`components/scene/use-site-data.ts`).
- `lib/scene/sun.ts` has `skyAt(now)`, "day" from sunrise to sunset at the site, built on the `sunTimes` the scene's sky uses. `lib/scene/live-scene.ts` has the scene's private kW format: one decimal, magnitude only, "0 kW" below 0.05.

## Goals / Non-Goals

**Goals:**
- The pill's solar and home read exactly as the Distribution page writes them.

**Non-Goals:**
- Grid power, Powerwall power and the car: the pill holds solar and home only.
- Any change to `/api/live`, the stream, or the first-paint wiring from live-top-bar.

## Decisions

**`liveStatus` returns the two flows, each a number or null.** It gains `solar` and `home`:
- `solar` is null when the status is stale, when `skyAt(now)` is "night", or when the value doesn't parse.
- `home` is null when stale or unparsed, reading `home_power ?? load_power` as the scene does.

Keeping the rules in the pure function puts them under unit tests next to the existing stale rule. The component only renders what it's given. The `LiveStatus` type gains the three fields.

**Day and night come from the bar's clock, not the status's time.** `now` already ticks each second and is the server's `renderedAt` on the first render, so solar leaves the pill at the moment of sunset and the hydrated render matches. The status's `modified` would hold solar in the pill up to two minutes after sunset (the stale window), and the difference would not be visible otherwise. `skyAt` is reused rather than comparing `sunTimes` again.

**The scene's kW format is exported and shared.** `kw` in `live-scene.ts` becomes an export, so the bar can't drift from the Distribution page's "6.2 kW" and "0 kW". Copying it would give two formats to keep in step.

**The pill renders segments, the flows hidden below 1360 px.** Inside the existing `data-part="pill"` span, solar and home are each a segment: an 8 px square (`bg-solar`, `bg-home`, `aria-hidden`), the name, a `Rolling` figure with the shared format, and a trailing "·". Each segment has `max-[1360px]:hidden`. The first build hid them below 640 px only. On the branch container the full pill measured 409 px against today's 155, and below 1,288 px the six links no longer fit beside it, so at 1280 px "Patterns" wrapped onto a second row, where teslasolar.report keeps one. 1360 px leaves room for the widest figures (10+ kW, DISCHARGING). Letting the status drop to its own row was the alternative; it makes the bar taller at the widths most laptops have. The page menu already chooses its layout by CSS for the same reason: the pages are server-rendered per request, and a width check in JavaScript would flash and mismatch on hydration. An element with `display: none` is out of the accessibility tree too, so a phone's screen reader hears today's pill. The Powerwall part stays the existing `Rolling` charge text, unchanged.

**The swatch carries the color, the figure stays light.** Home blue `#3E6AE1` on the background is about 3.9:1, below the 4.5:1 that `dashboard-shell` asks of small text. A square in the flow color keeps the one-color-per-flow rule without coloring text.

## Risks / Trade-offs

- [The pill gets wider at sunrise, or when a figure gains a digit.] → From 1360 px there's room for the widest figures on one line. The figures are in IBM Plex Mono, so the width changes only when the number of characters changes, as the charge does at 100%.
- [1280 px laptops, common ones, don't see the flows.] → Chosen over a second row of links; they still see the Distribution page.
- [A status with a parseable solar of, say, 0.3 kW after sunset (a misreport) is not shown.] → That's intended: at night the pill follows the sun, not the reading.
- [The bar now formats with code from the scene's module.] → It's one pure function, and `lib/live-status.ts` already imports `DASH` and `staleWarning` from that module.

## Migration Plan

Merging to `main` deploys nothing. After the PR merges, a `v*` release deploys it to teslasolar.report, with the user's go-ahead first. Check it there on desktop and phone width, day and, if the release lands after sunset, night. Rolling back is releasing the previous tag.

## Results

- **Branch container (task 4.2), 2026-11-11, 9:20 to 9:30 AM PST:** onyx, reading production read-only, through an SSH tunnel, checked in Playwright's headless Chromium.
  - **First build (flows from 640 px):** at 1280 px the pill read SOLAR 4.3 kW · HOME 1.2 kW · PW 100% · STANDBY, the squares amber (247, 181, 0) and blue (62, 106, 225). But the pill was 409 px wide against today's 155, and the six links wrapped onto two rows below 1,288 px, where teslasolar.report keeps one at 1280. The cut-off moved to 1360 px (see Decisions).
  - **At 1360 px:**
    - At 390 and 1280 px the pill reads PW 100% · STANDBY alone, the links keep the rows teslasolar.report has (one at 1280, two at 1024), and nothing scrolls sideways.
    - From 1366 px the name, the six links and LIVE 9:28 AM with SOLAR 4.4 kW · HOME 1.1 kW · PW 100% · STANDBY are on one line, as mockup C draws them.
    - On Distribution the bar's SOLAR 4.3 kW and HOME 1.2 kW agreed with the scene's labels.
  - **Rolling:** statuses arrived during a 25 s watch, but the figures didn't change at one decimal, so no roll was seen; the top bar tests cover it.
  - **Night:** not checked in the browser, since the check ran in the morning and moving the browser's clock past sunset makes the status stale, which drops both flows anyway. The `liveStatus` and top bar tests cover sunset.
  - **CSP:** no console error and no CSP violation; the container is the production build, under the production CSP.

## Rollout

- **Release v2026.11.11.4, 2026-11-11:** PR #45 merged, and the Deploy run passed in about 2.5 minutes. On teslasolar.report at 9:39 AM PST, the task 4.2 checks in headless Chromium gave the same results:
  - At 390 and 1280 px the pill reads `PW 100% · STANDBY` alone. The links keep their rows (one at 1280, two at 1024), and nothing scrolls sideways.
  - From 1366 px the bar reads `LIVE 9:39 AM` with `SOLAR 4.5 kW · HOME 1.3 kW · PW 100% · STANDBY` on one line, with the amber and blue squares.
  - The bar's solar and home agreed with the Distribution scene's labels.
  - There was no console error or CSP violation.
