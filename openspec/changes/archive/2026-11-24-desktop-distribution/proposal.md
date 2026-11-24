# Proposal

## Why

Critique round 4 (2026-11-23, P2) found Distribution thinner on a desktop than on a phone: at rest the replay bar hides and leaves only a 3px line, so a desktop visitor who hasn't moved the mouse has no sign that replay exists, and the "Today so far" figures a phone shows under the scene are missing at 1440px.

## What Changes

- In a window at least 1024 pixels wide the replay bar always shows over the bottom of the scene, instead of hiding 3 seconds after its last use; the progress line that stands in for the hidden bar goes there too. Phones keep the bar on demand, with the line.
- "Today so far" shows under the scene at every width, not only below 640 pixels. From 640 pixels its seven figures run four to a row, and from 1024 pixels all seven sit in one row.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `scene-replay`: the bar always shows on a desktop window; on demand and the progress line are for narrower windows.
- `live-flow-scene`: today's totals show under the scene at every width.

## Impact

- `components/scene/distribution.tsx`, `components/scene/today-so-far.tsx` and their tests.
- No API, data or dependency changes. The block now fetches `/api/intervals` on wide screens too.
