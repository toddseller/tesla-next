// The glossary (term-hints spec, "One definition per term"): each term once, with the words a page hints and what they mean.
import { expect, test } from "vitest";

import { TERMS } from "./terms";

test("the nine terms the spec names, each with its words and a definition of a sentence or two", () => {
  expect(Object.keys(TERMS).sort()).toEqual(["nem", "nem2", "nsc", "peak", "readings", "storm-watch", "true-up", "vpp", "westlight"]);
  for (const { term, definition } of Object.values(TERMS)) {
    expect(term.length).toBeGreaterThan(0);
    expect(definition).toMatch(/^[A-Z'].*\.$/);
  }
});

test("the true-up says how a year's label reads, and VPP states the rate the VPP tile uses", () => {
  expect(TERMS["true-up"].definition).toContain("2025\u201126 is October 2025 to September 2026");
  expect(TERMS.vpp.definition).toContain("$2 a kWh");
});

test("grid readings says which days Tesla under-read and what each choice of the switch shows", () => {
  expect(TERMS.readings.term).toBe("Grid readings");
  for (const words of ["October 6, 2023", "April 26, 2026", "Corrected", "As Tesla reported"]) expect(TERMS.readings.definition).toContain(words);
});
