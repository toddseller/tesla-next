"use client";

import type { ReactNode } from "react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TERMS, type TermName } from "@/lib/terms";

// A popover rather than a tooltip, since a tooltip never opens on touch.
export function Term({ name, children }: { name: TermName; children: ReactNode }) {
  return (
    <Popover>
      <PopoverTrigger className="tap-area cursor-help font-[inherit] text-inherit underline decoration-muted-foreground decoration-dotted underline-offset-4 outline-none focus-visible:rounded-sm focus-visible:ring-[3px] focus-visible:ring-ring">
        {children}
      </PopoverTrigger>
      <PopoverContent aria-label={TERMS[name].term} collisionPadding={16} className="border-input bg-card text-[13px] leading-relaxed text-foreground shadow-xl shadow-black/45">
        {TERMS[name].definition}
      </PopoverContent>
    </Popover>
  );
}

// Hints terms inside a line the text functions return as a string, so they stay plain strings: each term at its first
// match that isn't the start of a longer word ("NEM" isn't hinted inside "NEM2").
const literally = (words: string) => words.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function WithTerm({ text, terms }: { text: string; terms: TermName[] }) {
  const found = terms
    .map((name) => ({ name, words: TERMS[name].term, at: text.search(new RegExp(`${literally(TERMS[name].term)}(?!\\w)`)) }))
    .filter((t) => t.at >= 0)
    .sort((a, b) => a.at - b.at);
  if (!found.length) return text;
  const parts: ReactNode[] = [];
  let from = 0;
  for (const { name, words, at } of found) {
    parts.push(text.slice(from, at), <Term key={name} name={name}>{words}</Term>);
    from = at + words.length;
  }
  parts.push(text.slice(from));
  return <>{parts}</>;
}
