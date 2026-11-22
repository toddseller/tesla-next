import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

export function Doorway({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="group inline-flex min-h-11 items-center gap-2 self-start rounded-md border border-input bg-input/30 px-4 text-sm font-medium transition-colors hover:bg-secondary">
      {children}
      <ArrowRight size={16} aria-hidden className="transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
