# Proposal

## Why

A few figures mix units where a reader expects one: Patterns' always-on axis reads "1 kW / 500 / 0", so the middle tick reads as 500 kW; True-Up's net tile reads "Imported 1.2 MWh · Exported 448.8 kWh" under a 725.2 kWh net; and Patterns gives the always-on difference in kWh a day where Home leads with watts (critique round 9, P2 #1). Two design-system leftovers ride along: DESIGN.md describes a softer focus ring than the site draws, and the button component still carries shadcn's red-filled variant that breaks the Red Marker Rule.

## What Changes

- Patterns' "The last 12 months" axis reads every tick in the top tick's unit: "1 kW / 0.5 / 0".
- True-Up's net tile reads its imported and exported totals in the unit the net takes: under a 725.2 kWh net, "Imported 1,174.0 kWh · Exported 448.8 kWh". The peak and off-peak nets keep their own unit.
- Patterns' Difference figure leads with the watts between the two months, signed, with "+14 kWh a day" after it.
- DESIGN.md describes the focus ring as the site draws it: Dusk Gray at full strength, 3px.
- `components/ui/button.tsx` loses every variant and size nothing renders, including the red `default`; `ghost` becomes the default.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `display-units`: one unit to a power axis; True-Up's net tile reads imported and exported in the net's unit, an exception to the MWh-from-1,000 rule beside the billing cycle rows.
- `patterns-page`: the latest month's difference leads with watts, kWh a day after.

## Impact

- `components/patterns/always-on.tsx`, `components/true-up/tiles.tsx`, `components/ui/button.tsx` and their tests; `DESIGN.md`.
- `home-story` needs no change: Habits still gives Patterns' kWh a day after its watts.
- The refreshed `.impeccable/design.json` sidecar rides this branch as its own commit.
- No API, data or dependency change.
