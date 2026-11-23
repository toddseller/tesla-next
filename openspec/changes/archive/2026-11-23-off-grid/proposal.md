# Proposal

## Why

The 2026-11-23 design check (round 3) found two P1s. An address that isn't a page shows Next's default 404, which turns the page white in light mode and is the one place the site looks unbuilt. And a Solar, Impact or True-Up address with a range the page can't show (`/solar?start=banana`, a 2030 range) quietly shows the default range while keeping the bad address, so a shared link names something other than what it shows, against PRODUCT.md's promise that a link shows exactly what was shared.

## What Changes

- **A 404 page in the site's own voice.** Inside the usual nav and footer, on the dark field: the heading "You've gone off-grid" (as large as Pick a day's heading, so the h1 isn't the smaller), a sentence naming the address ("/nope isn't a page on the site, so nothing is flowing here."), the home page's Pick a day control, and a link back home. Its title is "Not found · Tesla Solar Report".
- **A range the page can't show redirects.** When Solar, Impact or True-Up is asked for a `start` or `end` that its "Default and invalid ranges" rule rejects, it redirects to its own address without `start` and `end`, keeping the other parameters, so the address names the default range it then shows. An address with neither still shows the default with no redirect.
- **A day the Solar page can't show redirects.** A `day` outside the day view's rule redirects to the address without `day`, keeping the range.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `dashboard-shell`: adds the page for an address that isn't one, and its title.
- `solar-range-chart`: an invalid range redirects instead of being shown at the bad address.
- `impact-report`: the same.
- `true-up-tracker`: the same.
- `solar-day-view`: an invalid `day` redirects instead of being ignored in place.

## Impact

- New `app/not-found.tsx`; `app/solar/page.tsx`, `app/impact/page.tsx`, `app/true-up/page.tsx`, a shared check beside `parseRange` in `lib/solar/ranges.ts`, with their tests.
- Out of scope: other parameters that fall back silently (home's `year`, Impact's `backup`, `readings`, Top Ten's `vpp`); a note on the page saying a redirect happened; clamping a range to the nearest valid days.
