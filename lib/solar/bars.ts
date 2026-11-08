export const SERIES = ["solar", "grid", "house"] as const;
type Key = (typeof SERIES)[number];
export type Bar = Record<Key, number | null>;

// A bar stacks negative grid below zero, then solar, positive grid and house upward; only its outermost sections round.
export function stackEnds(bar: Bar): Record<Key, { top: boolean; bottom: boolean }> {
  const grid = bar.grid ?? 0;
  const order = [...(grid < 0 ? ["grid" as const] : []), "solar" as const, ...(grid > 0 ? ["grid" as const] : []), "house" as const]
    .filter((key) => (bar[key] ?? 0) !== 0);
  return Object.fromEntries(SERIES.map((key) => [key, { top: key === order.at(-1), bottom: key === order[0] }])) as Record<Key, { top: boolean; bottom: boolean }>;
}
