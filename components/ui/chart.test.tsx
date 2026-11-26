// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { Bar, BarChart, XAxis } from "recharts";
import { afterEach, expect, test } from "vitest";

import { ChartContainer } from "@/components/ui/chart";

afterEach(cleanup);

// jsdom has no ResizeObserver, so the chart draws at its initial size: enough for the charts' tests to see their bars.
test("a chart draws its bars in its container", () => {
  const { container } = render(
    <ChartContainer config={{ solar: { label: "Solar" } }}>
      <BarChart data={[{ solar: 1 }]}>
        <Bar dataKey="solar" fill="var(--color-solar)" isAnimationActive={false} />
      </BarChart>
    </ChartContainer>,
  );
  expect(container.querySelector("[data-slot=chart] svg.recharts-surface")).not.toBeNull();
  expect(container.querySelectorAll(".recharts-bar-rectangle")).toHaveLength(1);
});

// dashboard-shell, "Chart axis labels are readable": Recharts' default labels are #666, about 3:1 on the card. jsdom
// doesn't apply Tailwind, so the test checks the container's variant selects the label text, which a Recharts upgrade
// broke once.
test("the container's muted fill reaches the axis labels", () => {
  const { container } = render(
    <ChartContainer config={{ solar: { label: "Solar" } }}>
      <BarChart data={[{ name: "Nov 1", solar: 1 }]}>
        <XAxis dataKey="name" />
        <Bar dataKey="solar" isAnimationActive={false} />
      </BarChart>
    </ChartContainer>,
  );
  const chart = container.querySelector<HTMLElement>("[data-slot=chart]")!;
  const variant = [...chart.classList].find((name) => name.endsWith("]:fill-muted-foreground"))!;
  const selector = variant.slice(2, variant.indexOf("]:")).replaceAll("_", " ");
  const labels = chart.querySelectorAll(".recharts-cartesian-axis-tick-value");

  expect(labels).not.toHaveLength(0);
  expect([...chart.querySelectorAll(selector)]).toEqual([...labels]);
});
