# Design

## Context

See proposal.md for why and the delta spec for the behavior. What shapes the approach:

- Measured on production at 390 x 844 on 2026-11-27: top bar to 107 px, opening line 139 to 247 px (three lines of 18 px on 28 px, 24 px under), Now's word 247 to 304 px, a three-line live sentence (20 px on 27.5 px) 316 to 399 px, the scene 419 to 672 px, Today's word 737 to 794 px, its first figure 810 to 846 px.
- The longest live sentence `nowSentence` produces is about 142 characters, five lines at 20 px; with `outside-now`'s weather line that puts the figure about 65 px past the fold.
- The chapter words are set per component as `text-[64px] ... md:text-[112px]`; DESIGN.md's Chapter Word Rule wants one size for all of them.
- Mockups: "Phone fold mockups" canvas, board A.

## Goals / Non-Goals

**Goals:**
- The longest sentence plus the weather line fits, with room: board A's arithmetic ends the figure near 831 px.

**Non-Goals:**
- Any change at 768 px and up, or to the top bar, the scene or the page's order.
- Shortening the sentence's words.

## Decisions

### Shrink type, not structure

Phone-only sizes: the opening line `text-base` (16 on 24) with `pb-4`, the chapter words `text-[52px]`, and the live sentence `text-lg` (18). Together they free about 68 px for the longest sentence: 20 px from the opening line, about 10 px from Now's word, about 38 px from one fewer sentence line, and another 10 px from Today's own word above its figure.

Alternative: hide the word "Now" on phones (board B). It lands exactly on the fold with no room and breaks the Chapter Word Rule.

### All chapter words move together

Every chapter word takes 52 px below `md`, not only Now and Today, so the Chapter Word Rule's single size holds; `chapter-word-phone` in DESIGN.md and its sidecar move to 52 px.

## Risks / Trade-offs

- [The opening line can still wrap to three lines at 16 px] → Its three lines are counted in the arithmetic.
- [jsdom can't measure layout] → The check is in a branch container: Playwright at 390 x 844, with the longest sentence written into the live sentence, measuring Today's first figure; and at 768 and 1440 px, confirming the sizes didn't change.

## Migration Plan

None beyond the usual: verify in an onyx branch container, give the URL for a manual check before pushing, and release when asked.

## Rollout

Released with outside-now as v2026.11.27.0 on 2026-11-27; its Deploy run passed, and the new container was up at 12:10 PM. At 12:12 PM, on teslasolar.report at 390 x 844, with a three-line live sentence and the weather sentence showing, Today's first figure ended at 798 px, inside the 844 px screen (846 px on the morning's release). The longest sentence had ended it at 822 px in the branch container. No console errors, and no sideways scrolling.
