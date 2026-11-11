"use client";

import { useEffect, useRef, useState } from "react";

const TWEEN_MS = 400;

const reducedMotion = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

// The figure shown while `value` moves to a new one: from wherever it is now, easing out, so a change mid-way
// doesn't jump back. The first render shows `value` itself, so the server's HTML and hydration agree.
export function useTween(value: number) {
  const [shown, setShown] = useState(value);
  const at = useRef(value);
  useEffect(() => {
    if (reducedMotion()) {
      at.current = value;
      return;
    }
    const from = at.current;
    const start = performance.now();
    let frame = requestAnimationFrame(function step(now) {
      const progress = Math.min(1, (now - start) / TWEEN_MS);
      at.current = progress < 1 ? from + (value - from) * (1 - (1 - progress) ** 3) : value;
      setShown(at.current);
      if (progress < 1) frame = requestAnimationFrame(step);
    });
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return reducedMotion() ? value : shown;
}
