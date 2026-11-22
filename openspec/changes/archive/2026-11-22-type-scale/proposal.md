# Proposal

## Why

The live critique found type sizes that DESIGN.md doesn't list. Most are deliberate and simply unrecorded: the 15px sentence that leads each home chapter (also Patterns' small headings and the top bar's links), and lead figures above 36px (home Today's kWh at 40px, Impact's ring percentages at 52px, Top Ten's #1 at 56px). Three are one-offs with no reason to be off the scale: Pick a day's 32px heading, the year chapter's 17px day readout, and Patterns' 10px hour labels on phones.

## What Changes

- **DESIGN.md records what's deliberate:** a Lede tier (15px) for the supporting sentence under a home chapter's figures, small headings inside a card, the top bar's links and the year's day readout; a Lead sentence tier (18 to 22px) for the few sentences that carry a chapter; lead figures from 34 to 56px and secondary figures from 15 to 24px under Figure; an Axis tier (Mono 12px, Patterns' grids 11px on phones) apart from the 11px Label, now weight 600 as the code sets it; Pick a day's 28px heading under Headline; and the chapter word's 64px phone size as its own token. The review found these beyond the critique's two sizes, so the scale is true of every size in use.
- **The one-offs move onto the scale:**
  - Pick a day's heading stays 28px on wide screens instead of growing to 32px, the size of the other figures it sits among.
  - The year chapter's day readout goes from 17px to the 15px Lede.
  - Patterns' hour labels on phones go from 10px to the 11px Label.
- Distribution's 10px replay tag is left alone, as the house scene keeps its styling.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. No spec names a type size (`skip_specs`).

## Impact

- `DESIGN.md` (frontmatter `typography` and the Hierarchy list).
- `components/home/pick-a-day.tsx`, `components/home/year.tsx`, `components/patterns/house-use.tsx`.
