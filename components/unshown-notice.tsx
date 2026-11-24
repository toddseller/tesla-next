"use client";

import { useEffect } from "react";

import { type Range, rangeTitle } from "@/lib/solar/ranges";

// The line stays from the served page's props; the marker leaves the address so a reload or a copied link doesn't repeat it.
export function UnshownNotice({ range }: { range?: Range }) {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.delete("unshown");
    const query = params.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
  }, []);
  if (!range) return null;
  return (
    <p role="status" className="basis-full text-sm text-muted-foreground">
      {`That link asked for dates the site doesn't have, so this shows ${rangeTitle(range)}.`}
    </p>
  );
}
