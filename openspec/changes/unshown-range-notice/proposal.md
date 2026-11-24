# Proposal

## Why

The 2026-11-24 critique scored Error Recovery down for silent range swaps. A shared link the site can't show, such as `/solar?start=2030-01-01&end=2030-01-31`, redirects to the page's default range, and nothing tells the visitor that the range they asked for was replaced. The same critique found that Home's year heatmap readout stays at the top of its column, so pointing at the September to November rows leaves it above the screen.

## What Changes

- When Solar, Impact or True-Up drop a range, or Solar drops a day, the redirect adds `unshown=1` to the address. The page then shows one line under its title that names what it shows instead, for example "That link asked for dates the site doesn't have, so this shows November 2026."
- Once the page has shown that line, it removes `unshown` from the address, so a reload or a copied link shows the page without it.
- On screens 768 pixels wide or more, the year chapter's side column (its description, day readout and shares) stays in view while the visitor scrolls the year chart. Phones are unchanged.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `solar-range-chart`: "Default and invalid ranges" adds the `unshown` marker and the notice; its redirect scenarios expect the marker.
- `solar-day-view`: "The open day is in the address" adds the marker to its day redirect.
- `impact-report`: "Default and invalid ranges" adds the marker and the notice.
- `true-up-tracker`: "Default and invalid ranges" adds the marker and the notice.
- `home-story`: "A day from the year" adds that the readout stays in view on wide screens.

## Impact

- `lib/solar/ranges.ts` (`dropUnshown`) and its tests.
- `app/solar/page.tsx`, `app/impact/page.tsx`, `app/true-up/page.tsx` and their tests: read `unshown` and pass it on.
- `components/solar/solar-page.tsx`, `components/impact/impact-page.tsx`, `components/true-up/true-up-page.tsx` and their tests: the notice.
- `components/home/year.tsx` and its test: the sticky side column.
- No new route, dependency, data or env var.
