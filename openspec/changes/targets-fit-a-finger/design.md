# Design

## Context

See proposal.md, Why. The sizes below are measured against the classes and the critique's live check:

- `components/term.tsx`: the trigger is an inline button with no padding, as tall as its text (about 16px at 13px, 20px at 14px).
- `components/impact/backup-section.tsx`: four `Link`s to a day (event row, storm day, Longest, Closest call), plain text at 13 to 14px.
- `components/scene/replay-bar.tsx`: `IconButton` is `p-2` around 16 to 20px icons (32 to 36px); Day and Speed are `py-1` text-sm (about 30px); LIVE is `py-1` text-xs (about 26px); the range input is `h-1` with a 16px thumb.

DESIGN.md already sets 44px for navigation and 40px for segmented choices. Inline words in a sentence have had no rule.

## Goals / Non-Goals

**Goals:**
- One mechanism for "bigger tap area, same text" that the terms and the day links share.
- Phone-only growth for the replay bar; the overlaid desktop bar stays exactly as tall.

**Non-Goals:**
- 44px for inline words: in a 13px note with about 21px lines, a 44px area would cover the lines above and below.
- Changing the bar's layout beyond letting its wrap fall where the larger controls put it.

## Decisions

**A `tap-area` utility in `app/globals.css`.** It is `position: relative` plus an empty `::after` placed `inset: -6px 0`, so the box takes taps 6px above and below the text without taking layout space. A 13px inline box is about 16px tall, so it becomes about 28px; 14px text becomes about 32px. Term triggers and the four backup day links take the class. Alternatives: padding with matching negative margin (`py-1.5 -my-1.5`) also grows the box, but the focus ring and any hover fill grow with it, so a focused term would wear a ring 12px taller than its words; a shared class string exported from `term.tsx` would make `backup-section` import from the term component for styling. A named utility sits with the design system's tokens, where DESIGN.md can describe it.

**The replay bar grows with `max-lg:` classes.** `IconButton` gets `max-lg:size-11` centered; Day, Speed and LIVE get `max-lg:min-h-11`. At `lg` (1024) and up nothing changes, which keeps the Replay bar position requirement's desktop scenario true. At 390 the row wraps into two control rows (previous, Day, next on the first; play, Speed, LIVE on the second), as sketched in exploration: about 50px taller.

**The scrubber draws its own track.** The input becomes `max-lg:h-11` with a transparent background, so the whole 44px band takes touches, and the visible line moves to `::-webkit-slider-runnable-track` / `::-moz-range-track` at 4px. With a styled WebKit track the thumb needs `margin-top: -6px` to center on it. The track styling applies at every width, so desktop and phone draw the same line; only the input's height differs.

**Tests assert the classes.** jsdom has no layout, so unit tests check that the trigger, the day links and the bar's controls carry `tap-area` or the `max-lg:` size classes, as `range-controls.test.tsx` already does for its responsive classes. The pixel claims (24px, 44px, rows unchanged, desktop bar height unchanged, the tap 2px off the text landing) are checked in the browser with `getBoundingClientRect` and `elementFromPoint` at 390 and 1440, under `yarn build && yarn start`.

## Risks / Trade-offs

- [A term's `::after` reaches 6px into the lines above and below, so a tap there opens the hint] → those lines are plain text in every place a term sits, so the tap would otherwise do nothing; no two terms are stacked within 12px.
- [A term that wraps across two lines gets a `::after` spanning the box's bounding rectangle] → only "Peak (4 to 9 p.m.)" is long enough, in a tile wide enough that it doesn't wrap at 390; check it in the browser.
- [The thumb's `margin-top` is WebKit-only, and Firefox centers its thumb itself] → check the scrubber in Chrome and Firefox at 390 and 1440 during the browser check.
