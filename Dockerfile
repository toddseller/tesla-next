# Keep in step with .nvmrc.
FROM node:24.22.2-alpine3.24 AS deps
WORKDIR /app
# The tests' PostgreSQL won't initialize as root, so everything up to the build runs as node.
RUN chown node:node /app
USER node
COPY --chown=node:node package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# The weekly audit builds this stage alone.
FROM deps AS test
USER root
# bash and git for the bin/deploy test, which runs the real script against throwaway repositories.
RUN apk add --no-cache postgresql18 bash git
USER node
COPY --chown=node:node . .
# bin/deploy and deploy/weekly-audit pass a new value, so the audit reruns against
# today's advisories even when nothing above it changed and Docker would reuse its result.
ARG AUDIT_RUN
# Build-tool advisories are listed but never fail the build; a high or critical one in a
# shipped package does, unless waived in scripts/audit.mjs with a reason.
RUN (yarn audit --groups devDependencies || true) \
    && yarn audit --groups dependencies --json | node scripts/audit.mjs \
    && yarn vitest run

FROM test AS build
RUN yarn build

FROM node:24.22.2-alpine3.24
WORKDIR /app
ENV NODE_ENV=production HOSTNAME=0.0.0.0 PORT=3000
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
USER node
EXPOSE 3000
CMD ["node", "server.js"]
