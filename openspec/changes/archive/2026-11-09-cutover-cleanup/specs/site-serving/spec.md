# Spec Delta

## ADDED Requirements

### Requirement: The preview address redirects
https://next.teslasolar.report SHALL answer every request with a permanent redirect to https://teslasolar.report, keeping the path and query, so links from before the cutover still open.

#### Scenario: A shared replay link
- **WHEN** a browser opens https://next.teslasolar.report/distribution?at=2026-11-07T12:30
- **THEN** it is sent with status 301 to https://teslasolar.report/distribution?at=2026-11-07T12:30

## MODIFIED Requirements

### Requirement: The site is reachable only through the tunnel
The app SHALL NOT be published on the server's network. Only its Cloudflare tunnel SHALL reach it, over the containers' own network, so no machine on the home network can bypass Cloudflare.

#### Scenario: Direct to the app
- **WHEN** a machine on the home network requests port 3000 on the server
- **THEN** nothing answers

#### Scenario: Through the tunnel
- **WHEN** a browser opens https://teslasolar.report
- **THEN** the dashboard loads
