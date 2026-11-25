# Proposal

## Why

The 2026-11-24 evening critique marked the "Corrected / As Tesla reported" switch down under three heuristics: nothing near it says what "Corrected" means. The note that explains it sits at the end of the first card on Solar and Impact, and at the bottom of the page on Patterns and Top Ten, far below the switch. The term-hints change left the switch unhinted on purpose, counting on that note; on a long page it doesn't reach the visitor.

## What Changes

- A hinted label, "Grid readings", sits in front of the readings switch wherever it shows (Solar's range and day views, Impact, Patterns, Top Ten). Tapping it opens a short definition: what Tesla under-read and over which dates, and what each choice shows.
- The switch's group is named "Grid readings" for assistive technology, matching its label.
- The note under the figures stays; it still says which readings the figures use.
- Top Ten's VPP switch keeps its footnote and no hint.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `term-hints`: a grid readings term joins the list of definitions, and the readings switch gets a hinted label in place of "no hint on switches".
- `meter-correction`: "A choice of readings on each affected page" adds the hinted label.

## Impact

- `lib/terms.ts` and its test, `components/readings-switch.tsx` and its test.
- Tests that find the switch by its group name: `components/solar/solar-page.test.tsx`, `components/solar/day-panel.test.tsx`, `components/impact/impact-page.test.tsx`.
- No route, data, dependency or env var changes.
