# Tasks

## 1. Phone type sizes

- [x] 1.1 Test first (`components/home/now.test.tsx`, `app/page.test.tsx` and each chapter's test): below `md` Now's word and every other chapter word (Today, the year, Records, Habits, Since 2021) are 52 px and stay 112 px from `md`; Now's live sentence is 18 px below `md` and keeps its sizes from `md`; the page's opening line is 16 px with 16 px under it below `md` and keeps its sizes from `md`. See them fail on the current sizes, then change the classes in `components/home/now.tsx`, `today.tsx`, `year.tsx`, `records.tsx`, `habits.tsx`, `since.tsx` and `app/page.tsx`; the whole suite passes
- [x] 1.2 Move `chapter-word-phone` to 52 px in `DESIGN.md` and in `.impeccable/design.json` (the token's size and purpose, and the chapter component's CSS); verify no other 64 px chapter size remains with a search

## 2. Verify

- [x] 2.1 The whole suite passes, `yarn build` passes, and `openspec validate phone-first-screen --strict` passes
- [x] 2.2 In an onyx branch container reading production, with Playwright: at 390 x 844, write the spec's longest sentence into the live sentence with the weather sentence showing, and verify today's first figure ends above 844 px; at 768 x 1024 and 1440 x 900 verify the opening line, chapter words and live sentence keep their sizes; compare with the mockup (board A) and give the URL for the manual check before any push
- [x] 2.3 `ponytail:ponytail-review` on the uncommitted diff in a fresh subagent before the first commit, with its findings reported to choose from; chosen fixes go test first

## Workflow follow-up

- Commit the code, then archive the change (syncing the `home-story` delta) as `Archive phone-first-screen`, then open the PR; release only when asked.
