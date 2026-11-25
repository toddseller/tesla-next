# Design

## Context

`nowSentence` (`lib/home/now-sentence.ts`) builds the sentence from the balanced flows, the charge and the car; it knows nothing of the grid's state. `Now` (`components/home/now.tsx`) already holds the latest live status, which carries `island_status` and `storm_mode_active`. The top bar decides storm watch with `gridPill` (`lib/live-status.ts`): storm mode on and the island status not `off_grid*`.

## Goals / Non-Goals

**Goals:**
- The sentence and the top bar agree on when it is a storm watch.

**Non-Goals:**
- A term hint in the sentence (the top bar's pill carries it).
- Any storm-watch wording in the first clause or for supplying Powerwalls.

## Decisions

- **`Now` decides storm watch with `gridPill(status, null)?.kind === "storm"` and passes a `storm` flag beside `battery` and `vehicle`.** Reusing the top bar's rule keeps one definition, outage first, so the two can never disagree. The alternative, reading `storm_mode_active` inside `nowSentence`, would duplicate the off-grid check and pull the live status type into a function that takes balanced flows.
- **Only the Powerwalls' clause changes.** Idle becomes `holding at 98% for a storm watch` (`holding for a storm watch` without a charge); charging becomes `charging at 5.0 kW for a storm watch, 72% full`. Putting the reason before the charge keeps "full" at the end, where the ordinary charging wording has it.

## Risks / Trade-offs

- [anton reports storm mode while the Powerwalls discharge on the grid] → the sentence reads "supplying" as today, which is still true; no special case.
- [The sentence and the top bar disagree for a moment] → both take each live status from the stream as it arrives and apply the same rule, so they change on the same update.
