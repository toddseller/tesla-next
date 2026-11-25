# Design

## Context

`components/home/now.tsx` lays the chapter out as a grid that gets two columns, `minmax(0,26rem)` for the sentence and `minmax(0,1fr)` for the scene, from Tailwind's `md` (768). The page's content is the window less 64 pixels of padding, and the columns are 40 pixels apart. The scene's stage is 1600 by 930 with 256 of headroom, so it is about 0.74 as tall as it is wide.

| Window | Layout | Scene width |
|---|---|---|
| 390 | stacked | 358 |
| 768 | side by side today | 248 |
| 768 | stacked after | 704 |
| 1024 | side by side | 504 |
| 1440 | side by side | 680 |

## Goals / Non-Goals

**Goals:**
- The scene is never narrower than about 500 pixels when it sits beside the sentence.
- Nothing on Home scrolls sideways at 768.

**Non-Goals:**
- The breakpoints of the Home chapters other than Now and Year, the headings' and sentences' sizes, the scene itself.

## Decisions

- **Split at `lg` (1024), not `md`.** Only the grid's `md:grid-cols-[...]` becomes `lg:grid-cols-[...]`; the `md:` sizes on the heading, the sentence and the gap between them stay, as on the other chapters. Rejected: keeping the split at 768 with a narrower sentence column (18rem), which still leaves the scene about 376 pixels, too small for its labels.
- **No width cap when stacked.** At 1023 the stacked scene is about 960 wide and 710 tall, about what Distribution already shows at 1440.
- **Year splits at `lg` too.** At 768 the Year chapter's `minmax(0,34rem)` chart column and 56-pixel gap leave about 104 pixels beside the chart for the readout row's two 44-pixel day buttons and the date, which pushes the page 60 pixels wide; the live site does the same. Every layout class tied to that split moves from `md` to `lg` together: the grid, the chart's `max-md:max-h-[50svh]` cap, the column's `md:sticky md:top-6 md:self-start` and `max-md:contents`, and the `max-md:-order-1` that puts the explanation and the day card above the chart. Between 768 and 1023 the chapter then reads as it does on a 744 tablet today. The heading's `md:` size stays. Rejected: narrowing the chart column at `md`, which keeps a cramped readout beside a smaller chart.
- **Test the class.** jsdom has no layout, so `now.test.tsx` checks that the chapter's grid uses `lg:grid-cols-` and no `md:grid-cols-`, and `year.test.tsx`'s existing class checks move to their `lg` forms with one added for the grid, as other Home tests check classes. The widths themselves are checked in the browser.

## Risks / Trade-offs

- [A landscape tablet around 1000 by 700 sees the scene filling the screen under the sentence] → Accepted; the sentence above carries the figures and the scene scrolls into view.
