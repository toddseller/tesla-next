// @vitest-environment jsdom
// A chapter's way into its page (home-story spec, "Every chapter is a doorway"): it has to look like a link, not a caption.
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { Doorway } from "./doorway";

afterEach(cleanup);

test("a link named by its words alone, with an arrow that screen readers skip", () => {
  render(<Doorway href="/top">Every top ten</Doorway>);
  const link = screen.getByRole("link", { name: "Every top ten" });
  expect(link.getAttribute("href")).toBe("/top");
  expect(link.querySelector('svg[aria-hidden="true"]')).not.toBeNull();
});
