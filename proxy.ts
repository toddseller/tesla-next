import { NextRequest, NextResponse } from "next/server";
import { csp } from "@/lib/csp";

export function proxy(request: NextRequest) {
  const policy = csp(Buffer.from(crypto.randomUUID()).toString("base64"));
  // Next.js reads the nonce from the request's policy and puts it on its own scripts.
  const headers = new Headers(request.headers);
  headers.set("Content-Security-Policy", policy);
  const response = NextResponse.next({ request: { headers } });
  response.headers.set("Content-Security-Policy", policy);
  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
