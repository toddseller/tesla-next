# Proposal

## Why

The top bar's STORM WATCH pill shows on every page while storm watch is active, and nothing on it says what it means. The 2026-11-24 critique scored Help and Documentation down for it. The site already explains storm watch on the True-Up page and in the Solar day view; the pill is the one place a visitor meets the term without that explanation.

## What Changes

- The STORM WATCH pill's text becomes a hinted term: tapping, clicking or focusing and activating it opens the same storm watch definition the True-Up page and the day view open.
- The pill keeps its amber border and text, its place before the live pill and its wording.
- The term-hints rule "each page hints each term once" makes room for the top bar: the pill is part of every page's shell, so it is hinted wherever it shows, apart from the page's own hints. During storm watch the True-Up page can show two storm watch hints, the pill's and the Powerwalls' parts'.
- The OFF GRID and OFF GRID TEST pills stay as they are.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `term-hints`: the once-per-page rule excludes the top bar, and a new requirement hints "STORM WATCH" in the top bar's pill.
- `dashboard-shell`: the storm watch scenario of "Off grid and storm watch in the top bar" adds that the pill opens the storm watch definition.

## Impact

- `components/top-bar.tsx` (the grid pill) and `components/top-bar.test.tsx`.
- No new term, definition, dependency, route or data.
