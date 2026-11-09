# site-serving Specification

## Purpose

How the Next.js dashboard is served from onyx: only through its Cloudflare tunnel, with security headers on every response, and deployed so that a failing build never replaces the running site.

## Requirements

### Requirement: The site is reachable only through the tunnel
The app SHALL NOT be published on the server's network. Only its Cloudflare tunnel SHALL reach it, over the containers' own network, so no machine on the home network can bypass Cloudflare.

#### Scenario: Direct to the app
- **WHEN** a machine on the home network requests port 3000 on the server
- **THEN** nothing answers

#### Scenario: Through the tunnel
- **WHEN** a browser opens https://teslasolar.report
- **THEN** the dashboard loads

### Requirement: Security headers
Every response SHALL carry HSTS for one year (with subdomains, without preload), `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, a `Referrer-Policy`, and a `Permissions-Policy` that turns off device features the site doesn't use. Responses SHALL NOT name the framework they were made with.

#### Scenario: Headers on a page
- **WHEN** a browser opens `/`
- **THEN** the response carries each of these headers, and no `X-Powered-By`

### Requirement: Content-Security-Policy
Every page SHALL carry a Content-Security-Policy that allows scripts only from the site and by a nonce new for each response, and connections, fonts and images only from the site (images may also be `data:` and `blob:`). It SHALL allow Cloudflare Web Analytics, which Cloudflare injects into every page, and SHALL refuse framing by any site.

#### Scenario: A fresh nonce
- **WHEN** the same page is requested twice
- **THEN** the two responses' CSPs carry different nonces, and each page's scripts carry its own response's nonce

#### Scenario: Framed by another site
- **WHEN** another site puts the dashboard in a frame
- **THEN** the browser refuses to show it

### Requirement: Every page works under the policy
No page SHALL break under the security headers: opening each page SHALL produce no Content-Security-Policy violations, and Cloudflare's analytics beacon SHALL load and report.

#### Scenario: Opening each page
- **WHEN** each of the five page addresses is opened in a browser with no content blockers
- **THEN** the browser reports no CSP violations, and the beacon's report to `/cdn-cgi/rum` succeeds

### Requirement: The preview address redirects
https://next.teslasolar.report SHALL answer every request with a permanent redirect to https://teslasolar.report, keeping the path and query, so links from before the cutover still open.

#### Scenario: A shared replay link
- **WHEN** a browser opens https://next.teslasolar.report/distribution?at=2026-11-07T12:30
- **THEN** it is sent with status 301 to https://teslasolar.report/distribution?at=2026-11-07T12:30
