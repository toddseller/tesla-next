// A value axis tick labeled by `label`, which sees the tick's place among the axis's ticks (for a unit on the top one).
export function AxisTick({ x, y, payload, index = 0, visibleTicksCount = 0, label, anchor = "end" }: {
  x?: number; y?: number; payload?: { value: number }; index?: number; visibleTicksCount?: number;
  label: (value: number, index: number, count: number) => string; anchor?: "start" | "end";
}) {
  return (
    <text x={x} y={y} dy={4} dx={anchor === "start" ? 6 : 0} textAnchor={anchor} className="fill-muted-foreground font-mono text-xs">
      {label(payload?.value ?? 0, index, visibleTicksCount)}
    </text>
  );
}
