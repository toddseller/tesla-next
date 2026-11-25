# Tasks

## 1. The split

- [x] 1.1 In `components/home/now.test.tsx`, expect the chapter's section to have a `lg:grid-cols-` class and no `md:grid-cols-` class. See it fail.
- [x] 1.2 In `components/home/now.tsx`, change the section's `md:grid-cols-[...]` to `lg:grid-cols-[...]`; 1.1 passes.

## 2. The Year split

- [x] 2.1 In `components/home/year.test.tsx`, change the cap, sticky-column and phone-order checks to `max-lg:max-h-[50svh]`, `lg:sticky lg:top-6 lg:self-start`, `max-lg:contents` and `max-lg:-order-1`, and check the chapter's grid uses `lg:grid-cols-` and no `md:grid-cols-`. See them fail.
- [x] 2.2 In `components/home/year.tsx`, move those classes and the grid's from `md` to `lg`, leaving the heading's `md:` size; 2.1 passes.

## 3. Verify

- [x] 3.1 `yarn test` and `yarn build` (its type check) pass.
- [x] 3.2 In an onyx branch container under the production CSP: Home at 390 and 768 shows Now's scene under the sentence with its labels apart, and Year's readout above its chart capped at half the window; at 1024 and 1440 both sit beside. No sideways scroll on Home at 390, 768, 1023, 1024 and 1440. Then give the server's address for the OK before pushing.

## Workflow follow-up

- Fresh ponytail review of the diff, then the code commit, then `Archive now-stacks-below-1024` with specs synced, then the PR.
- Update the `critique-round-8` memory with the PR number.
