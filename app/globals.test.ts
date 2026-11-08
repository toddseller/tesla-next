import { readFileSync } from "node:fs";
import { expect, test } from "vitest";

const css = readFileSync(new URL("./globals.css", import.meta.url), "utf8");
const token = (name: string) => css.match(new RegExp(`--color-${name}:\\s*(#[0-9A-Fa-f]{6})`))?.[1];

// dashboard-shell, "One color per energy flow": the Tesla app's colors, as anton-tesla-api-ws's day views use them.
test.each([
  ["solar", "#F7B500"],
  ["home", "#3E6AE1"],
  ["powerwall", "#31B76B"],
  ["grid", "#8E8E93"],
  ["vehicle", "#E8474F"],
])("%s is %s", (name, color) => {
  expect(token(name)).toBe(color);
});

test("filled areas use each flow's own color, so there is no separate grid fill", () => {
  expect(token("grid-fill")).toBeUndefined();
});
