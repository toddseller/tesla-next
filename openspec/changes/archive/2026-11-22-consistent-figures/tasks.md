## 1. Expected solar to a tenth

- [x] 1.1 `lib/forecast.test.ts`: a day its hours cover expects their sum to a tenth (18.43 gives 18.4, not 19), a day without hours its daily model's figure to a tenth (33.0), and the expected by now never passes the day's. Verify it fails, change `forecastCard`'s day expected in `lib/forecast.ts` (drop the round-up, round the daily model to a tenth), verify it passes; update `app/api/forecast/route.test.ts`
- [x] 1.2 `components/solar/forecast.test.tsx`: today's tile reads "31.4 kWh expected" and its aria label the same, a day ahead's tile "14.2 kWh". Verify it fails, format with one decimal in `components/solar/forecast.tsx`, verify it passes
- [x] 1.3 `components/solar/day-view.test.tsx`: Total Generated reads "of 64.4 kWh expected (40%)" and today's "of 34.2 kWh expected". Verify it fails, show the sum to a tenth in `components/solar/day-view.tsx`, verify it passes
- [x] 1.4 `components/home/today.test.tsx`: the days ahead read "Sun 22.4 kWh · Mon 27.0 kWh · Tue 16.1 kWh", and without hours the day's expected comes from the card as it is. Verify it fails, implement, verify it passes

## 2. The house, with or without the car

- [x] 2.1 `components/home/today.test.tsx`: the house's figure is labelled "used by the house, car apart". Verify it fails, implement, verify it passes
- [x] 2.2 `lib/solar/day-views.test.ts` (or the day view's test): the Home view's headline reads "Total Usage, car apart" with vehicle data and "Total Usage" without. Verify it fails, implement in `lib/solar/day-views.ts`, verify it passes
- [x] 2.3 Impact's sections test: the Solar Offset bar is named "Home, car included". Verify it fails, implement in `components/impact/sections.tsx`, verify it passes
- [x] 2.4 `components/solar/range-chart.test.tsx`: the legend and a bar's details name "House, car included". Verify it fails, implement in `components/solar/range-chart.tsx`, verify it passes
- [x] 2.5 `components/home/year.test.tsx` and `since.test.tsx`: the shares read under "Where the house's energy came from in 2026, car included", and Since 2021's legend names "house used, car included". Verify they fail, implement, verify they pass

## 3. Outage lengths in days and hours

- [x] 3.1 `components/top-ten/entries.test.ts` and `ranking.test.tsx`: the outage record reads 2 d 4 h, 16 h 54 m ahead of #2, and the second 1 d 11 h, ranked as before. Verify they fail, format with `duration()` in `components/top-ten/entries.ts`, verify they pass
- [x] 3.2 `components/home/records.test.tsx` and `chart-details.test.tsx`: the Longest outage tab reads "2 d 4 h on February 4, 2024", its rows and hover in days and hours, and `lib/home/records.test.ts` an outage tick of 52.3888 hours as "2 d 4 h" and 0 as "0". Verify they fail, implement in `components/home/records.tsx`, verify they pass

## 4. Labels that explain a figure

- [x] 4.1 `lib/true-up/text.test.ts` and the savings card's test: '25 - '26 reads $5,576 saved of $6,694, Paid $1,118, "Solar saved $5,727, less the Powerwalls' $151", and the key "Powerwalls cost $151 on the bill"; the shown dollars add up for a year the Powerwalls saved money too. Verify they fail, implement in `lib/true-up/text.ts` and `components/true-up/savings-card.tsx`, verify they pass
- [x] 4.2 `lib/true-up/text.test.ts`: on 2026-11-08 the current year's VPP tile reads "Not started", 2027 season, runs May 1 to October 31; on 2027-06-10 with nothing marked, "$0", no events marked yet. Verify it fails, implement in `vppText`, verify it passes
- [x] 4.3 `components/home/since.test.tsx`: the true-up net reads its figure once, then "more imported than sent this true-up year, since October 1". Verify it fails, implement, verify it passes

## 5. Verify

- [x] 5.1 Full suite and `yarn build`; then on an onyx branch container against the production database, zoomed screenshots at 390 and 1440 of the Solar forecast tiles, a Solar day view, Impact's Solar Offset, the range chart's details, Top Ten's outages, True-Up's savings card and VPP tile, and the home page's Today, Records and Since 2021; verify by your OK on the screenshots before pushing
- [x] 5.2 Run `ponytail:ponytail-review` on the uncommitted diff in a fresh subagent, report the findings and wait for the pick before committing
