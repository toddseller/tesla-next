# Keep in step with .nvmrc.
FROM node:24.22.2-alpine3.24 AS build
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . .
# Tests run before the build, so a failing test stops the image.
RUN yarn vitest run && yarn build

FROM node:24.22.2-alpine3.24
WORKDIR /app
ENV NODE_ENV=production HOSTNAME=0.0.0.0 PORT=3000
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
USER node
EXPOSE 3000
CMD ["node", "server.js"]
