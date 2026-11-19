FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /repo
ARG APP
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY apps ./apps
COPY packages ./packages
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @cedarce/db generate
ENV NODE_ENV=production
CMD ["sh", "-c", "pnpm --filter @cedarce/${APP} start"]
