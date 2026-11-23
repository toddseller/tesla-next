# Proposal

## Why

Every page's browser tab, history entry and bookmark reads "Tesla Solar Report", so two tabs or two bookmarks of the site can't be told apart, and a screen reader's page list names none of them. Distribution is also the only page without an h1, so its document has no top heading. The 2026-11-22 design check (round 2, step 5) asked for pages to work as documents. Solar's h1 already comes before its h2 since `lead-sentences`.

## What Changes

- Each page gets its own title: the page name, its range when it has one, then "Tesla Solar Report", joined by " · ". The home page keeps "Tesla Solar Report".
- A range is named in its short form: a whole month "November 2026", a calendar year "2026", a true-up year "'26 - '27", and a day or any other span in the short dates the range buttons use ("Nov 14, 2026", "Oct 1 – 15, 2026").
- Solar's day view names its day; Impact names the range it shows, yesterday included when today has no solar yet.
- Distribution gets a visually hidden h1, "Distribution", so its scene stays as it is. Solar's day view, whose only heading is now the day button, gets one too, naming its day ("Solar on Sat, Nov 14, 2026").

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `dashboard-shell`: adds each page's title and each page's h1.

## Impact

- `app/layout.tsx`: the title template.
- `app/*/page.tsx`: a `generateMetadata` on Solar, Impact and True-Up; a static title on Distribution, Patterns, Top Ten and Admin.
- `lib/solar/ranges.ts`: a helper naming a range for a title.
- `components/scene/distribution.tsx` and `components/solar/day-panel.tsx`: the hidden h1s.
- No visible change to any page.
