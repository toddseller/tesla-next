# Design

## Context

- `components/top-bar.tsx` renders each flow as an inline `span` (`data-part="flow"`) holding the square (`inline-block size-2 align-middle`), the label, a space, the `Rolling` figure and " · ". The pill around it is plain inline text, and the live status `p` is a flex row with `items-center`, which is what centers the dot.
- Measured on teslasolar.report at 1366 px and 4x: the dot's middle is 0.25 px from the middle of "LIVE 9:41 AM"'s line, the solar square's is 1.14 px below its label's.

## Goals / Non-Goals

**Goals:**
- The squares sit on their labels' middle within half a pixel, as the dot does.

**Non-Goals:**
- Any change to the pill's text, spacing, width or the 1360 px cut-off.

## Decisions

**Center the pill's contents by flexbox, as the dot is.** The pill becomes `flex items-center`. Each flow inside it becomes `flex items-center` too, holding the square (`mr-1.5`, no `align-middle`) and one `span` with the label, its space and the figure; the Powerwall part is the pill's last item. Flex centering uses the line's middle, which is where the dot lands and where capitals and digits sit, at any zoom or font size. The pill is already a flex item of the live status row, so it is blockified (laid out as a block) either way and nothing around it moves.

Alternative: keep the inline layout and nudge the square up (`relative -top-px`). It's one class, but the offset is a number tuned to 13 px IBM Plex Mono, and it drifts at other zooms.

**The separator keeps its spaces with `whitespace-pre`.** In a flex container, spaces at the start or end of an item's text are dropped, so " · " as plain text would lose its spaces and the pill would narrow. The " · " becomes its own `span` with `whitespace-pre`. Its spaces stay exactly one mono space each, as today, and the text a screen reader or a test reads ("SOLAR 6.2 kW · ") doesn't change. The label and the figure share one inner `span`, so the space between them is ordinary inline text.

**Hiding still wins below 1360 px.** `max-[1360px]:hidden` is a variant, so Tailwind emits it after `flex`, and it sets `display: none` in narrow windows.

**The check is visual.** jsdom lays nothing out, so the tests can only pin the classes and the text. The alignment itself is checked in zoomed screenshots on the branch container, measured against the dot, before the owner's OK.

## Risks / Trade-offs

- [Only the flows were made flex at first: an inline flex group takes its baseline from its first item, and an empty square has none, so the browser would use the square's bottom edge and shift the group against "PW 92%".] → The pill itself is the flex row, so its items are centered and none of them is placed by a baseline. The zoomed check confirms the flows and the Powerwall part share one middle.

## Results

- **Branch container (task 3.2), 2026-11-11, 9:47 AM PST:** onyx, reading production read-only, through an SSH tunnel, in headless Chromium at 1366 px and 4x, beside teslasolar.report at the same moment (both reading SOLAR 4.7 kW · HOME 1.3 kW · PW 100% · STANDBY):

  | Middle of the mark minus middle of its text | Branch | teslasolar.report |
  |---|---|---|
  | Live dot | 0.25 px | 0.25 px |
  | Solar square | 0.25 px | 1.14 px |
  | Home square | 0.25 px | 1.14 px |

  - The labels and figures share the Powerwall part's middle (0 px apart) on both.
  - The pill is 409 px wide on both, with the same text, so " · " kept its spaces.
  - At 390 and 1280 px the live status still reads LIVE with the time and PW 100% · STANDBY alone.
