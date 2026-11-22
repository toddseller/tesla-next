# Design

## Context

See proposal.md for why. Most True-Up wording comes from `lib/true-up/text.ts` as plain strings (a tile's `line`, the savings card's `paidSplit` and `nem2`), which the components render as text; a hint has to land inside those strings without the text functions knowing about React. `components/ui/popover.tsx` (Radix) is already used by the range picker and the phone menu.

## Goals / Non-Goals

**Goals:** a hint that works by touch, mouse and keyboard; one definition per term; a hint only where a newcomer meets the term unexplained.

**Non-Goals:** a glossary page; hints inside buttons; changing any page's wording or figures.

## Decisions

- **`<Term name>`** renders its children as a `button` styled as inline text (inherits the font, a dotted underline in the muted foreground, offset below the text), which opens a Radix popover holding the definition. The button's accessible name is the term as written, and the popover is labelled by it, so a screen reader hears "VPP, button" and then the definition. Popover rather than tooltip, since a tooltip doesn't open on touch.
- **`lib/terms.ts`** holds the glossary as `{ [name]: { term, definition } }`. Definitions are plain sentences with no figures that could go stale, except VPP's $2 a kWh, which is the rate `vppText` already states.
- **`<WithTerm text term>`** hints a named term inside a string: it splits the text at the term's first match and renders the rest as text, so `text.ts` keeps returning strings and its tests don't change. A missing match renders the text as it is.
- **Placement is chosen, not computed.** Each page names where each term is hinted (the list in the proposal), rather than tracking "first use" at render time, which would make rendering depend on order.

## Definitions (for review)

- **True-up:** PG&E bills this house's grid energy once a year. Its twelve billing cycles of imports and exports are netted, and the balance is settled at the true-up. A true-up year runs from the October meter read, so '25 - '26 is October 2025 to September 2026.
- **Peak (4 to 9 p.m.):** PG&E's peak hours, every day, when importing energy costs the most and sending it earns the most.
- **NEM:** Net Energy Metering: PG&E credits the energy the house sends against what it imports, at each hour's rate. These are the energy charges, before taxes and fixed fees.
- **NEM2:** NEM 2.0, the PG&E solar plan this house is on: energy sent to the grid earns about what the same energy costs to import at that time of day.
- **Net Surplus Compensation:** when a true-up year ends having sent more than it imported, PG&E pays for the surplus at a wholesale rate, well below what imports cost.
- **VPP:** Tesla's Virtual Power Plant: from May to October, Tesla sends the Powerwalls' energy to the grid during PG&E's peak events and pays $2 a kWh, apart from PG&E's bill.
- **WestLight:** WestLight Energy, Peninsula Clean Energy until 2026, supplies the house's electricity; PG&E delivers it and bills for both.
- **Storm watch:** before severe weather that could cut the power, the Powerwalls charge to full and hold it, so the house is ready for an outage.

## Risks / Trade-offs

- [A definition states a fact about PG&E's or Tesla's programs that could be wrong for this house] → the definitions above are for your review before implementation.
- [A dotted underline can read as a link] → it opens in place and never navigates; its style differs from the doorway links (outlined buttons with an arrow).
