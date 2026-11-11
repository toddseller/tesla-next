"use client";

import { usePathname } from "next/navigation";
import { type ReactNode, useEffect, useSyncExternalStore, ViewTransition } from "react";

type Direction = "next" | "previous";

// The way the last tab change went, until its page arrives. Next's transition types would carry it, but a change to a
// page with no client component (Patterns) commits without them, so the top bar records it here instead.
let direction: Direction | null = null;
const listeners = new Set<() => void>();
const set = (next: Direction | null) => {
  direction = next;
  listeners.forEach((listener) => listener());
};
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const slidePage = (next: Direction) => set(next);

// The page content, sliding the way a tab change went; ranges, days and links inside a page leave it still.
export function PageSlide({ children }: { children: ReactNode }) {
  const way = useSyncExternalStore(subscribe, () => direction, () => null);
  const path = usePathname();
  useEffect(() => set(null), [path]);
  return <ViewTransition default={way ? `slide-${way}` : "none"}>{children}</ViewTransition>;
}
