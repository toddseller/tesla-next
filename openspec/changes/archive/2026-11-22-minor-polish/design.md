## Context

Nine small fixes from the live critique, each in its own component. Decisions below are the ones the code doesn't make obvious.

## Decisions

- **Figures in mono, words in sans, through one helper.** `Measured` wraps each figure in a text ("$30", "1,125.1", "$80.23") in Plex Mono and leaves the words in the surrounding sans. CountUp, used only by True-Up's savings card, renders through it, so the counting figure and its final text split the same way; the cycle list uses it for its net and charges. The texts themselves don't change, so neither do the specs or the text tests.
- **Top Ten's `Length` is shared, with em margins.** Impact's duration tiles use it. Its unit gaps were fixed pixels tuned for the 56px figure; they become em (the same pixels at 56px), so they scale to Impact's 22 to 28px.
- **One query for the home page.** The year switcher and the Records tabs both rewrite the address with `replaceState`; each now changes only its own parameter, so choosing a tab keeps `year` and choosing a year keeps `record`.
- **The status line goes, rather than moving.** The top bar is right above Now at every width, phone included, and already carries the live time and the off-grid and storm watch pill; Now's sentence already says when the live status is stale.
- **The top bar wraps by item, not inside the nav.** The nav stops wrapping internally, so at a width where the name, seven links and live status don't fit, the live status (the last item) takes its own row; from about 640 to 830 pixels the links take a row under the name.
- **The footer is a client component** so its links can mark the current page as the top bar does; its year is the same on server and browser but for the instant the year turns.
- **The focus ring is the ring token at full strength.** The base outline becomes `outline-ring` with a 2px solid outline offset 2px on `:focus-visible`, and the six `ring-ring/50` uses become `ring-ring`.
