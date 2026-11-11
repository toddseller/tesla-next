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

// dashboard-shell, "The menus' motion": the Pages button's bars cross into an X while its menu is open.
test("the Pages bars turn in 200 ms, easing out, into an X while the menu is open", () => {
  expect(css).toMatch(/\.motion-burger\s*{[^}]*transition: transform 200ms var\(--motion-ease\), opacity 200ms var\(--motion-ease\)/);
  expect(css).toMatch(/\[data-state="open"\] > \.motion-burger:nth-child\(1\)\s*{\s*transform: rotate\(45deg\)/);
  expect(css).toMatch(/\[data-state="open"\] > \.motion-burger:nth-child\(2\)\s*{\s*opacity: 0;/);
  expect(css).toMatch(/\[data-state="open"\] > \.motion-burger:nth-child\(3\)\s*{\s*transform: rotate\(-45deg\)/);
});

test("reduced motion turns the menus' fade and grow off", () => {
  expect(reduced).toMatch(/\[data-slot="popover-content"\]/);
});

// site-motion, "The Payback card tells its story": its pieces move only by clip-path, opacity and transform; they wait
// hidden until the card is in view, but show without JavaScript or with reduced motion.
test("the Payback story's classes reveal by clip-path, scale and opacity, and reduced motion lists them", () => {
  expect(css).toMatch(/@keyframes motion-stretch\s*{\s*from\s*{\s*clip-path: inset\(0 100% 0 0\)/);
  expect(css).toMatch(/@keyframes motion-drop\s*{\s*from\s*{\s*clip-path: inset\(0 0 100% 0\)/);
  expect(css).toMatch(/@keyframes motion-raise\s*{\s*from\s*{\s*transform: scaleY\(0\)/);
  expect(css).toMatch(/@keyframes motion-land\s*{[^}]*from\s*{\s*opacity: 0;\s*scale: \.3;\s*}\s*60%\s*{\s*opacity: 1;\s*scale: 1\.12;/);
  expect(css).toMatch(/@keyframes motion-grow\s*{[^}]*from\s*{\s*opacity: 0;\s*scale: \.85;\s*}\s*40%\s*{\s*opacity: 1;\s*}\s*55%\s*{\s*scale: var\(--peak\);/);
  for (const name of [".motion-stretch", ".motion-drop", ".motion-raise", ".motion-land", ".motion-grow", ".motion-waiting"]) expect(reduced).toContain(name);
});

test("waiting pieces are hidden, and shown again without JavaScript and under reduced motion", () => {
  expect(css).toMatch(/\.motion-waiting\s*{\s*opacity: 0;\s*}/);
  expect(css).toMatch(/@media \(scripting: none\)\s*{\s*\.motion-waiting\s*{\s*opacity: 1;\s*}/);
  expect(reduced).toMatch(/\.motion-waiting\s*{\s*opacity: 1;\s*}/);
});

// site-motion, "The Payback card tells its story": solar's month fades in as its connector shrinks.
test("the month fades in, and the solar connector raises then shrinks to its --shrink, from its foot", () => {
  expect(css).toMatch(/@keyframes motion-fade\s*{\s*from\s*{\s*opacity: 0;/);
  expect(css).toMatch(/@keyframes motion-shrink\s*{\s*to\s*{\s*transform: scaleY\(var\(--shrink\)\);/);
  expect(css).toMatch(/\.motion-raise-shrink\s*{[^}]*animation-name: motion-raise, motion-shrink;[^}]*animation-fill-mode: both, forwards;[^}]*transform-origin: bottom;/);
  for (const name of [".motion-fade", ".motion-raise-shrink"]) expect(reduced).toContain(name);
});

// A clip-path can't be blended into "none": a reveal with only a start state shows it for half its time, then jumps to
// the end. Both the Payback line's reveals end at an inset() shape, so the browser draws them across their time.
test("the Payback line's reveals end at a clip-path shape the browser can blend into", () => {
  expect(css).toMatch(/@keyframes motion-stretch\s*{\s*from\s*{\s*clip-path: inset\(0 100% 0 0\);\s*}\s*to\s*{\s*clip-path: inset\(0 0 0 0\);\s*}/);
  expect(css).toMatch(/@keyframes motion-drop\s*{\s*from\s*{\s*clip-path: inset\(0 0 100% 0\);\s*}\s*to\s*{\s*clip-path: inset\(0 0 0 0\);\s*}/);
});

// site-motion, "Charts draw in when the view changes": horizontal bars uncover from their left end. The reveal used to
// give only a start state, so the bars showed nothing, then all of themselves at once, 225 ms in.
// A bar that shows only part of itself, like the forecast's fill, gives the share it keeps covered as --hidden.
test("horizontal bars uncover to a shape the browser can blend into, keeping their rounded ends", () => {
  expect(css).toMatch(/@keyframes motion-uncover\s*{\s*from\s*{\s*clip-path: inset\(0 100% 0 0 round 4px\);\s*}\s*to\s*{\s*clip-path: inset\(0 var\(--hidden, 0%\) 0 0 round 4px\);\s*}/);
});
