"use client";

import { usePathname } from "next/navigation";

// A not-found page gets no params and the request no path header, so the address it names comes from the browser's.
export function PathHere() {
  return usePathname();
}
