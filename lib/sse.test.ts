import { expect, test } from "vitest";
import { sseFrame } from "./sse";

test("frames a payload as a named event", () => {
  expect(sseFrame("live", '{"n":1}')).toBe('event: live\ndata: {"n":1}\n\n');
});

test("splits a multi-line payload into one data line per line", () => {
  expect(sseFrame("live", "a\nb")).toBe("event: live\ndata: a\ndata: b\n\n");
});
