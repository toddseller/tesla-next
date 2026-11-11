"use client";

import { useTween } from "@/components/use-tween";

// A figure that rolls to a new value. Screen readers get the new value at once, never one in between.
export function Rolling({ value, format }: { value: number; format: (value: number) => string }) {
  const shown = format(useTween(value));
  const final = format(value);
  if (shown === final) return <span>{final}</span>;
  return (
    <>
      <span aria-hidden="true">{shown}</span>
      <span className="sr-only">{final}</span>
    </>
  );
}
