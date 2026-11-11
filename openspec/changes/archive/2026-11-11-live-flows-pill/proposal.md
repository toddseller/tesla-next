# Proposal

## Why

The motion prototype (https://claude.ai/artifact/JmyaCrFweA1QgW57o5VJA9) drew the top bar with the live solar and home power beside the Powerwall's charge: "Solar 6.2 kW", "Home 1.4 kW", "PW 92%". The approved Instrument mockup that live-top-bar built from showed only the Powerwall pill, so the bar never got the two flows, and subtle-motion's tween went to the charge alone. Today the only place to see what the panels make and the house draws right now is the Distribution page. Every live status already carries both figures (`solar_power`, `home_power`), and every page already receives them on its `/api/live` stream.

## What Changes

- **One live pill:** the Powerwall pill becomes the live pill, reading solar, home and the Powerwalls together, like "SOLAR 6.2 kW · HOME 1.4 kW · PW 92% · CHARGING", as mockup C on the redesign canvas (https://claude.ai/artifact/7crQGRyQS9J8wSdKYJjD6d, "C · One live pill") draws it. Each flow has a small swatch in its flow color; the figures stay in the light text color, because home blue as small text falls short of 4.5:1.
- **Solar follows the sun:** solar is in the pill from sunrise to sunset at the site, even at 0 kW, and out of it from sunset to sunrise, so it changes once at each end of the day rather than flickering as the output crosses a threshold at dusk.
- **Unknown figures leave the pill:** home is left out when the status doesn't report it. A stale status (two minutes old or more) leaves both flows out, so the pill falls back to the Powerwall alone, as it reads today. Before any status, the pill keeps today's dashes.
- **The figures roll:** solar and home move from their old figures to their new ones in 400 ms, as the charge does.
- **Narrower windows keep today's bar:** below 1360 pixels the flows are left out. On a phone the full pill doesn't fit beside or under the time, and on a 1280 pixel laptop it would push the page links onto a second row.
- **Unchanged:** the dot, the time, LIVE and LAST, the off-grid and storm-watch pill before the live pill, and the Powerwall part's text ("PW 92% · CHARGING").

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `dashboard-shell`: the top bar's live pill gains solar and home, with solar shown by daylight and the flows left out when unknown, stale or in a window narrower than 1360 pixels.
- `site-motion`: the solar and home figures roll like the Powerwall charge.

## Impact

- **Code:** `lib/live-status.ts` (the flows' reading), `components/top-bar.tsx` (the pill), `lib/scene/live-scene.ts` (its kW format, shared), and their tests.
- **Reused:** `skyAt` in `lib/scene/sun.ts` for day and night, the scene's kW format, `Rolling` for the tween, and the shared `/api/live` stream and first-paint status from live-top-bar.
- **Database, anton-tesla-api-ws and `/api/live`:** unchanged; the figures are in anton's existing `live_status` notification.
- **Docs:** the redesign canvas holds the mockups; `README.md` needs no change (no pin or env var).
