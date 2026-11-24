# Design

## Context

See proposal.md, Why. `components/top-ten/timeline.tsx` places each dot with percentages (`left` by date, `top` by figure) in a plot that is always 200px tall but as wide as its card: about 265px on a 375px phone (237px for outages, whose axis is wider) and about 640px on a desktop. Whether two ranks collide depends on that width, so the percentages alone can't decide where a rank goes. The mockup that settled the approach (option B) worked in pixels at both widths.

## Goals / Non-Goals

**Goals:** every rank readable at any plot width, every dot at its exact date and figure.

**Non-Goals:** the axis, year marks, band, colors, ranking lists and the timeline's spoken description stay as they are. The "this year" caption can still be covered by a dot, as the last round accepted.

## Decisions

- **The plot measures its own width.** A `ResizeObserver` on the plot, read the way `components/scene/cloud-canvas.tsx` does (skipped where there is none), gives the width; the ranks are laid out from it and re-laid out when it changes. Until it is known (the server's HTML, before hydration) the dots show without ranks. They pop in anyway (`motion-pop`), so the ranks arriving a frame later reads as part of that. Alternative: lay out at an assumed phone width. Rejected, because on a desktop it would group and move ranks that have room.
- **The placement is one pure function, `placeRanks`, exported from `timeline.tsx`.** It takes the dots in pixels (rank, x, y) and the plot width, and returns labels (text, position, and the dot to draw a line to if moved). It is greedy in rank order, so the higher ranks get the best spots. The tests drive it with today's live positions, so they don't depend on layout in jsdom. Keeping it in `timeline.tsx` follows the file's single-component shape; it moves out only if something else needs it.
  - Dots within 6px of each other, counted transitively, form one group with one label: "7, 8, 10", commas because a middle dot reads as another marker.
  - A label first sits level with its group's first dot, 8px to its right (13px for #1 to clear the ring), or to its left when the right runs past the plot or collides.
  - A spot collides when it overlaps a label already placed, comes within 8px of a dot outside the group, or has such a dot level with it (within its 12px height) and within 16px across: twice the 8px to its own dot, so it can't read as that dot's. The last rule came from the branch build's check, where outage #9's rank sat between its dot and #8's at 1440px. Tried in order: level, then 12, 24 and 36px up and down, right before left at each step. A label may sit up to 8px past the top or bottom of the plot.
  - A label that moved off level gets a 1px line in the full muted foreground (fainter was hard to follow) from its dot to its nearer edge, in one `aria-hidden` SVG over the plot. If no spot is free, it stays level with no line.
- **Dots are 8px; #1 is 10px**, keeping its `ring-primary` ring. Ranks are 11px semibold mono in the foreground, as the dots' numbers were.
- **Ranks fade in with their dots.** A label takes `motion-pop` with its first rank's `--i`, so the order of the draw-in is unchanged.

## Risks / Trade-offs

- [Mono digit width is assumed (about 6.7px per character at 11px) rather than measured] → the 8px clearance absorbs small font differences; measuring each label would cost a second layout pass.
- [A busy cluster can push a label onto the axis line, as the phone outage cluster does] → it stays legible over the line; the list under the timeline names every entry.
- [Greedy placement isn't optimal for every arrangement] → with ten entries and today's data it finds a spot for every label; the fallback keeps an unplaced label level with its dot rather than lose it.
