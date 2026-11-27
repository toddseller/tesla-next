# Proposal

## Why

On a 390 x 844 phone, Home's first screen is meant to reach today's solar so far, but it only does for a short live sentence: a three-line sentence already ends Today's first figure at 846 px, and the longest the sentence gets (five lines, with the Powerwalls supplying, an export to PG&E and the car charging) ends it about 65 px below the fold. The weather sentence from `outside-now` kept parity but couldn't fix this.

## What Changes

- **Smaller type on phones only** (below 768 px), as the "Phone fold mockups" canvas (https://claude.ai/artifact/1o9GVeJVFtS34FFZJmZUuT), board A, shows:
  - The page's opening line from 18 px to 16 px, with 16 px under it instead of 24 px.
  - Every chapter word (Now, Today, the year, Records, Habits, Since 2021) from 64 px to 52 px, so the chapters keep one size.
  - Now's live sentence from 20 px to 18 px, so the longest sentence takes four lines instead of five.
- **The first-screen requirement covers the longest sentence**, not just a typical one.
- **DESIGN.md's `chapter-word-phone` token** moves to 52 px, with its sidecar.
- **Unchanged:** every size from 768 px up, the scene, the weather sentence and its parity rule, and the order of everything on the page.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `home-story`: the first screen on a phone holds for the longest live sentence.

## Impact

- **Code:** `app/page.tsx` (the opening line), `components/home/now.tsx` (the chapter word and the live sentence), and the chapter words in `components/home/today.tsx`, `year.tsx`, `records.tsx`, `habits.tsx` and `since.tsx`.
- **Design system:** `DESIGN.md` (`chapter-word-phone`) and `.impeccable/design.json` (its token and the chapter component's CSS).
- **No data, API or env changes.**
