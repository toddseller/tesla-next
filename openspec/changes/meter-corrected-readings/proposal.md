# Proposal

## Why

Until a service visit on April 27, 2026, Tesla's grid readings were about half of what PG&E's meter recorded:
- **Since October 6, 2023**, when PG&E's daily readings in `meter_day` begin, Tesla's grid import and export ran at about 0.47 of the meter's every month, and at 0.46 to 0.55 of every billing cycle stored.
- **Before that**, back to the first data in October 2021, nights powered from the grid read about 0.45 of nights powered from the Powerwall, which has its own, correct meter.
- **From April 27**, Tesla's readings match the meter to within 1%.

The site already uses PG&E's readings in place of Tesla's for daily figures (the Solar range chart, Impact, Top Ten's export rankings, True-Up). The 5-minute figures still show Tesla's half readings: the Solar day view, the Distribution replay, Patterns and Impact's car charging split. One result is that Patterns' Always on load appears to have tripled year over year. That is mostly this error: nights on the grid read about 400 W where nights on the Powerwall read about 850 W.

The aim is a corrected view everywhere PG&E's readings allow, with Tesla's own figures still one click away.

## What Changes

- **Corrected 5-minute figures**, for days before April 27, 2026 that have PG&E's readings:
  - The difference between the meter's day and the sum of Tesla's 5-minute steps is spread over those steps: import onto the steps the home drew from the grid (or, on a day with none, from the Powerwall), export out of the home's solar use. The steps' import and export then add up to PG&E's reading. Tesla's own daily table and its steps already differ, typically by about 0.2 kWh, so the day view and the range chart can differ by that much, as they do today.
  - This applies to `/api/intervals`, and so to the Solar day view, its totals and the Distribution replay. It also applies to Patterns (Always on, House use) and to Impact's car charging split.
- **A switch on each affected page**, reading "Corrected" and "As Tesla reported", with Corrected the default:
  - It is kept in the page's address (`readings=tesla`), as Top Ten's VPP choice is.
  - It appears only when what the page shows reaches into the corrected window: the Solar page (range chart, day view and strip), Impact, Patterns and Top Ten, beside its VPP switch.
  - As Tesla reported shows Tesla's own figures, daily and 5-minute alike.
- **Dates before PG&E's first reading** (October 6, 2023) stay as Tesla reported them in both views, and a footnote says so. No PG&E data reaches that far back.
- **Not changed:**
  - True-Up: cost and savings are PG&E's billing, and keep PG&E's readings with no switch.
  - Distribution: no switch of its own. Its replay takes the corrected default.
  - Solar and Powerwall figures, which were never affected.
  - anton's stored data, which stays as Tesla reported it.

## Capabilities

### New Capabilities
- `meter-correction`: how the site corrects Tesla's grid readings with PG&E's meter before April 27, 2026. It covers the window, the daily and 5-minute rules, which pages offer "As Tesla reported" and how the choice is kept and explained.

### Modified Capabilities
- `day-intervals`: the day intervals response corrects a day's grid flows from PG&E's readings, and takes `readings=tesla` to answer as Tesla reported.

## Impact

- **Data:**
  - `lib/intervals/intervals.ts` and `lib/patterns.ts`: read the 5-minute flows through one corrected-reading query, which `lib/car-charging.ts` uses through `intervals.ts`.
  - `lib/range.ts`, `lib/impact.ts` and `lib/top-ten.ts`: their existing daily correction becomes optional.
  - The kept memories (`patternsMonths`, `chargingDays`) gain the choice in their keys.
- **Routes and pages:**
  - `/api/intervals`, `/api/range`, `/api/impact`, `/api/car-charging` and `/api/top-ten` accept `readings=tesla`.
  - The Solar, Impact, Patterns and Top Ten pages read it from their address and show the switch.
- **Design:** a new control on four pages, so mockups come first.
- **Unchanged:** `meter_day`, anton, the weekly meter check, True-Up and the database schema.
