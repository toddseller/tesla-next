# Design

## Context

Five small fixes across Patterns, Home, Distribution, the Solar day view, True-Up, Impact and DESIGN.md (see proposal.md, Why). Today's house figure and the Solar day view's Home headline share one source: the day view's summary adds the car note to the headline, and `TodayTotals` labels the figure, which Home and Distribution both render.

## Goals / Non-Goals

**Goals:**
- Each figure a reader can check against another on the same page agrees with it.
- One phrase for "the house's use, the car left out", used everywhere that measure appears.

**Non-Goals:**
- Changing which measure any figure uses. Today and the day view still leave the car out; Since 2021, the year, Impact and the range chart still count it.
- Making Patterns' energy totals equal the sum of their rows. They show in MWh to a tenth, and the critique found no visible mismatch there.
- A site-wide pass for lone last words. Only the two lines the detector found are fixed.

## Decisions

**The cycles total is the sum of the rounded rows.** A reader adds whole numbers, so the tile should match that sum. The other option, showing the rows to a tenth, crowds the five-column table and the phone's stacked rows. The sum can differ from the exact figure by up to half a cycle a year; that's well under a reader's interest in "cycles since 2021".

**Since 2021 keeps the net in its sentence and drops the 24px figure.** The sentence explains the number (imported or sent, and, when matched, why it still imports), and removing the figure is a deletion. Keeping the figure would mean giving `rangeExplained` a no-net variant, used only here, whose sentence would then lose its explanation. What goes with the figure is its "since October 1" label; "This true-up year" in the sentence says the same thing.

**"without the car" replaces "car apart".** "Apart" reads oddly and doesn't sound like the opposite of "included", while "without the car" pairs with "car included" in plain words. Two strings change: the label in `TodayTotals` and the headline suffix in the day view's summary. Comments and test names that say "car apart" change with them.

**Balanced tile lines, a pretty Impact subtitle.** Impact's car charging subtitle takes `text-pretty`, the class the Lead and other prose already use. True-Up's tile lines take `text-balance` on the `Tile`'s text container, since text wrapping inherits: the VPP tile's line still ended on "true-up." at 1440 under `text-pretty` (Chrome 158), and balancing fixes it. Chrome balances blocks of up to six lines; longer tile lines wrap as they did before.

**DESIGN.md follows the shipped sizes.** The 34px figures were a deliberate choice (`tiles.tsx` comments on the 28px narrow fallback), so the doc changes, not the code.

## Risks / Trade-offs

- [Home's Since 2021 figure column now opens with the dollar estimate, or only the payback words without dollar projections] → Checked at 1440 and 390 in the browser before push; the column already handles a missing estimate.
- [`text-pretty` is ignored by browsers without support] → They wrap as today; nothing breaks.
