# Proposal

## Why

The 2026-11-24 evening critique found the top bar's links breaking onto two lines at exactly 1440 pixels, the most common laptop width, and at 768. At 1440 the live pill gains its SOLAR and HOME readings, and while a storm watch or off-grid pill is also showing, the bar needs about 1,464 pixels. The links' row then squeezes, and "True-Up" and "Top Ten" wrap inside themselves. The spec keeps the seven links on one row, but nothing keeps each link's name on one line.

## What Changes

- Each top-bar link's name stays on one line at every width from 640 pixels up.
- When the bar runs out of room, the live status moves to a row of its own, as it already does at 1024. The links never squeeze.
- The SOLAR and HOME readings keep showing from 1440 up.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `dashboard-shell`: "The frame fits any screen" adds that each link's name stays on one line, with scenarios at 1440 during a storm watch and at 768.

## Impact

- `components/top-bar.tsx` and `components/top-bar.test.tsx`: the nav links.
- No new route, dependency, data or env var.
