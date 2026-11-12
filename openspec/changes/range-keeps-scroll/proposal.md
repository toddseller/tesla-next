# Proposal

## Why

In a short window, choosing a preset or picking dates on the Solar, Impact or True-Up page jumps the page back to the top. The reader loses the chart they were looking at. On Solar the forecast card sits above "Solar by date range", so that whole section can be below the fold. Each range change is a client navigation, and those scroll to the top unless told not to. The readings switch and Impact's backup year already say not to; the range controls don't.

## What Changes

- **Picking a range keeps the reader's place** on Solar, Impact and True-Up: a preset, an Earlier true-up year, or dates from the custom range picker change the address and the figures, and the page stays scrolled where it was.
- **Opening a month's days keeps the reader's place** on Solar: clicking a period bar shows that period's daily bars without moving the page.
- **Unchanged:** clicking a daily bar still opens the day view at the top, since it replaces the whole page. Every range change is still a new entry in the browser's history, so Back returns to the previous range. The readings switch and the backup year already keep the scroll position.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `dashboard-shell`: picking a range with the shared range controls keeps the page's scroll position on every page that has them.
- `solar-range-chart`: opening a period's daily bars keeps the scroll position; opening a day still starts at the top.

## Impact

- **Code:** the range navigations in `components/solar/solar-page.tsx`, `components/impact/impact-page.tsx` and `components/true-up/true-up-page.tsx`, and their tests.
- **Mockups:** none. Nothing on the page looks different.
- **Data, routes and the pages' loading:** unchanged.
