# Proposal

## Why

On the Solar page's range view and on Impact, the Grid readings switch sits in the page header and shows only for ranges that include a corrected day. Stepping through the presets makes it come and go, so the header reflows and the heading shifts (critique round 9, issue 5). On Impact it also crowds six presets into a cluster of about nine controls.

## What Changes

- On the Solar page's range view and on Impact, the Grid readings switch moves out of the header into the range card, in one row with the note that says which readings the figures use. It shows under the same condition as before: only when the range includes a corrected day.
- The header keeps only the heading and the range controls (presets with step buttons, and the dates button), so choosing a preset never adds or removes a control there.
- Impact keeps its six presets.
- Unchanged: Patterns and Top Ten, whose switch always shows, and the Solar day view, whose switch sits in its stepper row.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `meter-correction`: on the Solar range view and on Impact, the switch sits beside the readings note at the foot of the range card rather than in the header.
- `impact-report`: "Range controls beside the heading" no longer lists the readings switch among the header's controls.

## Impact

- `components/solar/solar-page.tsx`, `components/impact/impact-page.tsx`: the switch moves from the header into the card's foot row with `ReadingsNote`.
- `components/solar/solar-page.test.tsx`, `components/impact/impact-page.test.tsx`: tests for where the switch sits.
- No API, data or dependency changes.
