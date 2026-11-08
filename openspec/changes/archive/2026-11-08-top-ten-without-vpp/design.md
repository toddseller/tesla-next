# Design

## Context

See proposal.md for why. `lib/top-ten.ts` runs three queries over `data`: the solar days, the export days and the export months, each also returning rows within 0.1 kWh of the 10th so the tie rule can pick 10th place. `data.is_vpp` marks VPP days (anton sets it per day; every event since May 2024 is marked). The export figure already reads `is_vpp` through `gridOut` in `lib/range.ts`: on a day from April 27, 2026 a marked day's Powerwall export doesn't count, while a day before it with PG&E's readings takes the meter's export, which includes the event. That inconsistency is Flask's and is kept in the With view for parity.

The page (`app/top/page.tsx`) renders `TopTenPage` with `topTen()`; the page reloads through `useReload("/top", served)` and `/api/top-ten` on every `totals` event. The Solar page keeps its state in the address and uses `router.replace` for a choice that shouldn't add history (its day strip), and its presets are `aria-pressed` buttons (`components/solar/range-controls.tsx`).

## Goals / Non-Goals

**Goals:**
- One flag decides whether the export queries see VPP days, so the days, the months and the tie rule all agree.

**Non-Goals:**
- Taking the Powerwall's event exports out of a VPP day while keeping the day (decided while exploring: before April 27, 2026 Tesla's battery figure is about half of what the meter saw, so the subtraction would be a guess).
- Making the With view consistent across the meter fix; that changes Flask's answer and waits for 7b.
- The day after an event, whose overnight grid use lowers its net; it can only fall in the ranking.

## Decisions

**`topTen` takes whether to include VPP days.** The export days and months queries add `NOT is_vpp` to their `WHERE`, inside the 10th-place subqueries too, so the tie threshold is computed over the same days that are ranked. Leaving the month query's `WHERE` before its `GROUP BY` sums each month over its non-VPP days and drops a month with none. The solar query is untouched. Filtering the returned rows in TypeScript instead would rank from the wrong ten: the queries only return the top rows.

**The route's default stays Flask's.** `/api/top-ten` keeps answering with VPP days, so `scripts/compare-top-ten.mjs` keeps passing unchanged; `?vpp=without` leaves them out. The page's default is the other way round, which is the price of parity until 7b, when the route can follow the page.

**The address is the switch's state.** `app/top/page.tsx` reads `vpp` from `searchParams`, as the Solar page reads its range, and renders with the matching rankings. Choosing calls `router.replace`, so the server renders the other rankings and the back button leaves the page rather than flipping the switch. `useReload` is keyed by the address (`/top` or `/top?vpp=with`), so a reload answered for the other choice is dropped, and the reload URL follows the choice (`/api/top-ten?vpp=without` or `/api/top-ten`).

**The switch is two `aria-pressed` buttons,** styled as the Solar page's presets, placed in the page header, to the right of the title and subtitle on a wide screen and below them on a phone, where the other pages keep their toggles (chosen from the mockup's three placements, https://claude.ai/artifact/WBLSd38XXsnBbm8WTubkBa: above the export rankings, in the page header, beside the footnote). A native toggle or a new component isn't needed for two choices.

## Risks / Trade-offs

- [A VPP day isn't marked] → it ranks as an ordinary day. Every event since May 2024 is marked; the footnote says the rankings leave out marked event days, and marking a missed one fixes it at the next reload.
- [The page and the route have opposite defaults until 7b] → the route's parameter is named for what it does (`vpp=without`), and the README says so.

## Migration Plan

Release as usual. Nothing to roll back but the release; the database and anton are unchanged.

## Results

- **Before the pull request (November 8, 2026):** locally under `yarn build && yarn start`, on a throwaway database seeded with the mockup's solar days and the live export days, May 30 and July 23, 2024 marked as VPP days (#1 and #2 with them, May 2024 and July 2024 holding them): the production CSP was in force (no `'unsafe-eval'`) with no console message on `/top`. `/api/top-ten?vpp=without` led with May 21, 2025 and plain `/api/top-ten` with May 30, 2024. In Playwright's headless Chromium, `/top` showed Without VPP events pressed, May 21, 2025 (45.9 kWh) as the best export day, May 2025 as the best month and the "leave out" footnote; choosing With VPP events replaced the address with `/top?vpp=with` and showed May 30, 2024 at 60.0 kWh, July 2024 as the best month and the "include" footnote, while the solar record stayed June 13, 2022. Back from there returned to the page opened before `/top`. At 375 pixels the page was 375 wide with the switch full width under the subtitle; at 1280 it sat right of the title, as mockup B.
