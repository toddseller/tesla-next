# Spec Delta

## Purpose

How the Next.js dashboard is served from onyx: only through its Cloudflare tunnel, with security headers on every response, and deployed so that a failing build never replaces the running site.

## ADDED Requirements

### Requirement: The site is reachable only through the tunnel
The app SHALL NOT be published on the server's network. Only its Cloudflare tunnel SHALL reach it, over the containers' own network, so no machine on the home network can bypass Cloudflare.

#### Scenario: Direct to the app
- **WHEN** a machine on the home network requests port 3000 on the server
- **THEN** nothing answers

#### Scenario: Through the tunnel
- **WHEN** a browser opens https://next.teslasolar.report
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

### Requirement: A failing deploy keeps the running site
A push to the server's `main` SHALL deploy that commit. The deploy SHALL audit the shipped dependencies and run every test before it replaces the running app; when either fails, the push SHALL report the failure and the site SHALL keep running the previous version.

#### Scenario: A passing deploy
- **WHEN** a commit whose audit and tests pass is pushed to the server's `main`
- **THEN** the site serves that commit within a few minutes

#### Scenario: A failing test
- **WHEN** a commit with a failing test is pushed
- **THEN** the push output names the failing test, and the site keeps serving the previous commit

#### Scenario: Another branch
- **WHEN** a branch other than `main` is pushed to the server
- **THEN** nothing is deployed, and the push says only `main` is deployed
