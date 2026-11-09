// @vitest-environment jsdom
// A ranking's card on the live figures from mockup D + E, from the top-ten spec.
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";

import { dayEntries, outageEntries, solarEntries } from "@/components/top-ten/entries";
import { EXPORT_DAYS, OUTAGES, SOLAR } from "@/components/top-ten/fixtures";
import { Ranking } from "@/components/top-ten/ranking";

afterEach(cleanup);

const SOLAR_CARD = { record: "Best solar day", chart: "Top ten solar days", subtitle: "Most solar generated in a day", flow: "solar" } as const;
const EXPORT_CARD = { record: "Best export day", chart: "Top ten export days", subtitle: "Most energy sent to PG&E in a day", flow: "grid" } as const;

test("the record leads: its figure, full date, how long it has stood and its lead over #2", () => {
  render(<Ranking {...SOLAR_CARD} entries={solarEntries(SOLAR)} today="2026-11-08" />);
  const card = screen.getByRole("region", { name: "Best solar day" });
  expect(card.textContent).toContain("80.9kWh");
  expect(within(card).getByRole("link", { name: "Monday, June 13, 2022" }).getAttribute("href")).toBe("/?start=2022-06-01&end=2022-06-30&day=2022-06-13");
  expect(card.textContent).toContain("Record for 4 years, 4 months");
  expect(card.textContent).toContain("0.7 kWh ahead of #2");
  expect(within(card).getByRole("img", { name: /^Top ten solar days: #1 80\.9 kWh/ })).toBeTruthy();
});

test("#2 to #10 are links to their days", () => {
  render(<Ranking {...SOLAR_CARD} entries={solarEntries(SOLAR)} today="2026-11-08" />);
  const chips = within(screen.getByRole("list")).getAllByRole("link");
  expect(chips).toHaveLength(9);
  expect(chips[0].textContent).toBe("#280.2Jun 21, 2025");
  expect(chips[0].getAttribute("href")).toBe("/?start=2025-06-01&end=2025-06-30&day=2025-06-21");
});

test("this year's entries are marked, and exports read without a minus sign", () => {
  render(<Ranking {...EXPORT_CARD} entries={dayEntries(EXPORT_DAYS)} today="2026-11-08" />);
  const card = screen.getByRole("region", { name: "Best export day" });
  const marked = within(card).getAllByRole("listitem").filter((item) => item.textContent!.includes("this year"));
  expect(marked.map((item) => item.textContent)).toEqual(["#544.7Jul 16, 2026this year", "#843.4Jun 6, 2026this year", "#942.1Jul 14, 2026this year"]);
  expect(card.textContent).toContain("60.0kWh");
  expect(card.textContent).not.toContain("-");
});

test("an empty ranking says there is nothing to rank yet", () => {
  render(<Ranking {...SOLAR_CARD} entries={[]} today="2026-11-08" />);
  const card = screen.getByRole("region", { name: "Best solar day" });
  expect(card.textContent).toContain("Nothing to rank yet");
  expect(within(card).queryByRole("img")).toBeNull();
  expect(within(card).queryByRole("list")).toBeNull();
});

test("the outage record reads in hours", () => {
  render(<Ranking record="Longest outage" chart="Top ten outages" subtitle="Longest time off the grid" flow="powerwall" entries={outageEntries(OUTAGES)} today="2026-11-09" />);
  const card = screen.getByRole("region", { name: "Longest outage" });
  expect(card.textContent).toContain("52.3h");
  expect(within(card).getByRole("link", { name: "Sunday, February 4, 2024" }).getAttribute("href")).toBe("/?start=2024-02-01&end=2024-02-29&day=2024-02-04");
  expect(card.textContent).toContain("Record for 2 years, 9 months");
  expect(card.textContent).toContain("16.9 h ahead of #2");
  expect(within(card).getByRole("img", { name: /^Top ten outages: #1 52\.3 h Feb 4, 2024; #2 35\.4 h/ })).toBeTruthy();
});
