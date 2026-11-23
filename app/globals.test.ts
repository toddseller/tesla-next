import { readdirSync, readFileSync } from "node:fs";
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

// dashboard-shell, "Keyboard use": the ring color at full strength. At half strength the gray ring vanished on the
// dark field.
test("the focus ring is a 2px outline in the ring color at full strength, everywhere", () => {
  expect(css).toMatch(/:focus-visible\s*\{[^}]*outline:\s*2px solid var\(--ring\);[^}]*outline-offset:\s*2px;/);
  expect(css).not.toContain("outline-ring/50");
  const sources = ["../components/", "./"].flatMap((dir) => {
    const at = new URL(dir, import.meta.url);
    return (readdirSync(at, { recursive: true }) as string[]).filter((f) => /\.tsx?$/.test(f) && !f.includes(".test.")).map((f) => new URL(f, at));
  });
  const faint = sources.filter((file) => readFileSync(file, "utf8").includes("ring-ring/50")).map((file) => file.pathname.split("/").slice(-2).join("/"));
  expect(faint).toEqual([]);
});

// patterns-page, "The use steps": heavier use is lighter, as brighter means more on Home's year chart, so the busiest
// hours stand out on the dark card instead of sinking into it.
test("the house use steps are the seven blues, each lighter than the one before", () => {
  expect([1, 2, 3, 4, 5, 6, 7].map((n) => token(`use-${n}`))).toEqual(["#213C86", "#2F52B4", "#3E6AE1", "#6189E8", "#89AAEF", "#AFC6F5", "#D4E1FA"]);
});
