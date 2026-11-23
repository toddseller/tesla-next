import Link from "next/link";

import { PickADay } from "@/components/home/pick-a-day";
import { LEAD } from "@/components/lead";
import { PathHere } from "@/components/path-here";
import { siteToday } from "@/lib/scene/replay";

export const metadata = { title: "Not found" };

export default function NotFound() {
  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-3">
        <h1 className="text-[28px] font-semibold tracking-[-0.02em]">You&apos;ve gone off-grid</h1>
        <p className={`${LEAD} break-words`}>
          <PathHere /> isn&apos;t a page on the site, so nothing is flowing here.
        </p>
      </div>
      <PickADay today={siteToday()} />
      <Link href="/" className="flex min-h-11 w-fit items-center text-[15px] text-muted-foreground underline underline-offset-4 hover:text-foreground">
        Or head back home
      </Link>
    </div>
  );
}
