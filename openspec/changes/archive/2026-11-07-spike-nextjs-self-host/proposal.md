# Proposal

## Why

Moving the Tesla Solar Report (anton-tesla-api-ws) to Next.js gives server-rendered pages and drops nginx. The plan is that every browser request goes through Next.js and Flask is left as a worker for the scheduler and scripts, with no HTTP. Before writing the real migration proposal, we need proof that the riskiest parts work on onyx behind the Cloudflare Tunnel. Those parts have no counterpart in today's stack: live updates over Server-Sent Events (SSE) in place of Socket.IO, direct database reads from Next.js, and a CSP that works with Next.js's inline hydration scripts.

## What Changes

- A throwaway Next.js app in this repository (tesla-next), built as a standalone image for linux/amd64 and run on onyx in its own compose project, reachable only through a test hostname on its own cloudflared tunnel.
- Five checks, each with a pass/fail result recorded in this change's design.md under **Findings**:
  1. SSE: a Postgres `NOTIFY` reaches an open browser through the tunnel in under 1 s, with no buffering by Next.js compression or Cloudflare. This one goes first because it carries the most risk.
  2. Self-hosting: the standalone image runs on onyx under compose, and cloudflared reaches it.
  3. Rendering: a page server-renders shadcn/ui components (Tailwind 4) and a Chart.js chart under the app router, then hydrates with no warnings.
  4. Database: a server component reads the production `tsr` database as `tsr_app` from onyx, in read-only transactions.
  5. CSP: a per-request nonce allows Next.js's scripts and Cloudflare's analytics beacon, and the browser reports no CSP violations.
- The UI is built with shadcn/ui instead of MUI, which the dashboard barely uses (7 files) and which needs Emotion at runtime. Chart.js stays, because its charts are heavily customized and switching libraries gives server rendering nothing.
- Nothing about the live site changes: no change to teslasolar.report, Flask, nginx, or `tsr-tunnel`, and no database writes.

## Capabilities

### New Capabilities

None. The spike proves feasibility and leaves no behavior to keep, so `.openspec.yaml` sets `skip_specs: true`. The capabilities belong to the migration proposal this spike feeds.

### Modified Capabilities

None.

## Impact

- **tesla-next repository**: a Next.js app (Node 24, matching the dashboard's `.nvmrc`) with Tailwind 4, shadcn/ui and Chart.js, a Dockerfile, and a `docker-compose.yml` for onyx.
- **onyx**: a new `~/tesla-next` compose project and a `~/tesla-next-tunnel` container, both removed or kept depending on the findings.
- **Cloudflare**: a new tunnel and a test hostname (for example `next.teslasolar.report`). The user creates both in the dashboard.
- **Production database**: read-only queries and `NOTIFY` on a spike-only channel, sent as `tsr_app` from onyx. No schema or data changes.
- **Output**: a findings section in design.md, which the real migration proposal builds on.
