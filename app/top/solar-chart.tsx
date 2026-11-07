"use client";

import { BarElement, CategoryScale, Chart, LinearScale, Tooltip } from "chart.js";
import { Bar } from "react-chartjs-2";

Chart.register(BarElement, CategoryScale, LinearScale, Tooltip);

export function SolarChart({ days }: { days: { date: string; solar: number | null }[] }) {
  return (
    <Bar
      data={{
        labels: days.map((d) => d.date),
        datasets: [{ label: "Solar (kWh)", data: days.map((d) => d.solar), backgroundColor: "#cc0000" }],
      }}
    />
  );
}
