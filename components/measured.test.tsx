// @vitest-environment jsdom
// DESIGN.md's Mono Means Measured rule: a figure in Plex Mono, the words around it in the surrounding sans.
import { cleanup, render } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { Measured } from "./measured";

afterEach(cleanup);

const parts = (text: string) => {
  const { container } = render(<p><Measured text={text} /></p>);
  return [...container.querySelector("p")!.childNodes].map((n) => [n.textContent, n instanceof HTMLElement && n.className === "font-mono"]);
};

test("figures are mono and the words beside them aren't", () => {
  expect(parts("$30 cost on the bill")).toEqual([["$30", true], [" cost on the bill", false]]);
  expect(parts("About $9 less")).toEqual([["About ", false], ["$9", true], [" less", false]]);
  expect(parts("1,125.1 imported")).toEqual([["1,125.1", true], [" imported", false]]);
  expect(parts("$80.23 est.")).toEqual([["$80.23", true], [" est.", false]]);
});

test("a text with no figure is left as it is", () => {
  expect(parts("Not started")).toEqual([["Not started", false]]);
});

test("a comma after a figure stays with the words", () => {
  expect(parts("1,125, then 40")).toEqual([["1,125", true], [", then ", false], ["40", true]]);
});
