# syntax=docker/dockerfile:1
#
# Build context must be the monorepo root:
#   docker build -f backend.Dockerfile -t ecommerce-backend .

# ── prune ─────────────────────────────────────────────────────────────────────
# turbo prune produces a minimal subset of the monorepo — only the packages and
# lockfile entries the backend actually needs.
FROM node:20-alpine AS pruner
WORKDIR /app
RUN npm install -g turbo
COPY . .
RUN turbo prune backend --docker

# ── install (all deps, needed for the build) ──────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/package-lock.json ./package-lock.json
RUN npm install --ignore-scripts

# ── install (prod deps only, for the runtime image) ───────────────────────────
# Standalone (non-workspace) install so all binaries land in /app/node_modules/.bin.
# @ecommerce/* are devDeps so --omit=dev drops them without a registry lookup.
FROM node:20-alpine AS prod-deps
WORKDIR /app
COPY --from=pruner /app/out/full/apps/backend/package.json ./package.json
RUN npm install --omit=dev --ignore-scripts

# ── build ─────────────────────────────────────────────────────────────────────
FROM deps AS builder
WORKDIR /app
COPY --from=pruner /app/out/full/ .
RUN npx turbo run build --filter=backend...

# ── production image ──────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/apps/backend/.medusa/server ./
COPY --from=prod-deps /app/node_modules ./node_modules

EXPOSE 9000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget -qO- http://localhost:9000/health || exit 1

CMD ["node", "node_modules/@medusajs/cli/cli.js", "start"]
