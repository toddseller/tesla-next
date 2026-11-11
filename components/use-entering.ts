"use client";

import { useEffect, useState } from "react";

// The longest enter: 450 ms plus the stagger's 200 ms cap.
export const ENTER_MS = 650;

// Whether a chart is still drawing in. Recharts rebuilds its marks on every render, so a mark can't rely on mounting
// to animate only once: it draws in while this is true, and a later render, a reload's, finds it false.
export function useEntering(ms: number) {
  const [entering, setEntering] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setEntering(false), ms);
    return () => clearTimeout(timer);
  }, [ms]);
  return entering;
}
