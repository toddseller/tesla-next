import { expect, test } from "vitest";
import { difference } from "./compare-top-ten.mjs";

const day = (date, net_grid) => ({ date, net_grid });
const answer = (solar, net_grid = [], months = []) => ({ data: [{ solar }, { net_grid }, { to_grid_months: months }] });
const NINE = Array.from({ length: 9 }, (_, i) => day(`Jun ${i + 1}, 2023`, -60 + i));

test("equal answers match, and fields Flask doesn't send are ignored", () => {
  const solar = [{ date: "Jun 13, 2022", solar: 80.9 }];
  expect(difference(answer(solar), answer([{ ...solar[0], day: "2022-06-13" }]))).toBeNull();
});

test("rows with figures that read the same to a tenth may come in either order", () => {
  const flask = [{ date: "May 20, 2022", solar: 78.61 }, { date: "Jun 16, 2024", solar: 78.58 }];
  expect(difference(answer(flask), answer([...flask].reverse()))).toBeNull();
});

test("a tie at 10th place may rank a different row", () => {
  expect(difference(answer([], [...NINE, day("Jul 1, 2023", -42.1)]), answer([], [...NINE, day("Jul 1, 2026", -42.1)]))).toBeNull();
});

test("a different row with the same figure above 10th place is a mismatch", () => {
  const [first, ...rest] = NINE;
  expect(difference(answer([], [first, ...rest]), answer([], [day("Jan 1, 2026", first.net_grid), ...rest]))).toBe(
    "net_grid[0][0].date: \"Jun 1, 2023\" vs \"Jan 1, 2026\"",
  );
});

test("a different figure is a mismatch", () => {
  const months = [day("May 2024", -510.1)];
  expect(difference(answer([], [], months), answer([], [], [day("May 2024", -510.2)]))).toBe("to_grid_months figures[0]: \"-510.1\" vs \"-510.2\"");
});
