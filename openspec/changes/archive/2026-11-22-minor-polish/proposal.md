# Proposal

## Why

The live critique's minor observations: small things that each make a page read a little less finished. Pick a day's Random day button leads over Go, and its refusal message moves the buttons; switching the year chapter's year drops the readout on December 31; Now's status line repeats the top bar right above it; True-Up sets words in monospace beside their figures; Impact's "1 m 4 s" reads as spaced-out letters; the footer has no page links; the Records tab isn't in the address, so it resets on reload or share; the site has no skip link and a faint focus ring. Between 640 and about 1200 pixels the top bar's links also wrap, leaving Patterns alone on a second row.

## What Changes

- **Pick a day:** Go becomes the filled button and Random day the outlined one; a refused date's message no longer pushes the buttons around on wide screens.
- **The year switcher** opens the same date in the chosen year (November 22, 2024 from November 22, 2026), or the nearest day with figures.
- **Now** loses its status line; the top bar above it already gives the live time, and any off-grid or storm watch text.
- **True-Up** sets only figures in monospace: "$30" mono, "cost on the bill" sans; "369.8" mono, "imported" sans.
- **Impact's durations** set their units small beside the figures, as Top Ten's outage lengths do.
- **The footer** links the seven pages.
- **Records** puts its tab in the address as `record` (`solar`, `sent-day`, `sent-month`, `outage`), and opening such an address shows that tab.
- **Keyboard:** a "Skip to content" link first in every page, and a full-strength 2px focus ring.
- **The top bar** keeps its seven links on one row from 640 pixels; the live status moves to its own row when it doesn't fit beside them.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `home-story`: the status line is removed; the year switcher keeps the date; Records' tab is in the address; Pick a day's buttons.
- `dashboard-shell`: the top bar's layout from 640 pixels; the footer's links; a skip link and focus ring.

## Impact

- `components/home/pick-a-day.tsx`, `year.tsx`, `now.tsx`, `records.tsx`, `app/page.tsx`.
- `components/true-up/savings-card.tsx`, `cycle-list.tsx`, `components/count-up.tsx`, a small `components/measured.tsx`.
- `components/impact/backup-section.tsx`, with Top Ten's `Length` moved to a shared component.
- `components/footer.tsx`, `components/top-bar.tsx`, `app/layout.tsx`, `app/globals.css`, and the six files using the faint `ring-ring/50`.
