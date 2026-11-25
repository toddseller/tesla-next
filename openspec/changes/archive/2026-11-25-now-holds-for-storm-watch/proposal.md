# Proposal

## Why

During a storm watch, Home's Now sentence says "The Powerwalls are idle at 98%" while the grid supplies the house, which reads like a fault; the top bar meanwhile says STORM WATCH. The sentence should give the same reason the top bar does (critique round 8, P3).

## What Changes

- While the site is in storm watch and on the grid, the Now sentence says the Powerwalls are holding their charge for a storm watch instead of "idle": "The Powerwalls are holding at 98% for a storm watch."
- Charging during a storm watch names the reason too: "The Powerwalls are charging at 5.0 kW for a storm watch, 72% full."
- Supplying, and everything outside a storm watch, reads as before. An outage outranks a storm watch, as it does in the top bar.
- No term hint in the sentence; the top bar's STORM WATCH already opens the definition.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `home-story`: the Now sentence gains a storm-watch wording for idle and charging Powerwalls.

## Impact

- `lib/home/now-sentence.ts` and its tests; `components/home/now.tsx` passes whether a storm watch is on, from the live status it already holds.
- No API, data or dependency change.
