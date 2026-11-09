## Why

The Payback card shipped in v2026.11.09.3 drifts from mockup B, the one the owner picked: on desktop the timeline's dots sit above the line instead of on it and the projected stretch isn't dashed, and on a phone the list has no line joining its steps. The card also sits last, under the billing details, though its answer is the page's biggest one.

## What Changes

- Desktop timeline: each marker's dot is centred on the line, with a card-coloured ring so it reads as threaded on it, as in mockup B.
- Desktop timeline: the line is solid from PTO to today and dashed from today to the whole-system year, then plain to the end, as mockup B and the system-payback design describe.
- Phone list: a rail runs down the left joining the steps, solar-coloured from PTO through today and grey after it, ending at the last step; Today is a hollow grey ring, as in mockup PhoneB.
- The card moves from below the cycle list to right after the savings card; with no savings card (All time, or a custom range) it follows the tiles and metering note.

No new mockups: this brings the card to mockup B (https://claude.ai/artifact/5QfVBJ8XiYLyYba6jBr4iA).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `system-payback`: the Payback card's timeline gains its look as requirements (dots on the line, dashed projection, the phone rail).
- `true-up-tracker`: the Payback card sits after the savings card instead of below the cycle list.

## Impact

- `components/true-up/payback-card.tsx` and its test; `components/true-up/true-up-page.tsx` (card order) and its test if one covers the order.
- No change to `/api/payback`, `lib/true-up/payback.ts`, the costs file or any data.
