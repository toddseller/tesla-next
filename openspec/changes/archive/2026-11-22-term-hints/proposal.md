# Proposal

## Why

The live critique found that the visitors the home page now invites (people weighing solar, the curious) meet terms they can't know: the true-up and its year labels, NEM and NEM2, VPP, Net Surplus Compensation, WestLight Energy, the 4 to 9 p.m. peak and storm watch. They appear on the True-Up page and the Solar day view with no explanation anywhere near them.

## What Changes

- **A tappable term.** A term's chosen place on a page gets a dotted underline. Tapping, clicking or focusing it opens a small popover with one or two sentences saying what it means; Escape or a tap elsewhere closes it. It works by touch, mouse and keyboard, and reads as part of its sentence.
- **One glossary.** Each term's words and definition live in one place, so the same term reads the same wherever it is hinted.
- **Where the hints go**, each term once per page, at its first appearance:
  - True-Up: "True-Up" in the page's title (the definition says what a true-up year is and how its labels like '25 - '26 read), "Peak (4 to 9 p.m.)" in the net tile, "NEM" in the charges tile (a past year's true-up tile when it has charges), "Net Surplus Compensation" in a past year's true-up tile when it mentions it, "VPP" in the VPP tile's title, "WestLight" in the savings card's estimates note, "NEM2" in the savings card's line about storing solar, and "Storm watch" in the Powerwalls' parts when a storm watch day is counted.
  - The Solar day view: "Storm watch" in its list of spans.
- **Not hinted:** the Corrected / As Tesla reported switch (its note under it already explains it) and Top Ten's VPP switch (its footnote already explains VPP event days); a hint can't sit inside a button.

## Capabilities

### New Capabilities

- `term-hints`: the tappable term, the glossary's definitions, and where each term is hinted.

### Modified Capabilities

None. The pages keep their text; the hints wrap words already there.

## Impact

- New: `lib/terms.ts` (the glossary), `components/term.tsx` (the tappable term, on the existing `components/ui/popover.tsx`, and a helper that hints a named term inside a line of text).
- `components/true-up/true-up-page.tsx`, `tiles.tsx`, `savings-card.tsx`; `components/solar/day-view.tsx`.
- DESIGN.md records the term's look.
