# Multi-stage build for CyberOracle API server
# Copies monorepo context, installs deps, builds server with standalone output

# ---------- base ----------
FROM node:20-bookworm-slim AS base
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
WORKDIR /repo

# ---------- deps ----------
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./
COPY apps/server/package.json apps/server/
COPY packages/core/package.json packages/core/
COPY packages/poster/package.json packages/poster/
RUN pnpm install --frozen-lockfile --filter=@cyberoracle/server...

# ---------- builder ----------
FROM base AS builder
COPY --from=deps /repo /repo
COPY . .
ENV CI=1
RUN pnpm --filter=@cyberoracle/server build

# ---------- runner ----------
FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /repo/apps/server/.next/standalone ./
COPY --from=builder /repo/apps/server/.next/static ./apps/server/.next/static
COPY --from=builder /repo/apps/server/public ./apps/server/public
COPY --from=builder /repo/packages/poster/fonts ./packages/poster/fonts

EXPOSE 3001
CMD ["node", "apps/server/server.js"]
