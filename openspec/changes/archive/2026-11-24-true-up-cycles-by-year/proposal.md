# Proposal

## Why

The round 4 critique (2026-11-23, 28/40, P1) found True-Up's All time hard to read by billing cycle. The list's rows don't show a year, so in about 60 rows "Oct 6 to Nov 4" turns up once a year with nothing to tell the years apart. Its columns jump sideways at the first cycle with charges, because a row without a charges cell spreads its four cells wider. The chart's running-net line restarts its value at each true-up year but is still drawn joined, with a diagonal from one year's last cycle to the next year's first.

## What Changes

- **The cycle list names its true-up years**: when the cycles listed span more than one true-up year (All time, or a custom range that crosses an October read), a subhead with the year's name ("'25 - '26") opens each year's cycles. A single true-up year looks as it does today.
- **One row grid**: from 640 pixels up every row has the same five columns (dates, imported, exported, net, charges), the charges column left empty where a cycle has none, so no column moves. On a phone the rows still wrap.
- **The running-net line breaks at each true-up start**: the line ends at each year's last cycle and starts fresh at the next year's first, with no segment between them.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `true-up-tracker`: the Cycle list gains subheads by true-up year and a fixed row grid; the Cycle chart's running net is drawn as one line per true-up year.

## Impact

- `components/true-up/cycle-list.tsx` and `components/true-up/cycle-chart.tsx`, with their tests. No API, data or route changes: each cycle already carries its `true_up` label.
- No new layout or page redesign, so no mockups: the list gains a subhead per year and its columns are fixed.
