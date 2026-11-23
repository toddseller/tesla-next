export const SERIES = ["solar", "grid", "powerwall", "house"] as const;
type Key = (typeof SERIES)[number];
export type Bar = Record<Key, number | null>;

// A bar stacks negative Powerwall and negative grid below zero, then solar, positive grid and positive Powerwall upward;
// only its outermost sections round. House use is a mark at its own value, not a section, so it never rounds.
export function stackEnds(bar: Bar): Record<Key, { top: boolean; bottom: boolean }> {
  const [grid, powerwall] = [bar.grid ?? 0, bar.powerwall ?? 0];
  const order = [
    ...(powerwall < 0 ? ["powerwall" as const] : []), ...(grid < 0 ? ["grid" as const] : []), "solar" as const,
    ...(grid > 0 ? ["grid" as const] : []), ...(powerwall > 0 ? ["powerwall" as const] : []),
  ].filter((key) => (bar[key] ?? 0) !== 0);
  return Object.fromEntries(SERIES.map((key) => [key, { top: key === order.at(-1), bottom: key === order[0] }])) as Record<Key, { top: boolean; bottom: boolean }>;
}
