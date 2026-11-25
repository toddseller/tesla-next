# Proposal

## Why

Several controls are smaller than a fingertip on a phone (critique round 9, P2 #2). Term hint triggers (the top bar's STORM WATCH, True-Up's glossary words, Grid readings) and the Impact backup list's date links have a tap area about 20px tall, below WCAG 2.5.8's 24px. The replay bar's controls are 26 to 32px, and its scrubber's track is 4px. Since round 8 the bar shows on every phone, so it is now a control people use there.

## What Changes

- A hinted term's tap area is at least 24px tall. Its text, underline and line height stay as they are.
- Each backup event's date link, and the summary's day links, have a tap area at least 24px tall, again with no change to the text or the row's height.
- Below 1024px the replay bar's controls (previous day, Day, next day, play and pause, Speed, LIVE) are each at least 44px tall, and the scrubber's input is 44px tall. Its track still draws as a thin line. The bar grows about 50px under the scene on phones.
- At 1024px and wider the replay bar stays as it is, since it sits over the scene there.

Out of scope: Top Ten's date links (32px, already over 24) and the other round 9 issues.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `term-hints`: a hinted term's tap area is at least 24px tall without changing how the sentence reads.
- `scene-replay`: below 1024px the replay bar's controls and scrubber are at least 44px tall.
- `backup-history`: the event list's and summary's day links have a tap area at least 24px tall.

## Impact

- `components/term.tsx`, `components/scene/replay-bar.tsx`, `components/impact/backup-section.tsx` and their tests.
- No API, data or dependency change.
