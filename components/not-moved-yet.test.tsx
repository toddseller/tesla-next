// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { NotMovedYet } from "./not-moved-yet";

test("names the page and links to it on the live site", () => {
  render(<NotMovedYet name="True-Up Tracker" path="/true-up" />);
  expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("True-Up Tracker");
  expect(screen.getByRole("link").getAttribute("href")).toBe("https://teslasolar.report/true-up");
});
