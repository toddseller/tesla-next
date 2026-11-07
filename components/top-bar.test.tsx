// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { usePathname } from "next/navigation";
import { afterEach, expect, test, vi } from "vitest";
import { TopBar } from "./top-bar";

vi.mock("next/navigation", () => ({ usePathname: vi.fn() }));

afterEach(cleanup);

test.each([
  ["/", "Solar"],
  ["/true-up", "True-Up"],
])("on %s, lists the five pages and marks only %s as current", (path, current) => {
  vi.mocked(usePathname).mockReturnValue(path);
  render(<TopBar />);

  const home = screen.getByRole("link", { name: "Tesla Solar Report" });
  expect(home.getAttribute("href")).toBe("/");
  expect(home.querySelector("img")).not.toBeNull();

  const links = within(screen.getByRole("navigation", { name: "Pages" })).getAllByRole("link");
  expect(links.map((link) => [link.textContent, link.getAttribute("href")])).toEqual([
    ["Solar", "/"],
    ["Impact", "/impact"],
    ["Distribution", "/distribution"],
    ["True-Up", "/true-up"],
    ["Top Ten", "/top"],
  ]);
  expect(links.filter((link) => link.getAttribute("aria-current") === "page").map((link) => link.textContent)).toEqual([current]);
});
