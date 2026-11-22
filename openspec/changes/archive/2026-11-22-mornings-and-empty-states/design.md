# Design

## Context

See proposal.md for why. The forecast card already carries today's expected hours (`card.byHour.hours`, each with its start and expected kWh); `lib/scene/sun.ts` has `sunTimes`. Impact's page parses its range on the server with today as the default. Distribution's page serves only the latest live status; its scene loads a day's intervals only while replaying. The home page's Today renders today's six totals from the day view's `viewSummary` with its `Figure` grid.

## Goals / Non-Goals

**Goals:** a first view that shows what the system does even early in the day, from figures the site already has.

**Non-Goals:** drawing yesterday on Today's chart (the owner chose the sentence); a Yesterday preset on Impact; changing Distribution on wide screens.

## Decisions

- **"Most of the day's solar" is its middle 80%.** A pure `solarWindow(hours)` in `lib/home/today.ts` returns the start of the first hour by which 10% of the day's expected kWh has come and the end of the last hour before 90% has, or nothing when both fall in one hour. The sentence shows while the time is before that window's start and there is an expected kWh; the sunrise is `sunTimes(now).sunrise` in the site's clock. Without the forecast's hours, there is no sentence.
- **Impact's default reads today's solar.** With no valid range in the address, `app/impact/page.tsx` reads today's figures first; when today's solar so far is under 0.05 kWh (reads 0.0), it shows yesterday instead. A valid range in the address is shown as asked. The page's live reload follows the shown range as today, so a visitor on yesterday's figures stays on them until they choose another range.
- **One totals grid.** The six figures, their labels and the car-apart rule move from `Today` into a `TodayTotals({ day })` component that `Today` and Distribution both render, so the two can't drift.
- **The browser fetches today's totals, on a phone only.** Distribution's page keeps rendering from the live status alone, as it always has, so it never waits on the database or fails with it, and serves no day of records it doesn't show. `TodaySoFar` checks the screen width once mounted; on a phone it fetches `/api/intervals` for today, takes only the date, totals and car flag, and fetches again on a totals event for today and when the live stream comes back after a sleep. Until the figures arrive, or if they fail, there is no block. (First built as a server read, which the review showed made the page wait on, and fail with, the database.)
- **Phone only.** At 640 pixels and up the scene already fills the window, so nothing is fetched or shown there.

## Risks / Trade-offs

- [Impact shows yesterday's date at 7 AM to a visitor who expected today] → the card's heading names the day, and "Today" in the presets is one tap away.
- [The totals appear a moment after the page on a phone] → they sit below the scene and its replay controls, out of the first view.
