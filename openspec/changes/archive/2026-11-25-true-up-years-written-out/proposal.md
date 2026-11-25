# Proposal

## Why

The 2026-11-24 night critique's third issue (P2): the True-Up page's "Billed against estimate: $0.58 under" reads backwards (the estimate was under, but the tile is about what PG&E billed), true-up years read as shorthand ("'25 - '26") across the site, and at All time the cycle list runs to about 60 rows with no figure for each year.

## What Changes

- The Billed against estimate tile makes PG&E the subject: its figure is how much more or less PG&E billed than the estimate, "$2.82 more than the estimate" instead of "$2.82 under". The line under it and "Exact" stay.
- Every place the site shows a true-up year names it written out, "2025-26" instead of "'25 - '26": True-Up's headlines, sentence, chart heading and list, the range presets and stepped preset buttons on every page, page titles, the unshown-range notice, Impact's Backup heading, picker and blips line, Impact's year-earlier comparison, the Payback card's note on its estimated years, and the true-up term's hint. The name still never breaks across a line. The data keeps its label (`true_up` on `/api/cycles` rows stays "'25 - '26").
- When the cycle list spans more than one true-up year, each year becomes a summary row in the list's own columns (the year, its imported, exported and net, and the sum of its cycles' NEM charges) that opens to show its cycles. At All time only the current year starts open; a custom range across years starts with every year open, since it can cut a year short. A single true-up year's list is unchanged.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `true-up-cycles`: "True-up years" adds the written-out name pages show for a year, apart from its label.
- `true-up-tracker`: "Billed against estimate tile" changes its wording; "Cycle list" replaces the year subheads with collapsible summary rows; "Year names stay on one line", "Year picker", "Default and invalid ranges", "The current year's headline", "A past year's headline" and "The range explained" show the written-out name.
- `dashboard-shell`: "The dates button", "Each page's title" and "A stepped preset names its range" show the written-out name.
- `backup-history`: "The Backup section's year", "The Backup year is in the address", "Blips per year", "The Backup section follows the page's year" and "The Backup heading names its span" show the written-out name.
- `impact-report`: "The year-earlier days" compares a finished true-up year by its written-out name.
- `term-hints`: "One definition per term" explains the written-out name.

## Impact

- `lib/true-up/text.ts` (`yearName`, `billedText`), `lib/solar/ranges.ts` (`trueUpName`), `lib/backup-figures.ts` (`blipsPerYear`), `lib/terms.ts` (the true-up definition).
- `components/true-up/cycle-list.tsx` (summary rows).
- Tests that quote the old form: True-Up, Impact's Backup, ranges, dashboard shell, Home.
- Not changed: `trueUpLabel` and the label it gives cycle rows, API data and the owner-only `/admin` page, which names years by that label.
- No route, dependency or env var changes.
