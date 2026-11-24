# Proposal

## Why

The scorecard round on v2026.11.23.13 (2026-11-23) passed all 15 checks, and noted that '24 - '25's headline reads "'24 - '25 ended owing $555 at the true-up, $555 more than '23 - '24." It's correct, since '23 - '24 owed nothing, but "$555 more than" a year with nothing due reads oddly.

## What Changes

- **A past year's headline names a year before with nothing due as such**: "'24 - '25 ended owing $555 at the true-up, after nothing due in '23 - '24." A year with nothing due itself keeps "the same as" ("ended with nothing due at the true-up, the same as '23 - '24."), and every other comparison is unchanged.
- Also records the scorecard round (15 of 15) and marks check 11 (PR #84).
- Wording only, so no mockups.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `true-up-tracker`: "A past year's headline" says "after nothing due in <year>" when the year before owed nothing and the year shown did.

## Impact

- `lib/true-up/text.ts` (`pastHeadline`) and its tests.
