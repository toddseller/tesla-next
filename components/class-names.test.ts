import { globSync, readFileSync } from "node:fs";
import { expect, test } from "vitest";

// Tailwind only builds a class it finds as a whole word in the source, so `fill-solar/25${…}` silently drops
// fill-solar/25 from the CSS; the tests' browser applies no Tailwind, so only this catches it. A name ending in "-"
// (`scene-label-${align}`) is completed by its expression on purpose.
const glued = (source: string) =>
  [...source.matchAll(/className=\{`([^`]*)`\}/g)].map(([, classes]) => classes).filter((classes) => /[\w/\]%)]\$\{/.test(classes));

test("finds a class name run into an expression", () => {
  expect(glued('<path className={`fill-solar/25${entering ? " motion-rise" : ""}`} />')).toHaveLength(1);
  expect(glued('<path className={`${stroke} motion-tween ${entering ? "motion-sweep" : ""}`} />')).toEqual([]);
  expect(glued('<span className={`scene-label scene-label-${label.align}`} />')).toEqual([]);
});

test("no component runs a class name into an expression", () => {
  const offenders = globSync("components/**/*.tsx").filter((file) => !file.endsWith(".test.tsx"))
    .flatMap((file) => glued(readFileSync(file, "utf8")).map((classes) => `${file}: ${classes}`));
  expect(offenders).toEqual([]);
});
