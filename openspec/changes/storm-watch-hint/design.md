# Design

## Context

`components/top-bar.tsx` renders the grid pill as a plain span whose text comes from `gridPill` (`lib/live-status.ts`): STORM WATCH, OFF GRID (SINCE ...) or OFF GRID TEST, styled per kind. `components/term.tsx` already has `Term`, a popover button with a dotted underline, and `lib/terms.ts` already holds the `storm-watch` definition the True-Up page and the day view use. The pill sits in the live status `<p>`, which is `whitespace-nowrap` and 13px mono.

## Goals / Non-Goals

**Goals:**
- The pill's STORM WATCH opens the existing definition, the same way every other hint does.

**Non-Goals:**
- A new term or a second wording of the definition.
- Changing the pill's color, size or text, or the OFF GRID pills.

## Decisions

- **`<Term name="storm-watch">` around the pill's text, inside the pill.** The pill's span stays as it is and its text becomes `Term`'s children when `grid.kind === "storm"`. This keeps the dotted underline every other hint has, so the pill reads as hinted the way the rest of the site's terms do, and `Term`'s button inherits the pill's amber and mono font (`text-inherit`, `font-[inherit]`).
  - *Alternative: make the whole pill the trigger.* A larger tap target, but `Term` would need a className or a second trigger style, and the pill would look like a button rather than a hinted word. Taken only if the phone check below fails.
  - *Alternative: `WithTerm` on the pill text.* It matches the term case-sensitively ("Storm watch"), so it would never find "STORM WATCH"; and the pill is one term, not a sentence.
- **The button's name is "STORM WATCH", as written.** The spec asks for a button named by the term as written; the popover itself is labeled by the term's own name, "Storm watch".

## Risks / Trade-offs

- [The trigger is the text only, about 20px tall inside a pill about 26px tall] -> Check at 390px that it can be tapped; the pill's padding and the gap to the next pill keep it apart from other targets (WCAG 2.5.8's spacing exception). If it can't be tapped reliably, take the whole-pill alternative.
- [The popover opens from a `whitespace-nowrap` row] -> `PopoverContent` is portaled and sets its own width, so the nowrap doesn't reach it; check that the definition wraps.
- [Two storm watch hints on True-Up during storm watch] -> Accepted by the `term-hints` delta: the top bar is outside the page's count.
