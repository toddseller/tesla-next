# Proposal

## Why

The 2026-11-23 critique scored Consistency and Standards 2 of 4 (group 4 of critique round 4): cards head themselves in three styles, True-Up's Powerwall dollars are set in the sans against the Mono Means Measured rule, Impact reads a total as 75.7 MWh where Home reads the same kind of total as 75,660 kWh, and Impact says "home" where every other page says "house". Each is small; together they make the pages read as built by different hands.

## What Changes

- Every card's heading on the report pages becomes the section label DESIGN.md already names (Plex Sans 500, 14px, 0.06em tracking, uppercase, Dusk Gray): Backup, Payback, the cycle chart's heading, Billing cycles, What the system saved, True-Up's tiles (Net so far and the rest), Top Ten's ranking titles and admin's three sections. Backup's year keeps its place after the middle dot. The range heading on Solar and Impact (the dates over the figures) is a page heading, not a card's, and stays as it is.
- True-Up's savings card already sets every dollar figure in Plex Mono (each figure through `Measured`, since v2026.11.22); the critique misread it. The change pins it with a test and in the design system requirement, with no code change.
- One energy rule for the whole site: an energy figure of 1,000 kWh or more reads in MWh to one decimal place; below that it keeps its kWh and its precision. Impact's formatter, which already does this, moves to a shared helper, and every figure that can pass 1,000 kWh uses it: the range leads, the Solar range chart's totals and tooltips, Since 2021, the year chapter, Habits' Powerwall total, Records, Top Ten, Patterns' Powerwall use and True-Up's tiles and sentences. A chart's energy axis reads in MWh when its top tick is 1,000 kWh or more, so a chart never mixes the two; this also gives Since 2021's axis its missing unit.
- Impact's prose says "house": "Where the house's energy came from", "House use met by solar and Powerwall", "Solar generated against house use" and the bar "House, car included" (as the Solar range chart names it). The Home flow's name (the Home series and the live pill's HOME) and "Home car charging" (charging at home) stay.

Out of scope: the Distribution scene's "Today so far" heading (group 5 changes that page through its ported specs), the Solar day view's ported section titles, and daily figures, which never reach 1,000 kWh.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `display-units`: adds the energy rule, kWh below 1,000 kWh and MWh from it, for figures and chart axes.
- `dashboard-shell`: the design system requirement names the one card heading style and sets dollar figures in Mono with the other figures.
- `impact-report`: the Self Powered and Solar Offset sections say "house", and Solar Offset's units follow the shared energy rule.
- `solar-range-chart`, `true-up-tracker`, `patterns-page`, `home-story`, `site-motion`: requirements and scenarios that quote totals of 1,000 kWh or more now read them in MWh ("Solar has generated 75.6 MWh since Oct 10, 2021.", "Year-end 2.1 to 2.4 MWh imported").

## Impact

- New helper in `lib/units.ts`, replacing `energy` in `components/impact/sections.tsx`.
- Energy figures: `lib/lead.ts`, `components/solar/range-chart.tsx`, `components/home/{since,year,habits,records}.tsx`, `components/top-ten/*`, `lib/top-ten.ts`, `components/patterns/powerwall-use.tsx`, `components/true-up/{tiles,cycle-chart}.tsx`, `lib/true-up/text.ts`, and Impact's car charging and Backup summary (`components/impact/{car-charging,backup-section}.tsx`), found in the sweep.
- Headings: `components/impact/backup-section.tsx`, `components/true-up/{payback-card,true-up-page,savings-card,tiles}.tsx`, `components/top-ten/ranking.tsx`, `components/admin/{bill,payout,vpp}-section.tsx`.
- Wording: `components/impact/{impact-page,sections}.tsx`.
- Tests that read these strings and headings; DESIGN.md gains the MWh rule.
