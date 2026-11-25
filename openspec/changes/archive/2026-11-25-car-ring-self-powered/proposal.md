# Proposal

## Why

Impact's Home car charging ring captions its middle figure "off the grid", but everywhere else on the site (Backup, Top Ten, Payback, Home's Longest outage) "off the grid" means time the house ran through an outage (critique round 9, P2 #4). A visitor reading "61% off the grid" under the car ring can take it for outage charging. The ring above it, Self powered, measures the same thing for the house (use met by solar and Powerwall) and calls it "self-powered".

## What Changes

- The car ring's caption reads "self-powered", as the house ring's does: "61% self-powered".
- The car-charging spec names that figure the self-powered share instead of the share off the grid.
- "Off the grid" keeps its outage meaning everywhere else; nothing there changes.

"self-powered" was picked over "not from the grid" (a third phrase for one idea) and "from solar and Powerwall" (about 150px at 13px, too wide for the ring's hole, and a repeat of the section's subtitle).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `car-charging`: the solar-plus-Powerwall figure, and the ring's middle, are the self-powered share.

## Impact

- `components/impact/car-charging.tsx` and its test.
- The API's `off_grid_percentage` field keeps its name; no visitor sees it, and renaming it would touch the route, `lib/car-charging.ts` and their tests for nothing a reader notices.
- No data or dependency change.
