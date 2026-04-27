# syntax=docker/dockerfile:1

# ── 1. prune ──────────────────────────────────────────────────────────────────
FROM node:20-alpine AS pruner
WORKDIR /app
RUN npm install -g turbo
COPY . .
RUN turbo prune backend --docker

# ── 2. build ──────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Bring in the root workspace definitions and lockfile
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/package-lock.json ./package-lock.json

# Install ALL dependencies (Dev + Prod) so TypeScript can compile
RUN npm install --ignore-scripts

# To bake in backend url to medusas react admin app
ARG MEDUSA_BACKEND_URL
ENV MEDUSA_BACKEND_URL=$MEDUSA_BACKEND_URL

# Copy the actual source code and build it
COPY --from=pruner /app/out/full/ .
RUN npx turbo run build --filter=backend...

# Slim the image: Strip out dev dependencies from the entire workspace.
# Because the workspace is still intact, this safely removes TypeScript 
# but keeps local shared packages (@ecommerce/utils) alive and symlinked!
RUN npm prune --omit=dev

# ── 3. production image ───────────────────────────────────────────────────────
FROM node:20-alpine AS runner

# Lock into production mode so Medusa uses the compiled files
ENV NODE_ENV=production

WORKDIR /app

# Copy the ENTIRE pruned workspace.
# This ensures local monorepo symlinks stay perfectly connected.
COPY --from=builder /app .

# Move the working directory INSIDE the compiled artifact
WORKDIR /app/apps/backend/.medusa/server

EXPOSE 9000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget -qO- http://localhost:9000/health || exit 1

# Start the application natively
CMD ["npx", "medusa", "start"]