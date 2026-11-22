# Proposal

## Why

The live critique after the home-story release found two home charts printing wrong axes on the page meant to earn trust. Records' "Longest outage" chart labels its y-axis with raw, clipped floats ("388889", "333334"). Since 2021 puts its year labels at arbitrary dates, so "2025" sits months after the March 2025 payback line.

## What Changes

- Records' charts mark their y-axis to a tenth at 0, at the record and, for a series that starts below 0 (the month export tab's first month imported more than it sent), at its lowest figure.
- Since 2021's chart puts a tick at each January 1 it spans, labelled with that year, as Records' x-axis already does. The two charts share one helper for those ticks.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `home-story`: "How each record was beaten" says how the steps' axis reads; "Since 2021" says where its years are marked.

## Impact

- `components/home/records.tsx` and `components/home/since.tsx`: the axes.
- `lib/home/records.ts`: the year ticks move here from `records.tsx`, with a tick format to a tenth, so both charts use them and a test can reach them.
