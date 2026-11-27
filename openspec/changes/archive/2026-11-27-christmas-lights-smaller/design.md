# Design

## Context

See proposal.md for why and the delta spec for the behavior. What shapes the approach:

- The bulb shape is one `<g id="scene-bulb" class="scene-bulb-shape">` in the bulbs layer's `<defs>`, drawn with its socket at (0, 0) and 15 stage units tall, and placed 64 times through `<use>`; the layer's `<use>` copies draw it. `scene.css` scales it with container queries on the stage: 1.5x at 640 px or less, 2x at 480 px or less.
- A CSS transform on the shape takes effect when the page first draws; browsers don't redraw the copies when it changes later. Size previews and checks must therefore set the size before the first draw and measure the drawn pixels, not the computed style (the `christmas-lights` change's checks read the computed style).
- The renders that settled the sizes drew the bulbs over a bulb-free night screenshot at 1x and 0.75x on a 1440 px desktop and 2x, 1x and 0.5x on a 390 px phone.

## Goals / Non-Goals

**Goals:**
- 0.75 of today's bulb on wider screens, the unscaled bulb on a phone, from the first draw.

**Non-Goals:**
- Moving, adding or recoloring bulbs, or changing the halo.

## Decisions

### Two rules on the shape

`.scene-bulb-shape { transform: scale(0.75); }` everywhere, and `@container (max-width: 480px) { .scene-bulb-shape { transform: none; } }` for a phone-sized stage; the 640 px and 2x rules go. Scaling the shape, not each placed `<use>`, keeps every bulb growing from its socket in its place, as the `christmas-lights` change found.

Alternative: redraw the path at 0.75 and scale it back up on a phone. Two edits to the shape's numbers for the same result, and a less obvious phone rule.

### 480 px as a phone

The stage is 480 px or less on phones (322 px on a 390 px phone) and wider on tablets and desktops, the step `christmas-lights` already used for its 2x scale; a tablet takes the desktop's 0.75.

## Risks / Trade-offs

- [The phone's bulbs, a third larger than the desktop's against the house, step down to 0.75 just past 480 px] → Chosen in the renders; the step falls between phones and tablets.
- [A check that reads the computed style passes while the drawn size is wrong] → The check measures drawn pixels in a fresh page per size.

## Migration Plan

Release as usual (ask first). Verify on teslasolar.report by replaying 2025-12-20 at 9 PM at 1440 and 390 px in a fresh page and measuring a bulb's drawn height.
