// @vitest-environment jsdom
// dashboard-shell, "The highlight and the page move together": the page slides the way the tabs went, and only for a
// tab change.
import { act, cleanup, render, screen } from "@testing-library/react";
import { usePathname } from "next/navigation";
import { afterEach, expect, test, vi } from "vitest";
import { PageSlide, slidePage } from "./page-slide";

vi.mock("next/navigation", () => ({ usePathname: vi.fn(() => "/impact") }));
// The stand-in shows the slide the page content would get.
vi.mock("react", async (original) => ({
  ...(await original<typeof import("react")>()),
  ViewTransition: ({ default: slide, children }: { default: string; children: React.ReactNode }) => <div data-testid="slide" data-default={slide}>{children}</div>,
}));

afterEach(cleanup);

const page = () => <PageSlide><p>page</p></PageSlide>;
const slide = () => screen.getByTestId("slide").dataset.default;

test("without a tab change the page holds still", () => {
  render(page());
  expect(slide()).toBe("none");
});

test("a tab change slides the page its way until the new page arrives", () => {
  const { rerender } = render(page());
  act(() => slidePage("next"));
  expect(slide()).toBe("slide-next");
  vi.mocked(usePathname).mockReturnValue("/patterns");
  rerender(page());
  expect(slide()).toBe("none");
  act(() => slidePage("previous"));
  expect(slide()).toBe("slide-previous");
  vi.mocked(usePathname).mockReturnValue("/");
  rerender(page());
  expect(slide()).toBe("none");
});
