"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";

import { useTween } from "@/components/use-tween";

// Whether the page is on its first view. A new range brings new tiles, which mount like a first view's but mustn't count.
const FirstViewContext = createContext(true);
export const FirstView = FirstViewContext.Provider;

// The first figure in a preformatted text, like "$1,840.50" or "12.5%".
const FIGURE = /\d[\d,]*(\.\d+)?/;

// A figure in finished text that counts up from zero on first view, keeping its separators, decimals and the text around
// it. The final text, transparent under the count, keeps the width and is what a screen reader gets; later texts show
// as they are, never counting.
export function CountUp({ text }: { text: string }) {
  const first = useRef(text).current;
  const counts = useRef(useContext(FirstViewContext)).current;
  // Until the page's JavaScript runs, server and browser render the same blank figure: no zero that isn't true, and
  // no mismatch when the browser, unlike the server, knows the viewer reduces motion.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const match = first.match(FIGURE);
  const target = match ? Number(match[0].replaceAll(",", "")) : 0;
  const shown = useTween(target, counts ? 0 : target);
  if (!match || !counts || text !== first) return <span>{text}</span>;
  const decimals = match[1] ? match[1].length - 1 : 0;
  const figure = shown.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals, useGrouping: match[0].includes(",") });
  const counting = first.replace(FIGURE, figure);
  if (hydrated && counting === text) return <span>{text}</span>;
  return (
    <span className="relative inline-block">
      <span data-part="final" className="text-transparent">{text}</span>
      <span data-part="counting" aria-hidden="true" className={`absolute inset-0 ${hydrated ? "" : "text-transparent"}`}>{hydrated ? counting : text}</span>
    </span>
  );
}
