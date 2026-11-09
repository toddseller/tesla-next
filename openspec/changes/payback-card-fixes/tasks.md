## 1. Desktop timeline

- [x] 1.1 Test first: in `payback-card.test.tsx`, each marker's dot is centred on the track (their top plus half height agree) and has the card-coloured ring; run it and see it fail for the 5px gap, then share one line offset between the track and the dots so it passes
- [x] 1.2 Test first: with the whole system projected, a dashed segment runs from today to its year, and with it already paid there is none; see it fail, then draw the segment

## 2. Phone list

- [x] 2.1 Test first: every step but the last carries a rail, solar-coloured through today and grey after, and today's dot is a hollow ring; see it fail, then add the rail as in mockup PhoneB

## 3. Placement

- [x] 3.1 Test first: on a true-up year the Payback card follows the savings card and comes before the billing-cycle chart, and on All time it follows the tiles; see it fail, then move the card in `TrueUpPage`

## 4. Verify

- [x] 4.1 The whole suite passes, `tsc` is clean and `openspec validate payback-card-fixes --strict` passes
- [x] 4.2 Local `yarn build && yarn start` on a throwaway database with placeholder costs: at 1280 pixels the dots sit on the line with the dashed projection, at 375 pixels the rail joins the steps, the card follows the savings card, no sideways scrolling and no console errors
- [x] 4.3 `ponytail:ponytail-review` on the uncommitted diff before the first commit, with its findings reported for the owner to choose

## 5. Rollout

- [ ] 5.1 With the owner's go-ahead, release; the deploy's health check passes
- [ ] 5.2 On teslasolar.report at 1280 and 375 pixels the card matches 4.2's checks; record in design.md under Rollout

## Workflow follow-up

- Commit the code, then archive the change with its specs synced as a second commit, `Archive payback-card-fixes`, before opening the PR, which also carries the system-payback rollout record (e4729d4).
