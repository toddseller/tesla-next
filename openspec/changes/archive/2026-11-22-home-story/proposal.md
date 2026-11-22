# Proposal

## Why

The site opens on the Solar page: a forecast card and a month of bars. It answers "how much did the panels make", but not "what is the house doing right now", and it gives someone who isn't checking their own system no reason to stay. The site should tell the story its data holds, from this moment out to the years since October 2021, so people weighing solar and the curious explore it instead of landing and leaving. The same page should give a quick check its answer on the first phone screen. PRODUCT.md records this audience and the principles behind it.

## What Changes

- **`/` becomes the story page, "Now, then the long arc".** Six chapters, each widening the last, each in the visual form its data has so they tell apart before anyone reads, each headed by one oversized word and ending in a link to the page and range that hold its full data:
  1. **Now** (a network): under a status line built from facts the site already knows (live or stale, an outage, a storm watch, test mode), one sentence saying what supplies the house and what the Powerwalls and the car are doing, beside Distribution's own live house scene, without its replay controls. Links to Distribution.
  2. **Today** (a curve): solar filled up to now, the forecast dashed across the day with the hours to come dimmed, the Powerwalls charging and the grid exporting below zero; made against expected, expected by now and still to come, today's totals, and the next three days. Refreshes while open. Links to today on the Solar page.
  3. **The year** (a calendar): the year's solar by day and hour, one row per day, shaded by output, so seasons, cloudy runs and gaps show as shape; any year since 2021 from a switcher kept in the address; a row opens its day; the year's shares of the house as Impact gives them. Links to Impact.
  4. **Records** (extremes): tabs for the best solar day, the most sent to PG&E in a day and in a month, and the longest outage, each with its top five linking to their days and a staircase of how the record was beaten since 2021, "set N days ago". Links to Top Ten.
  5. **Habits** (a cycle): the always-on load by month, one line per year, this year highlighted, with the latest month against a year earlier and this year's Powerwall energy out. Links to Patterns.
  6. **Since 2021** (an accumulation): running totals of solar and the house's use by month since October 2021 with the payback years marked, years only, and the true-up net so far. Links to True-Up.
- **The page says what it is**: its one heading, above Now, says it shows one home's Tesla solar and Powerwalls, live and since October 22, 2021. Every chapter holds the same figures and words at every width.
- **Pick a day ends the page**: a date and a Random day button, each opening a day on the Solar page.
- **The Solar page moves to `/solar`**, unchanged: the forecast card, "Solar by date range" and the day views. **BREAKING** for addresses: old Solar addresses on `/` (any of `start`, `end`, `day`, `readings`) redirect permanently to the same view on `/solar`, so shared links and bookmarks keep working.
- **The top bar gains a page.** Seven links: Home (`/`), Solar (`/solar`), Impact, Distribution, True-Up, Top Ten, Patterns. Every link that opens a day or a range on the Solar page (Top Ten, Impact's backup events and closest call, the day view's own links) points to `/solar`.
- Every figure on the story page comes from the queries the other pages already use, with their rounding, so a chapter and the page it links to always agree. Words are captions: fixed wording filled with those figures. The new reads (solar by day and hour, records over time, running totals) are worked out from the same stored data.

Out of scope: a units or $ toggle, judgment rules ("solar is low today"), a second house drawing (Now reuses Distribution's scene component; its look and behavior stay governed by the scene's specs), any wording aimed at selling solar, any dollar figure, the Distribution page's phone layout and the other critique fixes (separate changes), and any write to the database.

## Capabilities

### New Capabilities
- `home-story`: the story page at `/`: its six chapters and Pick a day, each chapter's chart and figures and what it links to, the status line, the live and refreshed parts, the year switcher, and how each chapter reads when its data is missing, partial or at an edge.

### Modified Capabilities
- `dashboard-shell`: the top bar's links become seven, with Home at `/` and Solar at `/solar`, and the live pill shows solar and home only from 1440 pixels so the seven links keep one row.
- `solar-range-chart`: the range view lives at `/solar`; old range addresses on `/` redirect there.
- `solar-day-view`: the day view lives at `/solar?…&day=`; old day addresses on `/` redirect there.
- `solar-forecast`: the forecast card is on `/solar`; the story page's Today chapter shows today's and the next three days' expected kWh from the same figures. A day's expected kWh becomes the sum of its hours when the hourly forecast covers it, so the tile and "expected by now" can no longer disagree (today the Solar page shows 19 expected for the day beside 19.9 expected by now).
- `top-ten`: its date links open `/solar` rather than `/`.

## Impact

- New `app/page.tsx` (the story page) and `components/home/`; the current `app/page.tsx` moves to `app/solar/page.tsx`. Redirects for old addresses in the page or `next.config`, per design.
- `lib/solar/ranges.ts`'s `address` builds `/solar` addresses; every Solar link goes through it.
- `components/top-bar.tsx`: seven links, and the pill's flows from 1440 pixels; the phone menu and the bar are checked at 640, 1366 and 1440 pixels.
- Reads reused: `lib/live`, `lib/live-status` (`liveStatus`, `gridPill`), `lib/forecast`, `lib/intervals`, `lib/range`, `lib/impact`, `lib/top-ten`, `lib/patterns`, `lib/backup`, `lib/true-up`. Today reloads through `/api/forecast` and `/api/intervals`. New: a read of solar by day and hour for a year on `energy_interval`, with `GET /api/solar-hours?year=` for the switcher; records over time and running totals worked out from daily and monthly totals the site already reads.
- Tests: new page and component tests; moved Solar page tests; link tests in Top Ten and Impact; the top bar's tests.
- A page redesign, so it starts with mockups (phone and desktop). No new dependency, env var or version pin.
