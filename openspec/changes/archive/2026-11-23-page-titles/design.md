# Design

## Context

The layout exports `metadata = { title: "Tesla Solar Report" }`, which every page inherits. Pages render per request (`dynamic = "force-dynamic"`) and read their range from `searchParams`. Impact's and True-Up's default ranges come from the database: Impact shows yesterday when today's solar still reads 0.0 kWh, and True-Up's current year comes from `trueUpYears`.

## Goals / Non-Goals

**Goals:**
- The title always names the range the page shows.
- No extra database query per request.

**Non-Goals:**
- No change to anything visible on a page.
- No titles for the API routes, or a new not-found page.

## Decisions

**Next's metadata API, not a `<title>` rendered in the page.**
- The layout's title becomes `{ default: "Tesla Solar Report", template: "%s · Tesla Solar Report" }`.
- Each page exports its part: a static `metadata` where there's no range, or `generateMetadata` reading the same `searchParams`.
- React 19 can hoist a `<title>` from a component, but alongside the layout's metadata it would give two titles.

**Impact and True-Up share their database lookups with their metadata through React's `cache`.**
- They're keyed by primitive arguments (today's date and the readings for Impact's today figures, today's date for `trueUpYears`), so `generateMetadata` and the page get one query per request between them.
- The rule picking the shown range moves into one function per page that both call, so the title can't disagree with the page.
- Solar, Impact and True-Up read today's date through a `cache` too, so a request at the site's midnight gives the title and the page the same day.
- None of this sharing is testable in Vitest: `cache` only memoizes in React's server build. The tests check the titles; the sharing rests on Next rendering metadata and the page in one request.

**`rangeTitle(range)` in `lib/solar/ranges.ts`.**
- It handles the whole calendar year and true-up year, and otherwise uses `rangeLabel` (a whole month by name, else `datesLabel` short).
- The true-up year uses the existing `trueUpName`.
- `rangeNames` keeps its own wording, since a sentence says "in November so far".

**The hidden h1s.**
- Distribution's is an `sr-only` "Distribution" at the top of its component, outside the scene, so the scene's styling and layout are untouched.
- Solar's day view's is an `sr-only` h1 at the top of `DayPanel`, using the day button's `dayLabel` format. The button stays the visible date, and a hidden h1 leaves the layout alone.

## Risks / Trade-offs

- **[Risk] A client-side range change must update the title.** A range change is a navigation that re-renders the page on the server, so Next sends the new metadata with it. Mitigation: check in the browser that the tab title follows a preset.
