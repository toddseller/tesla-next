# Design

## Context

See proposal.md, Why. The replay bar's showing and hiding (`components/scene/distribution.tsx`) and the "Today so far" block (`components/scene/today-so-far.tsx`) are both ported behavior with specs in `scene-replay` and `live-flow-scene`. The block decides it is on a phone with `matchMedia("(max-width: 639px)")` after mounting, and also carries `sm:hidden`.

## Goals / Non-Goals

**Goals:** replay controls in sight on a desktop at rest; the same totals at every width.

**Non-Goals:** changing the bar's placement, or when it shows on a phone; moving the totals beside the scene (the desktop scene is already as wide as the window's height allows).

## Decisions

- **Always shown on a desktop, by CSS alone.** The drawer drops `lg:translate-y-full`, so from 1024px it sits over the scene's bottom whatever `barShown` says, and the progress line gains `lg:hidden`. The on-demand state keeps running for narrower windows, untouched. Alternatives tried first: a small "▶ Replay · 3:42 PM" chip while the bar is hidden. By the line it was below a 1440 x 900 window (the scene's bottom runs past it, card bottom at y=1011); at the top right it showed, but the owner chose the plain always-shown bar over a sign that points at it.
- **Today so far loses its phone gate.** Deleting `TodaySoFar`'s `matchMedia` wrapper and `sm:hidden` makes the block render everywhere; the grid becomes `grid-cols-2 sm:grid-cols-4 lg:grid-cols-7`. With the gate gone, the server and browser no longer disagree about the first render, so nothing needs to wait for mount.

## Risks / Trade-offs

- [At 1440 x 900 the scene's bottom, and the always-shown bar with it, runs about 110px past the window's edge] → the placement is unchanged by choice; in taller windows, and after a short scroll, the bar is in view at all times.

- [Wide screens now fetch `/api/intervals` on each visit and on each totals event] → the same request the home page makes on every visit; one small query per page.
- [Seven long labels such as "used by the house, car apart" in one row at 1024px] → labels wrap under their figures, as Home's Today does; checked in the browser at 1024 and 1440.
- [No mockup] → a small addition in an existing style, not a redesign; the owner checks it in the browser before push.
