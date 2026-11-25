# Proposal

## Why

The 2026-11-24 evening critique found True-Up's cycle chart drawing exports in Solar amber, while every other page draws energy sent to PG&E in Grid gray (Home's Today chart, the Solar range chart, Top Ten's export rankings). It also draws the running net as a whole Tesla-red series, where DESIGN.md keeps red for a mark that must be found at once.

## What Changes

- Exports below zero turn Grid gray at a lighter tint than the imports above, as Home's "Sent to PG&E" area already is; the Exported legend swatch matches.
- The running net becomes a neutral line in the page's text color, without a dot at every cycle. One Tesla-red dot marks its last point, where the range stands now; on All time only the latest true-up year's line ends in it. The Running net legend swatch turns neutral.
- Unchanged: imports, last year's dashed line, the projected band, the tooltip, and each true-up year's running net drawn as its own line.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `true-up-tracker`: "Cycle chart" changes the exports' color and the running net's color and marks.

## Impact

- `components/true-up/cycle-chart.tsx` and its test.
- No route, data, dependency or env var changes.
