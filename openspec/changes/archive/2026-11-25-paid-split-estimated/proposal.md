# Proposal

## Why

True-Up's headline and Charges so far tile add each billed cycle's charge as the statement printed it, while the savings card reprices every day from PG&E's readings, so its three cases (actual, solar only, no system) differ by energy alone. The two totals differ by the gap between a billed cycle's statement and its estimate (58¢ on '26 - '27's first cycle), enough to round to $195 in the tile and $194 under the card's Paid on one screen (critique round 10, P2 #2). Nothing on the card says its split is the estimate.

## What Changes

- The line under the savings card's Paid reads "Estimated: PG&E $195 · WestLight $52" instead of "PG&E $195 · WestLight $52".
- The calculation doesn't change; the card keeps repricing from readings so its saving stays energy alone.

"Estimated:" was picked over "repriced from PG&E's readings" (longer, and a method a visitor doesn't need) and a "Paid, estimated" label (the bar's key keeps naming its parts as they are).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `true-up-tracker`: the Savings card's key marks what was paid as an estimate.

## Impact

- `lib/true-up/text.ts` (`paidSplit`) and its tests in `lib/true-up/text.test.ts` and `components/true-up/savings-card.test.tsx`.
- No API, data or dependency change.
