// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { Bar, BarChart } from "recharts";
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
