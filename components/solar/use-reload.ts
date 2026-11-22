"use client";

import { useRef, useState } from "react";

// Data the server rendered for `key`, replaced by fresher data fetched for that same key. Only the latest request's
// answer is kept, so a slow one can't overwrite a newer one, and a failed one leaves the data as it was and resolves
// false, for a page that says how old its figures are.
export function useReload<T>(key: string, served: T) {
  const [reloaded, setReloaded] = useState<{ key: string; value: T } | null>(null);
  const latest = useRef(0);
  const reload = async <B>(url: string, pick: (body: B) => T) => {
    const request = ++latest.current;
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`${url} answered ${response.status}`);
      const value = pick(await response.json());
      if (latest.current === request) setReloaded({ key, value });
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  };
  return [reloaded?.key === key ? reloaded.value : served, reload] as const;
}
