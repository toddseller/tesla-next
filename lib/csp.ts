// static.cloudflareinsights.com is Cloudflare Web Analytics' beacon, which Cloudflare injects into every page with the page's nonce.
// style-src keeps 'unsafe-inline': Radix positions popovers and Chart.js sizes its canvas with style attributes.
// 'unsafe-eval' only in development, where React rebuilds server error stacks with eval.
export const csp = (nonce: string) =>
  [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""} https://static.cloudflareinsights.com`,
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self'",
    "img-src 'self' data: blob:",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
