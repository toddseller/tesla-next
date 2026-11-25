# Design

## Context

`components/true-up/cycle-list.tsx` lays every cycle row and year row on one grid class, `ROW`: below `sm` it auto-fits 150px columns, and from `sm` it is five fixed columns (`minmax(0,1.3fr)` then four `1fr`). The cells are, in order, dates or year, imported, exported, net, then a charges cell only when the row has charges. A year is a `<details>` whose `<summary>` uses `ROW` too, and its cycles are a `<ul>` of `ROW` items under it. The heading lives in `components/true-up/true-up-page.tsx` as an uppercase, tracked `h2`.

## Goals / Non-Goals

**Goals:**
- One grid change that fixes every row on a phone without touching the five-column layout from `sm`.

**Non-Goals:**
- A different layout for year rows than for cycle rows. They keep sharing `ROW`.
- Changing `lib/true-up/text.ts` or any figure's wording.

## Decisions

**Charges move to second in the DOM, and `sm` places them last.** Below `sm`, `ROW` becomes `grid-cols-2`, so the first two cells (dates, charges) share line one and imported, exported and net flow two per line under them. From `sm`, the charges cell takes `sm:col-start-5 sm:row-start-1`; the grid places definite items first, so dates, imported, exported and net still auto-fill columns 1 to 4. Reading order becomes dates, charge, figures, which suits the charge being what people look for. Alternative: CSS `order` on a phone. Rejected: it leaves screen readers and copy-paste in a different order from what's on screen.

**The charges cell is always rendered, empty when there are none.** Otherwise a row without charges puts Imported beside the dates on a phone. An empty `<span>` keeps every row's cells in the same slots; the textContent tests don't change for it.

**`grid-cols-2`, not `grid-cols-[1fr_auto]`.** With an `auto` second column, Exported's left edge would move with each row's charge width. Equal halves keep the figures aligned down the list; the charge is right-aligned in its half.

**The estimate line balances.** In the right half (about 150px at 390) "est. $97.22 · PG&E net 372 kWh" still needs two lines; `text-balance` splits it evenly instead of stranding "kWh". Alternative: a non-breaking space in `estimateText`. Rejected: it changes `lib/` text and every test string that holds it, for the same result.

**Indent is `pl-5` on the dates cell of a year's cycles.** The chevron is 14px with `mr-1.5` (6px), so 20px puts each cycle's dates under the year's name. Only the dates cell moves, so the cycles' figures and charges stay in the year row's columns, as "Cycle list" asks. Alternative: `pl-5` on the year's `<ul>`, which also indents the rows' top borders. Rejected after the browser check: the narrower grid moved the cycles' columns 15px right of the year row's at 1440 and 20px on a phone. No tint, per the proposal.

**The unit is a plain-case span inside the `h2`.** `Billing cycles <span class="normal-case tracking-normal">in kWh</span>` keeps one heading, whose accessible name reads "Billing cycles in kWh", and stops `uppercase` from printing "KWH".

## Risks / Trade-offs

- [Dates get half a phone row, so "Nov 3 to Nov 25 (so far)" wraps to two lines, as it does today] → Accepted; the charge beside it is short, and giving dates more room would unalign the figures below.
- [An indented cycle's dates have 20px less room on a phone, so more of them wrap] → Accepted; the dates already wrap in half a row, and the figures below keep their full half.
