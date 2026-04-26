# syntax=docker/dockerfile:1
#
# Build context must be the monorepo root:
#   docker build -f apps/backend/Dockerfile -t ecommerce-backend .
#
# The image is for production. For local development, run the backend with
# `npm run dev:backend` and let docker-compose supply the database.

# ── base ─────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS base

# ── install all workspace deps (including devDeps needed for the build) ───────
FROM node:20-alpine AS deps
WORKDIR /app

# Copy manifests only — layers cache until manifests change
COPY package.json package-lock.json* turbo.json ./
COPY packages/types/package.json  ./packages/types/package.json
COPY packages/utils/package.json  ./packages/utils/package.json
COPY apps/backend/package.json    ./apps/backend/package.json

# Use --ignore-scripts to avoid running lifecycle scripts before the full source
# is present. Scripts that need source (e.g. prepare) run in the builder stage.
RUN npm install --ignore-scripts

# ── build ─────────────────────────────────────────────────────────────────────
FROM deps AS builder
WORKDIR /app

# Copy source for the packages the backend depends on
COPY packages/types/ ./packages/types/
COPY packages/utils/ ./packages/utils/
COPY apps/backend/   ./apps/backend/

# Build shared packages, then the backend.
# `medusa build` compiles TS, builds the admin, and outputs a self-contained
# server bundle to apps/backend/.medusa/server/
RUN npm run build -w packages/types && \
    npm run build -w packages/utils && \
    npm run build -w apps/backend

# ── production image ──────────────────────────────────────────────────────────
FROM base AS runner
WORKDIR /app

# Medusa v2 `medusa build` produces a self-contained bundle here.
# It includes its own package.json listing only production dependencies.
COPY --from=builder /app/apps/backend/.medusa/server ./

# Install only production deps declared by the bundle's own package.json
RUN npm install --omit=dev --ignore-scripts && \
    # Remove npm cache to keep the layer small
    npm cache clean --force

EXPOSE 9000

# Lightweight health check — Medusa exposes /health out of the box
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget -qO- http://localhost:9000/health || exit 1

CMD ["node", "index.js"]
