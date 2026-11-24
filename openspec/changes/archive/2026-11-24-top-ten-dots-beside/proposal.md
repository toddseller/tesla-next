# Proposal

## Why

Critique round 5 (2026-11-24, P1) found the Top Ten timeline's dots covering each other's ranks: solar #4 and #5 are a day apart, #7 and #9 three weeks, export days #8 and #9 a month, and outages #8 and #10 fall on the same day. Each dot is 20px wide so its rank fits inside, on a scale where a day is a third of a pixel on a desktop and a sixth on a phone. #1 carries no number at all.

## What Changes

- The timeline's dots shrink to small markers, each still at its exact day and figure; #1 keeps its red ring.
- Every rank, #1 included, is set beside its dot, level with it: to the right, or to the left near the right edge or when the right would collide.
- A rank moves up or down, joined to its dot by a thin line, only when beside its dot it would cover another dot or another rank. A rank never sits close enough to another dot to read as that dot's.
- Dots that land on nearly the same spot share one label, ranks in order, such as "7, 8, 10".
- Dots are no longer slid apart or resized to make room; the mockup's alternative (sliding numbered dots sideways) was turned down because on a phone it moved two Feb 4, 2025 outages into the current year.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `top-ten`: the timeline's dots and how their ranks are shown.

## Impact

- `components/top-ten/timeline.tsx` and `components/top-ten/timeline.test.tsx`.
- No API, data or dependency changes. The ranking lists, the record and the timeline's spoken description are unchanged.
