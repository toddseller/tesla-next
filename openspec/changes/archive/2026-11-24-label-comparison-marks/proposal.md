# Proposal

## Why

Critique round 4 (2026-11-23, P2) found comparison marks a reader has to guess at: Habits' gray lines carry no years, Top Ten's dots #4 to #10 carry no rank and its shaded band no caption, Home Today's dimmed hours to come read as a blank block, and Habits' "+5 kWh a day" sits beside two watt figures with nothing tying it to them.

## What Changes

- Habits' chart draws last year's line in a darker gray than the years before it, and a key under the chart names this year, last year and "earlier years" (the last only when there are any).
- Habits' difference figure leads with the watt gap between the two months it follows, and gives the kWh a day after it: "+221 W", "about +5 kWh a day more than a year ago".
- Top Ten's timeline numbers every dot from #2 to #10, at the size #2 and #3 already have; #1 keeps its red ring.
- Top Ten's shaded current-year band carries a small "this year" caption.
- Home Today's dimmed hours to come carry a small "still to come" caption, and its time axis is marked 12 AM at both ends so the chart reads as the whole day.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `home-story`: Habits' chart names its years; Habits' difference leads with watts; Today's chart names its dimmed hours.
- `top-ten`: the timeline numbers dots #2 to #10 and captions the current-year band.

## Impact

- `components/home/habits.tsx`, `components/home/today.tsx`, `components/top-ten/timeline.tsx` and their tests.
- No API, data or dependency changes. Patterns keeps its own difference figure as it is.
