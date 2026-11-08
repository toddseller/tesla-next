// The record's text and the Solar page links, from the top-ten spec.
import { expect, test } from "vitest";

import { dayEntries, held, lead, monthEntries, solarEntries } from "@/components/top-ten/entries";

test.each([
  ["2022-06-13", "4 years, 4 months"],
  ["2024-05-31", "2 years, 5 months"],
  ["2025-10-08", "1 year, 1 month"],
  ["2025-11-08", "1 year"],
  ["2026-06-01", "5 months"],
  ["2026-10-09", "less than a month"],
  ["2026-11-08", "less than a month"],
  // This month leading the export months: it counts from its last day, still to come.
  ["2026-11-30", "less than a month"],
])("a record set on %s has stood for %s on 2026-11-08", (since, text) => {
  expect(held(since, "2026-11-08")).toBe(text);
});

test("a solar day reads its figure, full date and Solar page link", () => {
  const [best] = solarEntries([{ date: "Jun 13, 2022", solar: 80.9, day: "2022-06-13" }]);
  expect(best).toMatchObject({
    rank: 1, value: "80.9", date: "Jun 13, 2022", long: "Monday, June 13, 2022", since: "2022-06-13",
    href: "/?start=2022-06-01&end=2022-06-30&day=2022-06-13",
  });
});

test("a solar figure reads as shown to a tenth, rounding a half to even", () => {
  expect(solarEntries([{ date: "Jun 13, 2022", solar: 80.25, day: "2022-06-13" }])[0].value).toBe("80.2");
});

test("an export day reads without a minus sign", () => {
  expect(dayEntries([{ date: "May 30, 2024", net_grid: -60.0, day: "2024-05-30" }])[0]).toMatchObject({ figure: 60, value: "60.0" });
});

test("an export month reads its month, has stood from its last day, and opens that month", () => {
  const [best] = monthEntries([{ date: "May 2024", net_grid: -510.1, month: "2024-05" }]);
  expect(best).toMatchObject({ value: "510.1", date: "May 2024", long: "May 2024", since: "2024-05-31", href: "/?start=2024-05-01&end=2024-05-31" });
});

test("the lead over #2 is the difference of the figures as shown", () => {
  expect(lead(solarEntries([{ date: "a", solar: 80.9, day: "2022-06-13" }, { date: "b", solar: 80.2, day: "2025-06-21" }]))).toBe("0.7");
  expect(lead(monthEntries([{ date: "a", net_grid: -510.1, month: "2024-05" }, { date: "b", net_grid: -479.2, month: "2024-04" }]))).toBe("30.9");
});
