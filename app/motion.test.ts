import { readFileSync } from "node:fs";
import { expect, test } from "vitest";

const css = readFileSync(new URL("./motion.css", import.meta.url), "utf8");
const reduced = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"));

// site-motion: the timings the owner chose on the prototype.
test("enter takes 450 ms and a tween 400 ms, easing out", () => {
  expect(css).toMatch(/--motion-enter:\s*450ms/);
  expect(css).toMatch(/--motion-tween:\s*400ms/);
  expect(css).toMatch(/--motion-ease:\s*cubic-bezier\(\.2,\s*\.7,\s*\.2,\s*1\)/);
});

test("items start 15 ms apart, none later than 200 ms", () => {
  expect(css).toMatch(/min\(calc\(var\(--i, 0\) \* 15ms\), 200ms\)/);
});

test("a day step leaves in 150 ms and arrives in 250 ms, and the rest of the page holds still", () => {
  expect(css).toMatch(/::view-transition-old\(\.slide-next\)\s*{[^}]*150ms/);
  expect(css).toMatch(/::view-transition-new\(\.slide-next\)\s*{[^}]*250ms/);
  expect(css).toMatch(/::view-transition-old\(root\),\s*::view-transition-new\(root\)\s*{\s*animation: none/);
});

test("reduced motion turns every motion class and every view transition off", () => {
  expect(reduced.length).toBeLessThan(css.length);
  const classes = new Set(css.slice(0, css.length - reduced.length).match(/\.motion-[a-z-]+/g));
  expect(classes.size).toBeGreaterThan(0);
  for (const name of classes) expect(reduced).toContain(name);
  expect(reduced).toMatch(/::view-transition-group\(\*\)/);
});

// dashboard-shell, "The highlight and the page move together": the highlight glides in the page's 250 ms.
test("the tab highlight glides in 250 ms, easing out", () => {
  expect(css).toMatch(/::view-transition-group\(nav-highlight\)\s*{[^}]*animation-duration: 250ms;[^}]*animation-timing-function: var\(--motion-ease\)/);
});
