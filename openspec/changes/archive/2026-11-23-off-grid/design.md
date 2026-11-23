# Design

## Context

`parseRange(params, fallback)` in `lib/solar/ranges.ts` returns the fallback both when no range was asked for and when the one asked for fails `dateError`, so the three pages can't tell the two apart today; Impact only compares the result with its fallback by identity. `parseDay` returns null for a missing or invalid day. The root layout already wraps every route, a 404 included, in the top bar and footer; the white comes from the inline style of Next's built-in not-found page, which sets the body's background.

## Goals / Non-Goals

**Goals:** an address never names a range or day other than the one shown; a dead address stays inside the site's look and leads back into the data.

**Non-Goals:** the other silent fallbacks named in the proposal; any change to which ranges are valid.

## Decisions

- **One check, called by each page before it reads data.** A function beside `parseRange` takes the page's path and its params and calls Next's `redirect()` when `start` or `end` is present and the pair is invalid (and, for Solar, when `day` is present and `parseDay` rejects it), rebuilding the query without those names from the params it was given. Each page calls it first in its default export. `generateMetadata` needs nothing: a redirect ends the request before a title matters. Alternative: middleware. Rejected, because the rules need `siteToday()` and the page's own params, and the pages already parse them.
- **307, not 308.** Validity moves with today (the 732-day horizon, Solar's day up to today), so an address rejected now can be valid later; a permanent redirect would be cached against it. `redirect()` from a server component gives 307.
- **`app/not-found.tsx` as a server component** rendering `today` for `PickADay` with `siteToday()`, as the home page does, so the day count matches. The address in the sentence comes from `usePathname()` in a small client component, because a not-found page receives no params and the request has no path header. Alternative: leave the path out of the sentence. Rejected; naming the address tells the visitor what went wrong.
- **Title "Not found".** The tab shouldn't say "Off-grid", which the top bar's OFF GRID pill uses for the real island status.
- **Copy stays off the top bar's words.** The heading plays on going off-grid; the page never shows a status pill or uses the scene's grid colors, so it can't be mistaken for the house being islanded.

## Risks / Trade-offs

- `/admin` calls `notFound()` for anyone who isn't the owner, so they'll now see "/admin isn't a page on the site". That keeps hiding the page, as intended. → None needed.
- A visitor on the 404 page during a real outage sees the OFF GRID pill and "You've gone off-grid" together. → Accepted; the sentence says the address isn't a page.
- A redirect loses what was asked for. → Accepted for now; a note was considered and left out.
