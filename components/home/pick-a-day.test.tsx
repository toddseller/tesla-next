// @vitest-environment jsdom
// The home page's Pick a day (home-story spec, "Pick a day").
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { PickADay } from "./pick-a-day";

const push = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const TODAY = "2026-11-21";
const field = () => screen.getByLabelText("Date") as HTMLInputElement;

afterEach(() => {
  cleanup();
  push.mockClear();
});

test("an empty date field from October 22, 2021 to today; changing it alone opens nothing, submitting it opens the day", () => {
  render(<PickADay today={TODAY} />);
  expect([field().value, field().min, field().max]).toEqual(["", "2021-10-22", TODAY]);
  fireEvent.change(field(), { target: { value: "2024-02-04" } });
  expect(push).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Go" }));
  expect(push).toHaveBeenCalledWith("/solar?start=2024-02-01&end=2024-02-29&day=2024-02-04");
});

test("a date outside the span is refused with a message naming it", () => {
  render(<PickADay today={TODAY} />);
  fireEvent.change(field(), { target: { value: "2021-01-01" } });
  fireEvent.click(screen.getByRole("button", { name: "Go" }));
  expect(push).not.toHaveBeenCalled();
  expect(screen.getByRole("alert").textContent).toBe("Pick a day from October 22, 2021 to November 21, 2026.");
});

test("Random day opens a day picked from the span", () => {
  vi.spyOn(Math, "random").mockReturnValue(0.5);
  render(<PickADay today={TODAY} />);
  fireEvent.click(screen.getByRole("button", { name: "Random day" }));
  expect(push).toHaveBeenCalledWith("/solar?start=2024-05-01&end=2024-05-31&day=2024-05-07");
  vi.restoreAllMocks();
});

// DESIGN.md's type scale: the heading is 28px everywhere, the size of the figures around it, not a one-off 32px.
test("the heading is 28px at every width", () => {
  render(<PickADay today={TODAY} />);
  const heading = screen.getByRole("heading", { name: "Pick a day" });
  expect(heading.className).toContain("text-[28px]");
  expect(heading.className).not.toMatch(/md:text-\[/);
});

// Go is what the field is for, so it leads; Random day is the aside.
test("Go is the filled button and Random day the outlined one", () => {
  render(<PickADay today={TODAY} />);
  expect(screen.getByRole("button", { name: "Go" }).className).toContain("bg-foreground");
  const random = screen.getByRole("button", { name: "Random day" }).className;
  expect(random).toContain("border-input");
  expect(random).not.toContain("bg-foreground");
});

// The section aligns its two halves at the bottom, so a message growing the form would lift the buttons.
test("a refused date's message hangs under the form on wide screens, leaving the buttons where they were", () => {
  render(<PickADay today={TODAY} />);
  fireEvent.change(field(), { target: { value: "2021-01-01" } });
  fireEvent.click(screen.getByRole("button", { name: "Go" }));
  const alert = screen.getByRole("alert");
  expect(alert.className).toMatch(/sm:absolute sm:top-full/);
  expect(alert.closest("form")!.className).toContain("relative");
});

// Kept to one line on wide screens: two lines inside the form's width ran past the page's padding into the footer.
test("a refused date's message keeps to one line on wide screens", () => {
  render(<PickADay today={TODAY} />);
  fireEvent.change(field(), { target: { value: "2021-01-01" } });
  fireEvent.click(screen.getByRole("button", { name: "Go" }));
  expect(screen.getByRole("alert").className).toMatch(/max-sm:w-full sm:w-max/);
});
